import express from 'express';
import multer from 'multer';
import fs from 'fs';
import { promises as fsp } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';
import ECGAnalysis from '../models/ECGAnalysis.js';
import SpecialistReview from '../models/SpecialistReview.js';
import Annotation from '../models/Annotation.js';
import Validation from '../models/Validation.js';
import { predictECG } from '../services/mlService.js';
import { sendResponse } from '../utils/responseHandler.js';
import { logAction } from '../services/auditService.js';
import { uploadLimiter, mlLimiter, readLimiter } from '../middleware/rateLimiter.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_STATUSES = ['uploaded', 'processing', 'pending', 'completed', 'failed', 'archived'];

import os from 'os';

const tempUploadDir = path.join(os.tmpdir(), 'ecg-temp');
const processedUploadDir = path.join(os.tmpdir(), 'ecg-processed');
const failedUploadDir = path.join(os.tmpdir(), 'ecg-failed');
fs.mkdirSync(tempUploadDir, { recursive: true });
fs.mkdirSync(processedUploadDir, { recursive: true });
fs.mkdirSync(failedUploadDir, { recursive: true });

const router = express.Router();

// Derive extension from MIME type — never from user-provided filename
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
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
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG and PNG images are allowed.'), false);
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
  const topPredictions = Array.isArray(prediction?.top_predictions)
    ? prediction.top_predictions
    : [];

  const best = topPredictions[0] ?? {};
  const bestRhythm = normalizeRhythm(best.condition);
  const confidence = Number.isFinite(best.probability) ? Math.round(best.probability * 100) : 0;

  const predictedLabels = topPredictions.map(p => p.condition).filter(Boolean);
  const labelProbabilities = Object.fromEntries(
    topPredictions.map(p => [p.condition, p.probability])
  );

  return {
    rhythm: bestRhythm,
    confidence,
    aiModel: 'LightECGNet_v2',
    modelVersion: 'v2',
    processingTime,
    predictedLabels,
    labelProbabilities,
    topPredictions: topPredictions.map(p => ({
      rhythm: p.condition,
      fullName: p.full_name,
      snomedCt: p.snomed_ct,
      confidence: Math.round(p.probability * 100),
    })),
    ontologyEnrichment: prediction?.ontology ?? null,
    // Not yet provided by /predict — add when signal processing returns these:
    // heartRate: null,
    // qrsDuration: null,
    // qtInterval: null,
    // abnormalities: [],
    // signalMetrics: null,
    // isEmergency: false,
    // explanation: null,
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

// Export clinical PDF report for a completed analysis
router.get('/analysis/:id/report', readLimiter, async (req, res) => {
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

    const analysis = await ECGAnalysis.findOne(filter).select('-filePath').lean();
    if (!analysis) {
      return sendResponse(res, 404, false, 'ECG analysis not found');
    }
    if (analysis.status !== 'completed' || !analysis.analysisResult) {
      return sendResponse(res, 422, false, 'Report is only available for completed analyses');
    }

    const review = await SpecialistReview.findOne({ analysisId: rawId })
      .sort({ createdAt: -1 })
      .lean();

    const result = analysis.analysisResult;
    const patient = analysis.patientInfo;
    const generatedAt = new Date().toUTCString();
    const reportId = `ECG-${String(analysis._id).slice(-8).toUpperCase()}`;

    const RHYTHM_LABELS = {
      normal: 'Normal Sinus Rhythm',
      atrial_fibrillation: 'Atrial Fibrillation',
      atrial_flutter: 'Atrial Flutter',
      ventricular_tachycardia: 'Ventricular Tachycardia',
      bradycardia: 'Bradycardia',
      other: 'Other / Unclassified',
    };

    const URGENCY_LABELS = { critical: 'CRITICAL', high: 'HIGH', moderate: 'MODERATE', low: 'LOW' };

    const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });

    const safePatientName = (patient?.name ?? 'Unknown').replace(/[^a-zA-Z0-9 _-]/g, '');
    const filename = `ECGenius_Report_${safePatientName.replace(/\s+/g, '_')}_${String(analysis._id).slice(-6)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // ── Header ────────────────────────────────────────────────────────────────
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#1e3a5f').text('ECGenius', 50, 45);
    doc.fontSize(10).font('Helvetica').fillColor('#64748b')
      .text('AI-Driven ECG Interpretation & Clinical Decision Support', 50, 72);
    doc.moveTo(50, 90).lineTo(545, 90).strokeColor('#e2e8f0').lineWidth(1).stroke();

    if (result.isEmergency) {
      doc.rect(50, 98, 495, 28).fill('#fef2f2');
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#b91c1c')
        .text('⚠  TIER-1 EMERGENCY — Immediate clinical action required', 60, 105);
    }

    const afterHeader = result.isEmergency ? 140 : 108;

    // ── Report metadata ───────────────────────────────────────────────────────
    doc.fontSize(9).font('Helvetica').fillColor('#64748b')
      .text(`Report ID: ${reportId}`, 50, afterHeader)
      .text(`Generated: ${generatedAt}`, 50, afterHeader + 13)
      .text(`AI Model: ${result.aiModel ?? 'LightECGNet v2'}  v${result.modelVersion ?? '1.0.0'}`, 50, afterHeader + 26);

    // ── Section: Patient Information ──────────────────────────────────────────
    const secStart = afterHeader + 52;
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a5f').text('Patient Information', 50, secStart);
    doc.moveTo(50, secStart + 16).lineTo(545, secStart + 16).strokeColor('#cbd5e1').lineWidth(0.5).stroke();

    const pRows = [
      ['Name', patient?.name ?? '—'],
      ['Age', patient?.age != null ? `${patient.age} years` : '—'],
      ['Gender', patient?.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : '—'],
      ['File', analysis.originalName ?? '—'],
      ['Analysed', analysis.processedAt ? new Date(analysis.processedAt).toUTCString() : '—'],
    ];
    let rowY = secStart + 24;
    for (const [label, value] of pRows) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151').text(label, 50, rowY);
      doc.fontSize(9).font('Helvetica').fillColor('#1f2937').text(String(value), 160, rowY);
      rowY += 16;
    }
    if (analysis.notes) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151').text('Notes', 50, rowY);
      doc.fontSize(9).font('Helvetica').fillColor('#1f2937').text(analysis.notes, 160, rowY, { width: 380 });
      rowY += doc.heightOfString(analysis.notes, { width: 380 }) + 4;
    }

    // ── Section: Key Findings ─────────────────────────────────────────────────
    rowY += 10;
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a5f').text('Key Findings', 50, rowY);
    doc.moveTo(50, rowY + 16).lineTo(545, rowY + 16).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    rowY += 24;

    const rhythmLabel = RHYTHM_LABELS[result.rhythm] ?? result.rhythm ?? '—';
    const confidence = result.confidence != null ? `${Math.round(result.confidence)}%` : '—';

    const findingRows = [
      ['Rhythm', rhythmLabel],
      ['Confidence', confidence],
      ['Heart Rate', result.heartRate != null ? `${result.heartRate} bpm` : '—'],
      ['QRS Duration', result.qrsDuration != null ? `${result.qrsDuration} ms` : '—'],
      ['QT Interval', result.qtInterval != null ? `${result.qtInterval} ms` : '—'],
    ];
    for (const [label, value] of findingRows) {
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151').text(label, 50, rowY);
      doc.fontSize(9).font('Helvetica').fillColor('#1f2937').text(String(value), 160, rowY);
      rowY += 16;
    }

    // Abnormalities
    rowY += 4;
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151').text('Abnormalities', 50, rowY);
    if (result.abnormalities?.length) {
      doc.fontSize(9).font('Helvetica').fillColor('#1f2937')
        .text(result.abnormalities.join(', '), 160, rowY, { width: 380 });
      rowY += doc.heightOfString(result.abnormalities.join(', '), { width: 380 }) + 4;
    } else {
      doc.fontSize(9).font('Helvetica').fillColor('#16a34a').text('None detected', 160, rowY);
      rowY += 16;
    }

    // ── Section: Ontology Enrichment ──────────────────────────────────────────
    if (result.ontologyEnrichment?.length) {
      rowY += 10;
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a5f').text('Clinical Classifications', 50, rowY);
      doc.moveTo(50, rowY + 16).lineTo(545, rowY + 16).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
      rowY += 24;

      for (const item of result.ontologyEnrichment) {
        if (rowY > 720) { doc.addPage(); rowY = 50; }
        const urgLabel = URGENCY_LABELS[item.urgencyTier] ?? (item.urgencyTier ?? '').toUpperCase();
        const urgColor = item.urgencyTier === 'critical' ? '#b91c1c'
          : item.urgencyTier === 'high' ? '#d97706'
          : item.urgencyTier === 'moderate' ? '#ca8a04' : '#64748b';

        doc.fontSize(9).font('Helvetica-Bold').fillColor('#1f2937').text(item.displayName ?? '—', 50, rowY);
        doc.fontSize(8).font('Helvetica-Bold').fillColor(urgColor).text(urgLabel, 370, rowY);
        doc.fontSize(8).font('Helvetica').fillColor('#64748b')
          .text(`Tier: ${item.confidenceTier ?? '—'}  |  Severity: ${item.severity ?? '—'}`, 50, rowY + 12);
        if (item.recommendedTests?.length) {
          doc.fontSize(8).font('Helvetica').fillColor('#374151')
            .text(`Tests: ${item.recommendedTests.join(', ')}`, 50, rowY + 24, { width: 490 });
          rowY += 38;
        } else {
          rowY += 28;
        }
      }
    }

    // ── Section: Specialist Review ────────────────────────────────────────────
    if (review) {
      if (rowY > 680) { doc.addPage(); rowY = 50; }
      rowY += 10;
      doc.fontSize(12).font('Helvetica-Bold').fillColor('#1e3a5f').text('Specialist Review', 50, rowY);
      doc.moveTo(50, rowY + 16).lineTo(545, rowY + 16).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
      rowY += 24;

      const reviewRows = [
        ['Status', (review.reviewStatus ?? '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())],
        ['Priority', (review.priority ?? '—').charAt(0).toUpperCase() + (review.priority ?? '—').slice(1)],
        ['Expert Diagnosis', review.expertDiagnosis ?? '—'],
        ['Override Reason', review.overrideReason ?? '—'],
        ['Review Date', review.reviewDate ? new Date(review.reviewDate).toUTCString() : 'Pending'],
      ];
      for (const [label, value] of reviewRows) {
        if (rowY > 750) { doc.addPage(); rowY = 50; }
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151').text(label, 50, rowY);
        doc.fontSize(9).font('Helvetica').fillColor('#1f2937').text(String(value), 160, rowY, { width: 380 });
        rowY += 16;
      }
      if (review.reviewNotes) {
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#374151').text('Review Notes', 50, rowY);
        doc.fontSize(9).font('Helvetica').fillColor('#1f2937').text(review.reviewNotes, 160, rowY, { width: 380 });
        rowY += doc.heightOfString(review.reviewNotes, { width: 380 }) + 4;
      }
    }

    // ── Footer ────────────────────────────────────────────────────────────────
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(pages.start + i);
      doc.moveTo(50, 780).lineTo(545, 780).strokeColor('#e2e8f0').lineWidth(0.5).stroke();
      doc.fontSize(7).font('Helvetica').fillColor('#94a3b8')
        .text(
          'This report is generated by ECGenius AI. It is intended to assist trained healthcare professionals '
          + 'and does not replace clinical judgement. Not for self-diagnosis.',
          50, 785, { width: 400, align: 'left' }
        )
        .text(`Page ${i + 1} of ${pages.count}  |  ${reportId}`, 50, 785, { width: 495, align: 'right' });
    }

    logAction({ req, userId, entityType: 'ECG_ANALYSIS', entityId: analysis._id, action: 'VIEW', newValue: { exported: 'pdf' } });

    doc.end();
  } catch (error) {
    console.error('Error generating PDF report:', error);
    if (!res.headersSent) {
      return sendResponse(res, 500, false, 'Failed to generate report');
    }
  }
});

// Delete ECG analysis (owner only) — cascades to SpecialistReview
router.delete('/analysis/:id', readLimiter, async (req, res) => {
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
router.patch('/analysis/:id/notes', readLimiter, async (req, res) => {
  try {
    const rawId = String(req.params.id);
    if (!rawId.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid analysis ID');
    }

    if (req.body.notes === undefined || req.body.notes === null) {
      return sendResponse(res, 400, false, 'notes is required');
    }
    const notes = String(req.body.notes);
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
router.post('/analysis/:id/request-review', readLimiter, async (req, res) => {
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
// Get the specialist review for an analysis (analysis owner or a clinical role)
router.get('/analysis/:id/review', readLimiter, async (req, res) => {
  try {
    const rawId = String(req.params.id);
    if (!rawId.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid analysis ID');
    }

    const analysis = await ECGAnalysis.findById(rawId).select('userId');
    if (!analysis) {
      return sendResponse(res, 404, false, 'ECG analysis not found');
    }

    const userId = req.user._id || req.user.id;
    const CLINICAL_ROLES = ['PHC_DOCTOR', 'CARDIOLOGIST', 'ADMIN'];
    if (String(analysis.userId) !== String(userId) && !CLINICAL_ROLES.includes(req.user.role)) {
      return sendResponse(res, 403, false, 'You do not have access to this analysis');
    }

    const review = await SpecialistReview.findOne({ analysisId: rawId }).sort({ createdAt: -1 });
    if (!review) {
      return sendResponse(res, 404, false, 'No specialist review found for this analysis');
    }

    return sendResponse(res, 200, true, 'Specialist review fetched successfully', { review });
  } catch (error) {
    console.error('Error fetching specialist review:', error);
    return sendResponse(res, 500, false, 'Failed to fetch specialist review');
  }
});
// Create or update the cardiologist's annotation for an analysis (CARDIOLOGIST only)
router.post('/analysis/:id/annotation', mlLimiter, async (req, res) => {
  try {
    if (req.user.role !== 'CARDIOLOGIST') {
      return sendResponse(res, 403, false, 'Only cardiologists can submit annotations');
    }

    const rawId = String(req.params.id);
    if (!rawId.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid analysis ID');
    }

    const analysis = await ECGAnalysis.findById(rawId).select('_id');
    if (!analysis) {
      return sendResponse(res, 404, false, 'ECG analysis not found');
    }

    const cardiologistId = req.user._id || req.user.id;
    const { leadAnnotations, validatedRhythm, rhythmIsCorrect, overallQuality, notes } = req.body;

    let annotation = await Annotation.findOne({ analysisId: rawId });
    if (annotation) {
      annotation.cardiologistId = cardiologistId;
      if (leadAnnotations !== undefined) annotation.leadAnnotations = leadAnnotations;
      if (validatedRhythm !== undefined) annotation.validatedRhythm = validatedRhythm;
      if (rhythmIsCorrect !== undefined) annotation.rhythmIsCorrect = rhythmIsCorrect;
      if (overallQuality !== undefined) annotation.overallQuality = overallQuality;
      if (notes !== undefined) annotation.notes = notes;
      await annotation.save();
    } else {
      annotation = await Annotation.create({
        analysisId: rawId,
        cardiologistId,
        leadAnnotations,
        validatedRhythm,
        rhythmIsCorrect,
        overallQuality,
        notes
      });
    }

    logAction({ req, userId: cardiologistId, entityType: 'ANNOTATION', entityId: annotation._id, action: 'REVIEW', newValue: { analysisId: rawId } });
    return sendResponse(res, 201, true, 'Annotation saved successfully', { annotation });
  } catch (error) {
    console.error('Error saving annotation:', error);
    return sendResponse(res, 500, false, 'Failed to save annotation');
  }
});

// Get the cardiologist's annotation for an analysis (analysis owner or a clinical role)
router.get('/analysis/:id/annotation', readLimiter, async (req, res) => {
  try {
    const rawId = String(req.params.id);
    if (!rawId.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid analysis ID');
    }

    const analysis = await ECGAnalysis.findById(rawId).select('userId');
    if (!analysis) {
      return sendResponse(res, 404, false, 'ECG analysis not found');
    }

    const userId = req.user._id || req.user.id;
    const CLINICAL_ROLES = ['PHC_DOCTOR', 'CARDIOLOGIST', 'ADMIN'];
    if (String(analysis.userId) !== String(userId) && !CLINICAL_ROLES.includes(req.user.role)) {
      return sendResponse(res, 403, false, 'You do not have access to this analysis');
    }

    const annotation = await Annotation.findOne({ analysisId: rawId });
    if (!annotation) {
      return sendResponse(res, 404, false, 'No annotation found for this analysis');
    }

    return sendResponse(res, 200, true, 'Annotation fetched successfully', { annotation });
  } catch (error) {
    console.error('Error fetching annotation:', error);
    return sendResponse(res, 500, false, 'Failed to fetch annotation');
  }
});

// Create or update the cardiologist's AI-result validation for an analysis (CARDIOLOGIST only)
router.post('/analysis/:id/validation', mlLimiter, async (req, res) => {
  try {
    if (req.user.role !== 'CARDIOLOGIST') {
      return sendResponse(res, 403, false, 'Only cardiologists can submit validations');
    }

    const rawId = String(req.params.id);
    if (!rawId.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid analysis ID');
    }

    if (typeof req.body.aiRhythmCorrect !== 'boolean' || typeof req.body.aiAbnormalitiesCorrect !== 'boolean') {
      return sendResponse(res, 400, false, 'aiRhythmCorrect and aiAbnormalitiesCorrect are required boolean fields');
    }

    const analysis = await ECGAnalysis.findById(rawId).select('_id');
    if (!analysis) {
      return sendResponse(res, 404, false, 'ECG analysis not found');
    }

    const cardiologistId = req.user._id || req.user.id;
    const { aiRhythmCorrect, aiAbnormalitiesCorrect, correctedRhythm, correctedAbnormalities, confidenceRating, notes } = req.body;

    let validation = await Validation.findOne({ analysisId: rawId });
    if (validation) {
      validation.cardiologistId = cardiologistId;
      validation.aiRhythmCorrect = aiRhythmCorrect;
      validation.aiAbnormalitiesCorrect = aiAbnormalitiesCorrect;
      if (correctedRhythm !== undefined) validation.correctedRhythm = correctedRhythm;
      if (correctedAbnormalities !== undefined) validation.correctedAbnormalities = correctedAbnormalities;
      if (confidenceRating !== undefined) validation.confidenceRating = confidenceRating;
      if (notes !== undefined) validation.notes = notes;
      await validation.save();
    } else {
      validation = await Validation.create({
        analysisId: rawId,
        cardiologistId,
        aiRhythmCorrect,
        aiAbnormalitiesCorrect,
        correctedRhythm,
        correctedAbnormalities,
        confidenceRating,
        notes
      });
    }

    logAction({ req, userId: cardiologistId, entityType: 'VALIDATION', entityId: validation._id, action: 'REVIEW', newValue: { analysisId: rawId, aiRhythmCorrect, aiAbnormalitiesCorrect } });
    return sendResponse(res, 201, true, 'Validation saved successfully', { validation });
  } catch (error) {
    console.error('Error saving validation:', error);
    return sendResponse(res, 500, false, 'Failed to save validation');
  }
});

// Get the cardiologist's AI-result validation for an analysis (analysis owner or a clinical role)
router.get('/analysis/:id/validation', readLimiter, async (req, res) => {
  try {
    const rawId = String(req.params.id);
    if (!rawId.match(/^[a-f\d]{24}$/i)) {
      return sendResponse(res, 400, false, 'Invalid analysis ID');
    }

    const analysis = await ECGAnalysis.findById(rawId).select('userId');
    if (!analysis) {
      return sendResponse(res, 404, false, 'ECG analysis not found');
    }

    const userId = req.user._id || req.user.id;
    const CLINICAL_ROLES = ['PHC_DOCTOR', 'CARDIOLOGIST', 'ADMIN'];
    if (String(analysis.userId) !== String(userId) && !CLINICAL_ROLES.includes(req.user.role)) {
      return sendResponse(res, 403, false, 'You do not have access to this analysis');
    }

    const validation = await Validation.findOne({ analysisId: rawId });
    if (!validation) {
      return sendResponse(res, 404, false, 'No validation found for this analysis');
    }

    return sendResponse(res, 200, true, 'Validation fetched successfully', { validation });
  } catch (error) {
    console.error('Error fetching validation:', error);
    return sendResponse(res, 500, false, 'Failed to fetch validation');
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

    const VALID_REVIEW_STATUSES = ['pending', 'in_review', 'completed'];
    let reviewStatus = 'completed';
    if (req.body.reviewStatus !== undefined) {
      reviewStatus = String(req.body.reviewStatus);
      if (!VALID_REVIEW_STATUSES.includes(reviewStatus)) {
        return sendResponse(res, 400, false, `Invalid reviewStatus. Must be one of: ${VALID_REVIEW_STATUSES.join(', ')}`);
      }
    }
    const expertDiagnosis = req.body.expertDiagnosis !== undefined ? String(req.body.expertDiagnosis) : undefined;
    const overrideReason = req.body.overrideReason !== undefined ? String(req.body.overrideReason) : undefined;
    const reviewNotes = req.body.reviewNotes !== undefined ? String(req.body.reviewNotes) : undefined;
    const cardiologistId = req.user._id || req.user.id;

    const analysis = await ECGAnalysis.findById(rawId);
    if (!analysis) {
      return sendResponse(res, 404, false, 'ECG analysis not found');
    }

    // Upsert: if a pending review ticket exists, claim it; otherwise create a new one
    let review = await SpecialistReview.findOne({ analysisId: rawId, reviewStatus: 'pending' });
    if (review) {
      review.cardiologistId = cardiologistId;
      review.reviewStatus = reviewStatus;
      review.expertDiagnosis = expertDiagnosis;
      review.overrideReason = overrideReason;
      review.reviewNotes = reviewNotes;
      review.reviewDate = new Date();
      await review.save();
    } else {
      review = await SpecialistReview.create({
        analysisId: rawId,
        cardiologistId,
        reviewStatus,
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

    const cardiologistId = req.user._id || req.user.id;

    const VALID_REVIEW_STATUSES = ['pending', 'in_review', 'completed'];
    let reviewStatus;
    if (req.body.reviewStatus !== undefined) {
      reviewStatus = String(req.body.reviewStatus);
      if (!VALID_REVIEW_STATUSES.includes(reviewStatus)) {
        return sendResponse(res, 400, false, `Invalid reviewStatus. Must be one of: ${VALID_REVIEW_STATUSES.join(', ')}`);
      }
    }
    const expertDiagnosis = req.body.expertDiagnosis !== undefined ? String(req.body.expertDiagnosis) : undefined;
    const overrideReason = req.body.overrideReason !== undefined ? String(req.body.overrideReason) : undefined;
    const reviewNotes = req.body.reviewNotes !== undefined ? String(req.body.reviewNotes) : undefined;

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
