import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ECGAnalysis from '../models/ECGAnalysis.js';
import SpecialistReview from '../models/SpecialistReview.js';
import { predictECG } from '../services/mlService.js';
import { sendResponse } from '../utils/responseHandler.js';
import { logAction } from '../services/auditService.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tempUploadDir = path.resolve(__dirname, '../../temp_uploads/ecg');
const processedUploadDir = path.resolve(__dirname, '../../uploads/ecg/processed');
const failedUploadDir = path.resolve(__dirname, '../../uploads/ecg/failed');

fs.mkdirSync(tempUploadDir, { recursive: true });
fs.mkdirSync(processedUploadDir, { recursive: true });
fs.mkdirSync(failedUploadDir, { recursive: true });

const router = express.Router();

// Configure multer for ECG file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ecg-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit for ECG files
  fileFilter: (req, file, cb) => {
    // Accept ECG-related file types
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/tiff',
      'text/csv', 'application/json',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only ECG images, CSV, JSON, and Excel files are allowed.'), false);
    }
  }
});

const mapGenderToNumeric = (gender) => {
  if (gender === 'male') return 1;
  if (gender === 'female') return 0;
  return 2;
};

const normalizeRhythm = (value) => {
  const rhythm = String(value || 'normal')
    .toLowerCase()
    .replace(/[\[\]'"()]/g, '')
    .trim();

  if (['normal', 'nsr'].includes(rhythm)) return 'normal';
  if (['atrial fibrillation', 'afib', 'atrial_fibrillation'].includes(rhythm)) return 'atrial_fibrillation';
  if (['atrial flutter', 'atrial_flutter'].includes(rhythm)) return 'atrial_flutter';
  if (['ventricular tachycardia', 'vt', 'ventricular_tachycardia'].includes(rhythm)) return 'ventricular_tachycardia';
  if (['bradycardia'].includes(rhythm)) return 'bradycardia';

  return 'other';
};

const toAnalysisResult = (prediction, processingTime) => {
  const payload = prediction?.prediction || prediction?.predictions || prediction || {};
  const imageAnalysis = prediction?.image_analysis || {};
  const topRhythms = payload.top_rhythms || {};
  const bestRhythm = normalizeRhythm(payload.best_rhythm || payload.rhythm || payload.label);
  const topRhythmScore = Object.values(topRhythms)?.[0];
  const parsedConfidence = typeof topRhythmScore === 'string'
    ? Number.parseFloat(topRhythmScore.replace('%', ''))
    : Number(topRhythmScore || 0);

  const abnormalities = Array.isArray(payload.abnormalities)
    ? payload.abnormalities
    : Array.isArray(payload.abnormality)
      ? payload.abnormality
      : [];

  // labelProbabilities: accept object or Map-like from Flask
  const rawProbs = payload.label_probabilities ?? payload.labelProbabilities ?? topRhythms ?? {};
  const labelProbabilities = Object.fromEntries(
    Object.entries(rawProbs).map(([k, v]) => [
      k,
      typeof v === 'string' ? Number.parseFloat(v.replace('%', '')) : Number(v)
    ])
  );

  return {
    rhythm: bestRhythm,
    heartRate: imageAnalysis.heart_rate ?? payload.heartRate ?? payload.VentricularRate ?? payload.ventricularRate ?? null,
    qrsDuration: payload.qrsDuration ?? payload.QRSDuration ?? null,
    qtInterval: payload.qtInterval ?? payload.QTInterval ?? null,
    abnormalities,
    confidence: Number.isFinite(parsedConfidence) ? parsedConfidence : (payload.confidence ?? payload.score ?? 0),
    aiModel: payload.aiModel || 'ecg_genius_v1',
    modelVersion: payload.modelVersion || 'v1.0.0',
    processingTime,
    predictedLabels: Array.isArray(payload.predicted_labels ?? payload.predictedLabels)
      ? (payload.predicted_labels ?? payload.predictedLabels)
      : [],
    labelProbabilities,
    signalMetrics: payload.signal_metrics ?? payload.signalMetrics ?? null,
    ontologyEnrichment: Array.isArray(payload.ontology_enrichment ?? payload.ontologyEnrichment)
      ? (payload.ontology_enrichment ?? payload.ontologyEnrichment)
      : [],
    explanation: payload.explanation ?? null
  };
};

const moveFile = async (sourcePath, destinationDir, destinationName) => {
  await fsp.mkdir(destinationDir, { recursive: true });
  const destinationPath = path.join(destinationDir, destinationName);
  await fsp.rename(sourcePath, destinationPath);
  return destinationPath;
};

// Upload ECG file
router.post('/upload', upload.single('ecgFile'), async (req, res) => {
  try {
    if (!req.file) {
      return sendResponse(res, 400, false, 'No ECG file uploaded');
    }

    const { patientName, patientAge, patientGender, notes } = req.body;
    const userId = req.user?._id || req.user?.id;
    const age = Number(patientAge || 0);
    const genderValue = mapGenderToNumeric(patientGender);
    const startedAt = Date.now();

    const prediction = await predictECG(req.file.path, age, genderValue);
    const processingTime = Date.now() - startedAt;
    const finalFilePath = await moveFile(req.file.path, processedUploadDir, req.file.filename);

    const mlUnavailable = prediction === null;
    const analysisResult = mlUnavailable ? null : toAnalysisResult(prediction, processingTime);

    const ecgAnalysis = new ECGAnalysis({
      userId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: finalFilePath,
      fileSize: req.file.size,
      patientInfo: {
        name: patientName,
        age,
        gender: patientGender
      },
      notes,
      status: mlUnavailable ? 'pending' : 'completed',
      ...(analysisResult && { analysisResult }),
      ...(mlUnavailable ? {} : { processedAt: new Date() })
    });

    await ecgAnalysis.save();
    logAction({ req, userId, entityType: 'ECG_ANALYSIS', entityId: ecgAnalysis._id, action: 'UPLOAD', newValue: { fileName: ecgAnalysis.fileName, status: ecgAnalysis.status } });

    if (mlUnavailable) {
      return sendResponse(res, 202, true, 'ECG uploaded — analysis pending (ML service unavailable)', {
        analysisId: ecgAnalysis._id,
        fileName: req.file.filename,
        filePath: finalFilePath
      });
    }

    return sendResponse(res, 201, true, 'ECG analyzed successfully', {
      analysisId: ecgAnalysis._id,
      fileName: req.file.filename,
      filePath: finalFilePath,
      analysisResult
    });

  } catch (error) {
    console.error('ECG upload error:', error);

    if (req.file?.path) {
      try {
        await moveFile(req.file.path, failedUploadDir, req.file.filename);
      } catch (moveError) {
        console.error('Failed to move ECG file to failed folder:', moveError);
      }
    }

    const { patientName, patientAge, patientGender, notes } = req.body;
    const userId = req.user?._id || req.user?.id;

    try {
      const ecgAnalysis = new ECGAnalysis({
        userId,
        fileName: req.file?.filename,
        originalName: req.file?.originalname,
        filePath: req.file?.path,
        fileSize: req.file?.size,
        patientInfo: {
          name: patientName,
          age: Number(patientAge || 0),
          gender: patientGender
        },
        notes,
        status: 'failed',
        failureReason: error.message
      });

      await ecgAnalysis.save();
    } catch (saveError) {
      console.error('Failed to save failed ECG analysis:', saveError);
    }

    return sendResponse(res, 500, false, 'Failed to upload and analyze ECG file', {
      error: error.message
    });
  }
});

// Get user's ECG analyses (paginated)
router.get('/my-analyses', async (req, res) => {
  try {
    const userId = req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (req.query.status) filter.status = req.query.status;

    const [analyses, total] = await Promise.all([
      ECGAnalysis.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-filePath'),
      ECGAnalysis.countDocuments(filter)
    ]);

    return sendResponse(res, 200, true, 'Analyses fetched successfully', {
      analyses,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching ECG analyses:', error);
    return sendResponse(res, 500, false, 'Failed to fetch ECG analyses');
  }
});

// Get specific ECG analysis
router.get('/analysis/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const analysis = await ECGAnalysis.findOne({ _id: id, userId });
    
    if (!analysis) {
      return res.status(404).json({ error: 'ECG analysis not found' });
    }

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Error fetching ECG analysis:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ECG analysis',
      message: error.message 
    });
  }
});

