import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import ECGAnalysis from '../models/ECGAnalysis.js';
import SpecialistReview from '../models/SpecialistReview.js';
import { predictECG } from '../services/mlService.js';
import { sendResponse } from '../utils/responseHandler.js';
import { logAction } from '../services/auditService.js';
import { uploadLimiter, mlLimiter, readLimiter } from '../middleware/rateLimiter.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_STATUSES = ['uploaded', 'processing', 'pending', 'completed', 'failed', 'archived'];

const tempUploadDir = path.resolve(__dirname, '../../temp_uploads/ecg');
const processedUploadDir = path.resolve(__dirname, '../../uploads/ecg/processed');
const failedUploadDir = path.resolve(__dirname, '../../uploads/ecg/failed');

fs.mkdirSync(tempUploadDir, { recursive: true });
fs.mkdirSync(processedUploadDir, { recursive: true });
fs.mkdirSync(failedUploadDir, { recursive: true });

const router = express.Router();

// Derive extension from MIME type — never from user-provided filename
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/tiff': '.tif',
  'text/csv': '.csv',
  'application/json': '.json',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx'
};

// Configure multer for ECG file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = MIME_TO_EXT[file.mimetype] || '.bin';
    cb(null, 'ecg-' + uniqueSuffix + ext);
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
    isEmergency: payload.is_emergency ?? payload.isEmergency ?? false,
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
router.post('/upload', uploadLimiter, upload.single('ecgFile'), async (req, res) => {
  let finalFilePath = null;
  try {
    if (!req.file) {
      return sendResponse(res, 400, false, 'No ECG file uploaded');
    }

    const { patientName, patientAge, patientGender, notes } = req.body;
    const userId = req.user?._id || req.user?.id;
    const age = Number(patientAge || 0);
    const genderValue = mapGenderToNumeric(patientGender);
    const startedAt = Date.now();

    // path.basename() is the CodeQL-recognised path sanitizer — strips all directory
    // components so no user-influenced value ever reaches a file system API directly.
    const safeFilename = path.basename(req.file.filename);
    const safeSourcePath = path.join(tempUploadDir, safeFilename);

    const prediction = await predictECG(safeSourcePath, age, genderValue);
    const processingTime = Date.now() - startedAt;
    finalFilePath = await moveFile(safeSourcePath, processedUploadDir, safeFilename);

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

    // Sanitize again in catch — req.file may or may not exist depending on where the error occurred
    const safeErrFilename = req.file ? path.basename(req.file.filename) : null;
    const safeErrSourcePath = safeErrFilename ? path.join(tempUploadDir, safeErrFilename) : null;
    const pathToMove = finalFilePath || safeErrSourcePath;
    if (pathToMove && safeErrFilename) {
      try {
        await moveFile(pathToMove, failedUploadDir, safeErrFilename);
      } catch (moveError) {
        console.error('Failed to move ECG file to failed folder:', moveError);
      }
    }

    // Only save a failed record when we have enough required fields
    if (req.file) {
      const { patientName, patientAge, patientGender, notes } = req.body;
      const userId = req.user?._id || req.user?.id;

      try {
        const ecgAnalysis = new ECGAnalysis({
          userId,
          fileName: safeErrFilename,
          originalName: req.file.originalname,
          filePath: finalFilePath || safeErrSourcePath,
          fileSize: req.file.size,
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
    }

    return sendResponse(res, 500, false, 'Failed to upload and analyze ECG file', {
      error: error.message
    });
  }
});

// Get user's ECG analyses (paginated)
router.get('/my-analyses', readLimiter, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(String(req.user._id || req.user.id));
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { userId };
    if (req.query.status) {
      if (!VALID_STATUSES.includes(String(req.query.status))) {
        return sendResponse(res, 400, false, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
      }
      filter.status = String(req.query.status);
    }

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

// Get specific ECG analysis (owner, cardiologist, or admin)
router.get('/analysis/:id', readLimiter, async (req, res) => {
  try {
    const rawId = String(req.params.id);
    if (!rawId.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid analysis ID');
    }

    const { role } = req.user;
    const userId = req.user._id || req.user.id;

    const filter = role === 'CARDIOLOGIST' || role === 'ADMIN'
      ? { _id: rawId }
      : { _id: rawId, userId };

    const analysis = await ECGAnalysis.findOne(filter).select('-filePath');
    if (!analysis) {
      return sendResponse(res, 404, false, 'ECG analysis not found');
    }

    const review = await SpecialistReview.findOne({ analysisId: rawId }).sort({ createdAt: -1 });

    logAction({ req, userId, entityType: 'ECG_ANALYSIS', entityId: analysis._id, action: 'VIEW' });
    return sendResponse(res, 200, true, 'Analysis fetched successfully', { analysis, review: review || null });
  } catch (error) {
    console.error('Error fetching ECG analysis:', error);
    return sendResponse(res, 500, false, 'Failed to fetch ECG analysis');
  }
});

// Delete ECG analysis (owner only) — cascades to SpecialistReview
router.delete('/analysis/:id', async (req, res) => {
  try {
    const rawId = String(req.params.id);
    if (!rawId.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid analysis ID');
    }

    const userId = req.user._id || req.user.id;
    const analysis = await ECGAnalysis.findOneAndDelete({ _id: rawId, userId });
    if (!analysis) {
      return sendResponse(res, 404, false, 'ECG analysis not found');
    }

    await SpecialistReview.deleteMany({ analysisId: rawId });

    logAction({ req, userId, entityType: 'ECG_ANALYSIS', entityId: analysis._id, action: 'DELETE', oldValue: { fileName: analysis.fileName, status: analysis.status } });
    return sendResponse(res, 200, true, 'ECG analysis deleted successfully', null);
  } catch (error) {
    console.error('Error deleting ECG analysis:', error);
    return sendResponse(res, 500, false, 'Failed to delete ECG analysis');
  }
});

// Update ECG analysis notes (owner only)
router.patch('/analysis/:id/notes', async (req, res) => {
  try {
    const rawId = String(req.params.id);
    if (!rawId.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid analysis ID');
    }

    const { notes } = req.body;
    const userId = req.user._id || req.user.id;

    const analysis = await ECGAnalysis.findOneAndUpdate(
      { _id: rawId, userId },
      { notes },
      { new: true }
    ).select('-filePath');

    if (!analysis) {
      return sendResponse(res, 404, false, 'ECG analysis not found');
    }

    return sendResponse(res, 200, true, 'Notes updated successfully', { analysis });
  } catch (error) {
    console.error('Error updating ECG analysis notes:', error);
    return sendResponse(res, 500, false, 'Failed to update notes');
  }
});

// Request specialist review (PATIENT or PHC_DOCTOR — creates a pending review ticket)
router.post('/analysis/:id/request-review', async (req, res) => {
  try {
    const rawId = String(req.params.id);
    if (!rawId.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid analysis ID');
    }

    const userId = req.user._id || req.user.id;
    const analysis = await ECGAnalysis.findOne({ _id: rawId, userId });
    if (!analysis) {
      return sendResponse(res, 404, false, 'ECG analysis not found');
    }

    const existing = await SpecialistReview.findOne({ analysisId: rawId, reviewStatus: { $in: ['pending', 'in_review'] } });
    if (existing) {
      return sendResponse(res, 409, false, 'A review request is already pending for this analysis');
    }

    const review = await SpecialistReview.create({
      analysisId: rawId,
      cardiologistId: null,
      reviewStatus: 'pending'
    });

    logAction({ req, userId, entityType: 'SPECIALIST_REVIEW', entityId: review._id, action: 'UPDATE', newValue: { analysisId: rawId, reviewStatus: 'pending' } });
    return sendResponse(res, 201, true, 'Review requested successfully', { review });
  } catch (error) {
    console.error('Error requesting specialist review:', error);
    return sendResponse(res, 500, false, 'Failed to request specialist review');
  }
});

// Submit / update specialist review (CARDIOLOGIST only)
router.post('/analysis/:id/specialist-review', mlLimiter, async (req, res) => {
  try {
    if (req.user.role !== 'CARDIOLOGIST') {
      return sendResponse(res, 403, false, 'Only cardiologists can submit specialist reviews');
    }

    const rawId = String(req.params.id);
    if (!rawId.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid analysis ID');
    }

    const { expertDiagnosis, overrideReason, reviewNotes, reviewStatus } = req.body;
    const cardiologistId = req.user._id || req.user.id;

    const analysis = await ECGAnalysis.findById(rawId);
    if (!analysis) {
      return sendResponse(res, 404, false, 'ECG analysis not found');
    }

    // Upsert: if a pending review ticket exists, claim it; otherwise create a new one
    let review = await SpecialistReview.findOne({ analysisId: rawId, reviewStatus: 'pending' });
    if (review) {
      review.cardiologistId = cardiologistId;
      review.reviewStatus = reviewStatus || 'completed';
      review.expertDiagnosis = expertDiagnosis;
      review.overrideReason = overrideReason;
      review.reviewNotes = reviewNotes;
      review.reviewDate = new Date();
      await review.save();
    } else {
      review = await SpecialistReview.create({
        analysisId: rawId,
        cardiologistId,
        reviewStatus: reviewStatus || 'completed',
        expertDiagnosis,
        overrideReason,
        reviewNotes,
        reviewDate: new Date()
      });
    }

    logAction({ req, userId: cardiologistId, entityType: 'SPECIALIST_REVIEW', entityId: review._id, action: 'REVIEW', newValue: { analysisId: rawId, reviewStatus: review.reviewStatus } });
    return sendResponse(res, 201, true, 'Specialist review submitted', { review });
  } catch (error) {
    console.error('Error submitting specialist review:', error);
    return sendResponse(res, 500, false, 'Failed to submit specialist review');
  }
});

// Update an existing review (CARDIOLOGIST only — e.g. move pending → in_review → completed)
router.patch('/reviews/:reviewId', mlLimiter, async (req, res) => {
  try {
    if (req.user.role !== 'CARDIOLOGIST') {
      return sendResponse(res, 403, false, 'Only cardiologists can update specialist reviews');
    }

    const rawId = String(req.params.reviewId);
    if (!rawId.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid review ID');
    }

    const { reviewStatus, expertDiagnosis, overrideReason, reviewNotes } = req.body;
    const cardiologistId = req.user._id || req.user.id;

    const VALID_REVIEW_STATUSES = ['pending', 'in_review', 'completed'];
    if (reviewStatus && !VALID_REVIEW_STATUSES.includes(reviewStatus)) {
      return sendResponse(res, 400, false, `Invalid reviewStatus. Must be one of: ${VALID_REVIEW_STATUSES.join(', ')}`);
    }

    const existing = await SpecialistReview.findById(rawId);
    if (!existing) {
      return sendResponse(res, 404, false, 'Specialist review not found');
    }

    // Pending reviews are unowned — any cardiologist can claim them.
    // In-review/completed reviews are locked to the cardiologist who claimed them.
    if (existing.reviewStatus !== 'pending' && String(existing.cardiologistId) !== String(cardiologistId)) {
      return sendResponse(res, 403, false, 'This review is already being handled by another cardiologist');
    }

    const updates = { cardiologistId };
    if (reviewStatus) updates.reviewStatus = reviewStatus;
    if (expertDiagnosis !== undefined) updates.expertDiagnosis = expertDiagnosis;
    if (overrideReason !== undefined) updates.overrideReason = overrideReason;
    if (reviewNotes !== undefined) updates.reviewNotes = reviewNotes;
    if (reviewStatus === 'completed') updates.reviewDate = new Date();

    const review = await SpecialistReview.findByIdAndUpdate(rawId, updates, { new: true, runValidators: true });

    logAction({ req, userId: cardiologistId, entityType: 'SPECIALIST_REVIEW', entityId: review._id, action: 'REVIEW', newValue: updates });
    return sendResponse(res, 200, true, 'Review updated successfully', { review });
  } catch (error) {
    console.error('Error updating specialist review:', error);
    return sendResponse(res, 500, false, 'Failed to update specialist review');
  }
});

// Pending review queue (CARDIOLOGIST only)
router.get('/pending-reviews', readLimiter, async (req, res) => {
  try {
    if (req.user.role !== 'CARDIOLOGIST') {
      return sendResponse(res, 403, false, 'Only cardiologists can access the review queue');
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { reviewStatus: { $in: ['pending', 'in_review'] } };

    const [reviews, total] = await Promise.all([
      SpecialistReview.find(filter)
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'analysisId', select: '-filePath' }),
      SpecialistReview.countDocuments(filter)
    ]);

    return sendResponse(res, 200, true, 'Pending reviews fetched', {
      reviews,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    return sendResponse(res, 500, false, 'Failed to fetch pending reviews');
  }
});

// Cardiologist's own review history
router.get('/my-reviews', readLimiter, async (req, res) => {
  try {
    if (req.user.role !== 'CARDIOLOGIST') {
      return sendResponse(res, 403, false, 'Only cardiologists can access review history');
    }

    const cardiologistId = req.user._id || req.user.id;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      SpecialistReview.find({ cardiologistId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'analysisId', select: '-filePath' }),
      SpecialistReview.countDocuments({ cardiologistId })
    ]);

    return sendResponse(res, 200, true, 'Review history fetched', {
      reviews,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Error fetching review history:', error);
    return sendResponse(res, 500, false, 'Failed to fetch review history');
  }
});

// Get all analyses for a patient (CARDIOLOGIST or ADMIN only)
router.get('/patients/:id/analyses', readLimiter, async (req, res) => {
  try {
    const { role } = req.user;
    if (role !== 'CARDIOLOGIST' && role !== 'ADMIN') {
      return sendResponse(res, 403, false, 'Access restricted to cardiologists and admins');
    }

    const rawId = String(req.params.id);
    if (!rawId.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid patient ID');
    }
    const patientId = new mongoose.Types.ObjectId(rawId);

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter = { userId: patientId };
    if (req.query.status) {
      if (!VALID_STATUSES.includes(String(req.query.status))) {
        return sendResponse(res, 400, false, `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
      }
      filter.status = String(req.query.status);
    }

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