// Delete ECG analysis
router.delete('/analysis/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const analysis = await ECGAnalysis.findOneAndDelete({ _id: id, userId });

    if (!analysis) {
      return res.status(404).json({ error: 'ECG analysis not found' });
    }

    logAction({ req, userId, entityType: 'ECG_ANALYSIS', entityId: analysis._id, action: 'DELETE', oldValue: { fileName: analysis.fileName, status: analysis.status } });

    res.json({
      success: true,
      message: 'ECG analysis deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting ECG analysis:', error);
    res.status(500).json({ 
      error: 'Failed to delete ECG analysis',
      message: error.message 
    });
  }
});

// Update ECG analysis notes
router.patch('/analysis/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    const analysis = await ECGAnalysis.findOneAndUpdate(
      { _id: id, userId },
      { notes, updatedAt: new Date() },
      { new: true }
    );
    
    if (!analysis) {
      return res.status(404).json({ error: 'ECG analysis not found' });
    }

    res.json({
      success: true,
      message: 'Notes updated successfully',
      analysis
    });

  } catch (error) {
    console.error('Error updating ECG analysis notes:', error);
    res.status(500).json({ 
      error: 'Failed to update notes',
      message: error.message 
    });
  }
});

// Submit specialist review (CARDIOLOGIST only)
router.post('/analysis/:id/specialist-review', async (req, res) => {
  try {
    if (req.user.role !== 'CARDIOLOGIST') {
      return sendResponse(res, 403, false, 'Only cardiologists can submit specialist reviews');
    }

    const { id } = req.params;
    const { expertDiagnosis, overrideReason, reviewNotes, reviewStatus } = req.body;
    const cardiologistId = req.user._id || req.user.id;

    const analysis = await ECGAnalysis.findById(id);
    if (!analysis) {
      return sendResponse(res, 404, false, 'ECG analysis not found');
    }

    const review = new SpecialistReview({
      analysisId: id,
      cardiologistId,
      reviewStatus: reviewStatus || 'completed',
      expertDiagnosis,
      overrideReason,
      reviewNotes,
      reviewDate: new Date()
    });

    await review.save();
    logAction({ req, userId: cardiologistId, entityType: 'SPECIALIST_REVIEW', entityId: review._id, action: 'REVIEW', newValue: { analysisId: id, reviewStatus: review.reviewStatus } });

    return sendResponse(res, 201, true, 'Specialist review submitted', { review });
  } catch (error) {
    console.error('Error submitting specialist review:', error);
    return sendResponse(res, 500, false, 'Failed to submit specialist review');
  }
});

// Get all analyses for a patient (CARDIOLOGIST or ADMIN only)
router.get('/patients/:id/analyses', async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'CARDIOLOGIST' && role !== 'ADMIN') {
      return sendResponse(res, 403, false, 'Access restricted to cardiologists and admins');
    }

    const { id } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { userId: id };
    if (req.query.status) filter.status = req.query.status;

    const [analyses, total] = await Promise.all([
      ECGAnalysis.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-filePath'),
      ECGAnalysis.countDocuments(filter)
    ]);

    return sendResponse(res, 200, true, 'Patient analyses fetched successfully', {
      analyses,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching patient analyses:', error);
    return sendResponse(res, 500, false, 'Failed to fetch patient analyses');
  }
});

export default router;
