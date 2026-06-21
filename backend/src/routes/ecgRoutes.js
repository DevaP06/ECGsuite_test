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
import { notify } from '../services/notificationService.js';
import { uploadLimiter, mlLimiter, readLimiter } from '../middleware/rateLimiter.js';
import { mapOntologyEnrichment, deriveEmergencyLevel } from '../utils/ontologyMapping.js';
import { uploadToGCS, isGCSConfigured } from '../services/gcsService.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VALID_STATUSES = ['uploaded', 'processing', 'pending', 'completed', 'failed', 'archived'];

import os from 'os';

const tempUploadDir = path.join(os.tmpdir(), 'ecg-temp');
const processedUploadDir = path.join(os.tmpdir(), 'ecg-processed');
const failedUploadDir = path.join(os.tmpdir(), 'ecg-failed');

// These live under the OS temp dir, which the OS (Windows Storage Sense, /tmp
// reapers) can delete once they're empty — so creating them once at startup is
// not enough. ensureDir() is called again per request (multer destination +
// moveFile) so a write never fails with ENOENT on a vanished temp folder.
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });
ensureDir(tempUploadDir);
ensureDir(processedUploadDir);
ensureDir(failedUploadDir);

const router = express.Router();

// Derive extension from MIME type — never from user-provided filename
const MIME_TO_EXT = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
};

// Configure multer for ECG file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      ensureDir(tempUploadDir); // recreate if the OS reaped the empty temp dir
      cb(null, tempUploadDir);
    } catch (err) {
      cb(err);
    }
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

  const ontologyEnrichment = mapOntologyEnrichment(prediction?.ontology);

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
    ontologyEnrichment,
    emergencyLevel: deriveEmergencyLevel(ontologyEnrichment),
    isEmergency: ontologyEnrichment.some(item => item.isEmergency === true),
    // Not yet provided by /predict — populated once signal-metrics processing is added
    heartRate: null,
    qrsDuration: null,
    qtInterval: null,
    qtcInterval: null,
    rrInterval: null,
    abnormalities: [],
    signalMetrics: null,
    explanation: null,
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

    const { patientName, patientAge, patientGender, notes, patientId } = req.body;
    const userId = req.user?._id || req.user?.id;
    const age = Number(patientAge || 0);
    const genderValue = mapGenderToNumeric(patientGender);
    const startedAt = Date.now();

    const validPatientId = patientId && String(patientId).match(/^[a-f\d]{24}$/i)
      ? patientId
      : null;

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
      ...(validPatientId && { patientId: validPatientId }),
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

    if (isGCSConfigured()) {
      try {
        const gcsUrl = await uploadToGCS(finalFilePath, safeFilename);
        if (gcsUrl) {
          ecgAnalysis.storageUrl = gcsUrl;
          await ecgAnalysis.save();
          fsp.unlink(finalFilePath).catch(() => {});
        }
      } catch (gcsErr) {
        console.error('GCS upload failed (file kept on disk):', gcsErr.message);
      }
    }

    if (!mlUnavailable && analysisResult) {
      const patientLabel = ecgAnalysis.patientInfo?.name || 'your upload';
      notify({
        userId,
        category: 'diagnosis',
        title: 'AI diagnosis ready',
        description: `${analysisResult.rhythm} reported for ${patientLabel}.`,
        link: `/diagnosisdetail/${ecgAnalysis._id}`,
        sourceType: 'ECG_ANALYSIS',
        sourceId: ecgAnalysis._id,
      });

      if (analysisResult.isEmergency === true) {
        notify({
          userId,
          category: 'alert',
          title: 'Emergency finding detected',
          description: `${analysisResult.rhythm} was flagged as an emergency for ${ecgAnalysis.patientInfo?.name || 'this analysis'}.`,
          link: `/diagnosisdetail/${ecgAnalysis._id}`,
          sourceType: 'ECG_ANALYSIS',
          sourceId: ecgAnalysis._id,
        });
      }
    }

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
        notify({
          userId,
          category: 'alert',
          title: 'Analysis failed',
          description: error.message?.trim() || 'Your ECG analysis could not be completed.',
          link: `/analysis-failed/${ecgAnalysis._id}`,
          sourceType: 'ECG_ANALYSIS',
          sourceId: ecgAnalysis._id,
        });
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
      normal: 'Normal Sinus Rhythm (NSR)',
      atrial_fibrillation: 'Atrial Fibrillation (AFib)',
      atrial_flutter: 'Atrial Flutter (AFlutter)',
      ventricular_tachycardia: 'Ventricular Tachycardia (VT)',
      bradycardia: 'Sinus Bradycardia',
      other: 'Other / Unclassified',
    };

    const URGENCY_LABELS = { critical: 'CRITICAL', high: 'HIGH', moderate: 'MODERATE', low: 'LOW' };

    const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });

    const safePatientName = (patient?.name ?? 'Unknown').replace(/[^a-zA-Z0-9 _-]/g, '');
    const filename = `ECGenius_Clinical_Report_${safePatientName.replace(/\s+/g, '_')}_${String(analysis._id).slice(-6)}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    const LEFT = 40;
    const RIGHT = 555;
    const WIDTH = RIGHT - LEFT;
    const COL_MID = 300;

    const drawLine = (y, color = '#1a365d', weight = 1) => {
      doc.moveTo(LEFT, y).lineTo(RIGHT, y).strokeColor(color).lineWidth(weight).stroke();
    };

    const sectionHeader = (title, y) => {
      doc.rect(LEFT, y, WIDTH, 20).fill('#1a365d');
      doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff')
        .text(title.toUpperCase(), LEFT + 8, y + 5, { width: WIDTH - 16 });
      return y + 26;
    };

    const labelValue = (label, value, y, labelX = LEFT + 8, valueX = LEFT + 130) => {
      doc.fontSize(8.5).font('Helvetica').fillColor('#64748b').text(label, labelX, y);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#1e293b').text(String(value), valueX, y);
      return y + 14;
    };

    const checkPageBreak = (y, needed = 60) => {
      if (y > 740 - needed) { doc.addPage(); return 50; }
      return y;
    };

    // ══════════════════════════════════════════════════════════════════════════
    // PAGE HEADER — Institution-style banner with logo
    // ══════════════════════════════════════════════════════════════════════════
    const logoPath = path.join(__dirname, '../assets/ecgenius.png');
    doc.rect(LEFT, 30, WIDTH, 52).fill('#0f2b46');
    try {
      if (fs.existsSync(logoPath)) {
        doc.image(logoPath, LEFT + 10, 33, { height: 46 });
      }
    } catch { /* logo missing — text-only fallback */ }
    doc.fontSize(20).font('Helvetica-Bold').fillColor('#ffffff').text('ECGenius', LEFT + 62, 38);
    doc.fontSize(8).font('Helvetica').fillColor('#93c5fd')
      .text('AI-ASSISTED ELECTROCARDIOGRAM DIAGNOSTIC REPORT', LEFT + 62, 60);
    doc.fontSize(7.5).font('Helvetica').fillColor('#93c5fd')
      .text('www.ecgenius.life', RIGHT - 120, 60, { width: 110, align: 'right' });

    // Thin accent line under header
    doc.rect(LEFT, 82, WIDTH, 3).fill('#2563eb');

    let y = 94;

    // ── Report identification bar ────────────────────────────────────────────
    doc.rect(LEFT, y, WIDTH, 22).fill('#f1f5f9');
    doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#475569')
      .text(`Report ID: ${reportId}`, LEFT + 8, y + 6)
      .text(`Date: ${new Date(analysis.processedAt || analysis.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, LEFT + 160, y + 6)
      .text(`Model: ${result.aiModel ?? 'LightECGNet'} ${result.modelVersion ?? 'v2'}`, LEFT + 320, y + 6);
    y += 28;

    // ── EMERGENCY ALERT ──────────────────────────────────────────────────────
    if (result.isEmergency) {
      doc.rect(LEFT, y, WIDTH, 26).fill('#fef2f2').strokeColor('#dc2626').lineWidth(1.5).stroke();
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#991b1b')
        .text('URGENT: TIER-1 EMERGENCY — Immediate clinical action required', LEFT + 10, y + 7);
      y += 34;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 1: PATIENT DEMOGRAPHICS
    // ══════════════════════════════════════════════════════════════════════════
    y = sectionHeader('Patient Information', y);

    doc.rect(LEFT, y, WIDTH, 56).stroke('#e2e8f0');
    const pY = y + 6;
    labelValue('Patient Name', patient?.name ?? '—', pY);
    labelValue('Age / Sex', `${patient?.age ?? '—'} years / ${patient?.gender ? (patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)) : '—'}`, pY + 14);
    labelValue('Source File', analysis.originalName ?? '—', pY, COL_MID, COL_MID + 90);
    labelValue('Date of Study', analysis.processedAt ? new Date(analysis.processedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—', pY + 14, COL_MID, COL_MID + 90);
    if (analysis.notes) {
      labelValue('Clinical Notes', analysis.notes, pY + 28);
    }
    y += 62;

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 2: PRIMARY INTERPRETATION
    // ══════════════════════════════════════════════════════════════════════════
    y = sectionHeader('ECG Interpretation', y);

    const rhythmLabel = RHYTHM_LABELS[result.rhythm] ?? result.rhythm ?? '—';
    const confidence = result.confidence != null ? Math.round(result.confidence) : 0;

    // Primary diagnosis box
    const diagBg = result.isEmergency ? '#fef2f2' : confidence >= 80 ? '#f0fdf4' : '#fffbeb';
    const diagBorder = result.isEmergency ? '#dc2626' : confidence >= 80 ? '#16a34a' : '#d97706';
    doc.rect(LEFT, y, WIDTH, 38).fill(diagBg).strokeColor(diagBorder).lineWidth(1).stroke();
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748b').text('PRIMARY RHYTHM CLASSIFICATION', LEFT + 10, y + 5);
    doc.fontSize(13).font('Helvetica-Bold').fillColor('#0f172a').text(rhythmLabel, LEFT + 10, y + 16);

    // Confidence indicator
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#64748b').text('CONFIDENCE', RIGHT - 110, y + 5);
    doc.fontSize(16).font('Helvetica-Bold').fillColor(confidence >= 80 ? '#16a34a' : confidence >= 60 ? '#d97706' : '#dc2626')
      .text(`${confidence}%`, RIGHT - 110, y + 16);
    y += 46;

    // Signal metrics table
    doc.rect(LEFT, y, WIDTH, 16).fill('#f8fafc');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#475569')
      .text('PARAMETER', LEFT + 8, y + 4)
      .text('VALUE', LEFT + 160, y + 4)
      .text('REFERENCE RANGE', LEFT + 280, y + 4)
      .text('STATUS', LEFT + 430, y + 4);
    y += 16;

    const metrics = [
      ['Heart Rate', result.heartRate != null ? `${result.heartRate} bpm` : '—', '60 - 100 bpm', result.heartRate != null ? (result.heartRate >= 60 && result.heartRate <= 100 ? 'Normal' : 'Abnormal') : '—'],
      ['QRS Duration', result.qrsDuration != null ? `${result.qrsDuration} ms` : '—', '80 - 120 ms', result.qrsDuration != null ? (result.qrsDuration >= 80 && result.qrsDuration <= 120 ? 'Normal' : 'Abnormal') : '—'],
      ['QT Interval', result.qtInterval != null ? `${result.qtInterval} ms` : '—', '350 - 440 ms', result.qtInterval != null ? (result.qtInterval >= 350 && result.qtInterval <= 440 ? 'Normal' : 'Abnormal') : '—'],
      ['QTc Interval', result.qtcInterval != null ? `${result.qtcInterval} ms` : '—', '< 450 ms (M) / < 470 ms (F)', result.qtcInterval != null ? (result.qtcInterval < 470 ? 'Normal' : 'Prolonged') : '—'],
      ['RR Interval', result.rrInterval != null ? `${result.rrInterval} ms` : '—', '600 - 1000 ms', result.rrInterval != null ? (result.rrInterval >= 600 && result.rrInterval <= 1000 ? 'Normal' : 'Abnormal') : '—'],
    ];

    for (let i = 0; i < metrics.length; i++) {
      const [param, val, ref, status] = metrics[i];
      if (i % 2 === 0) doc.rect(LEFT, y, WIDTH, 14).fill('#ffffff');
      else doc.rect(LEFT, y, WIDTH, 14).fill('#f8fafc');
      doc.fontSize(8).font('Helvetica').fillColor('#1e293b').text(param, LEFT + 8, y + 3);
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#0f172a').text(val, LEFT + 160, y + 3);
      doc.fontSize(7.5).font('Helvetica').fillColor('#64748b').text(ref, LEFT + 280, y + 3);
      const statusColor = status === 'Normal' ? '#16a34a' : status === 'Abnormal' || status === 'Prolonged' ? '#dc2626' : '#94a3b8';
      doc.fontSize(7.5).font('Helvetica-Bold').fillColor(statusColor).text(status, LEFT + 430, y + 3);
      y += 14;
    }
    doc.rect(LEFT, y - 70, WIDTH, 70).stroke('#e2e8f0');

    // Abnormalities
    y += 6;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#475569').text('DETECTED ABNORMALITIES:', LEFT + 8, y);
    if (result.abnormalities?.length) {
      doc.fontSize(8.5).font('Helvetica').fillColor('#dc2626')
        .text(result.abnormalities.map(a => a.replace(/_/g, ' ')).join('  |  '), LEFT + 160, y, { width: WIDTH - 170 });
      y += doc.heightOfString(result.abnormalities.join('  |  '), { width: WIDTH - 170 }) + 8;
    } else {
      doc.fontSize(8.5).font('Helvetica').fillColor('#16a34a').text('No abnormalities detected', LEFT + 160, y);
      y += 16;
    }

    // ── Top predictions ──────────────────────────────────────────────────────
    if (result.topPredictions?.length > 1) {
      y = checkPageBreak(y, 80);
      y = sectionHeader('Differential Diagnosis (AI Predictions)', y);

      doc.rect(LEFT, y, WIDTH, 16).fill('#f8fafc');
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#475569')
        .text('RANK', LEFT + 8, y + 4)
        .text('CONDITION', LEFT + 50, y + 4)
        .text('SNOMED-CT', LEFT + 280, y + 4)
        .text('PROBABILITY', LEFT + 420, y + 4);
      y += 16;

      for (let i = 0; i < Math.min(result.topPredictions.length, 5); i++) {
        const pred = result.topPredictions[i];
        if (i % 2 === 0) doc.rect(LEFT, y, WIDTH, 14).fill('#ffffff');
        else doc.rect(LEFT, y, WIDTH, 14).fill('#f8fafc');
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#64748b').text(`${i + 1}.`, LEFT + 12, y + 3);
        doc.fontSize(8).font('Helvetica').fillColor('#1e293b').text(pred.fullName ?? pred.rhythm ?? '—', LEFT + 50, y + 3, { width: 220 });
        doc.fontSize(7.5).font('Courier').fillColor('#64748b').text(pred.snomedCt ?? '—', LEFT + 280, y + 3);

        // Probability bar
        const barW = Math.min((pred.confidence ?? 0), 100);
        const barColor = barW >= 70 ? '#16a34a' : barW >= 40 ? '#d97706' : '#94a3b8';
        doc.rect(LEFT + 420, y + 3, 80, 8).fill('#e2e8f0');
        doc.rect(LEFT + 420, y + 3, 80 * barW / 100, 8).fill(barColor);
        doc.fontSize(7).font('Helvetica-Bold').fillColor('#1e293b').text(`${pred.confidence ?? 0}%`, LEFT + 505, y + 3);
        y += 14;
      }
      doc.rect(LEFT, y - (14 * Math.min(result.topPredictions.length, 5)) - 16, WIDTH, (14 * Math.min(result.topPredictions.length, 5)) + 16).stroke('#e2e8f0');
      y += 6;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 3: CLINICAL CLASSIFICATIONS (ONTOLOGY)
    // ══════════════════════════════════════════════════════════════════════════
    if (result.ontologyEnrichment?.length) {
      y = checkPageBreak(y, 80);
      y = sectionHeader('Clinical Classifications & Recommendations', y);

      for (const item of result.ontologyEnrichment) {
        y = checkPageBreak(y, 50);
        const urgLabel = URGENCY_LABELS[item.urgencyTier] ?? (item.urgencyTier ?? '').toUpperCase();
        const urgColor = item.urgencyTier === 'critical' ? '#dc2626'
          : item.urgencyTier === 'high' ? '#d97706'
          : item.urgencyTier === 'moderate' ? '#ca8a04' : '#64748b';
        const urgBg = item.urgencyTier === 'critical' ? '#fef2f2'
          : item.urgencyTier === 'high' ? '#fffbeb'
          : '#f8fafc';

        doc.rect(LEFT, y, WIDTH, 1).fill('#e2e8f0');
        y += 4;
        doc.rect(LEFT + 3, y, 3, 12).fill(urgColor);
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#0f172a').text(item.displayName ?? '—', LEFT + 12, y);

        doc.rect(RIGHT - 70, y - 1, 62, 14).fill(urgBg).strokeColor(urgColor).lineWidth(0.5).stroke();
        doc.fontSize(7).font('Helvetica-Bold').fillColor(urgColor).text(urgLabel, RIGHT - 68, y + 2, { width: 58, align: 'center' });

        y += 16;
        doc.fontSize(7.5).font('Helvetica').fillColor('#64748b')
          .text(`Confidence Tier: ${item.confidenceTier ?? '—'}    |    Severity: ${item.severity ?? '—'}`, LEFT + 12, y);
        y += 12;

        if (item.recommendedTests?.length) {
          doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#475569').text('Recommended Tests:', LEFT + 12, y);
          doc.fontSize(7.5).font('Helvetica').fillColor('#1e293b')
            .text(item.recommendedTests.join(', '), LEFT + 120, y, { width: WIDTH - 132 });
          y += doc.heightOfString(item.recommendedTests.join(', '), { width: WIDTH - 132 }) + 6;
        }
        y += 4;
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 4: SPECIALIST REVIEW
    // ══════════════════════════════════════════════════════════════════════════
    if (review) {
      y = checkPageBreak(y, 100);
      y = sectionHeader('Specialist Cardiologist Review', y);

      const statusLabel = (review.reviewStatus ?? '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const statusColor = review.reviewStatus === 'completed' ? '#16a34a' : '#d97706';

      doc.rect(LEFT, y, WIDTH, 70).stroke('#e2e8f0');
      const rY = y + 6;
      labelValue('Review Status', statusLabel, rY);
      doc.fontSize(8.5).font('Helvetica-Bold').fillColor(statusColor).text(statusLabel, LEFT + 130, rY);
      labelValue('Priority', (review.priority ?? '—').charAt(0).toUpperCase() + (review.priority ?? '—').slice(1), rY + 14);
      labelValue('Expert Diagnosis', review.expertDiagnosis ?? '—', rY + 28);
      labelValue('Review Date', review.reviewDate ? new Date(review.reviewDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending', rY, COL_MID, COL_MID + 90);

      if (review.overrideReason) {
        labelValue('Override Reason', review.overrideReason, rY + 42);
      }
      y += 76;

      if (review.reviewNotes) {
        doc.rect(LEFT, y, WIDTH, 4).fill('#f8fafc');
        y += 4;
        doc.fontSize(7.5).font('Helvetica-Bold').fillColor('#475569').text('REVIEW NOTES:', LEFT + 8, y);
        y += 12;
        doc.fontSize(8).font('Helvetica').fillColor('#1e293b').text(review.reviewNotes, LEFT + 8, y, { width: WIDTH - 16 });
        y += doc.heightOfString(review.reviewNotes, { width: WIDTH - 16 }) + 8;
      }
    }

    // ══════════════════════════════════════════════════════════════════════════
    // SECTION 5: CLINICAL IMPRESSION
    // ══════════════════════════════════════════════════════════════════════════
    y = checkPageBreak(y, 80);
    y = sectionHeader('Clinical Impression', y);

    doc.rect(LEFT, y, WIDTH, 50).fill('#f8fafc').stroke('#e2e8f0');
    const impressionParts = [];
    impressionParts.push(`12-lead ECG analysis performed using AI model ${result.aiModel ?? 'LightECGNet'} (${result.modelVersion ?? 'v2'}).`);
    impressionParts.push(`Primary rhythm identified as ${rhythmLabel} with ${confidence}% confidence.`);
    if (result.abnormalities?.length) {
      impressionParts.push(`Notable findings: ${result.abnormalities.map(a => a.replace(/_/g, ' ')).join(', ')}.`);
    } else {
      impressionParts.push('No significant abnormalities detected.');
    }
    if (result.isEmergency) {
      impressionParts.push('This case has been flagged as a Tier-1 emergency requiring immediate clinical attention.');
    }
    if (review?.reviewStatus === 'completed') {
      impressionParts.push(`Specialist review completed${review.expertDiagnosis ? `: ${review.expertDiagnosis}` : ''}.`);
    }
    doc.fontSize(8).font('Helvetica').fillColor('#1e293b')
      .text(impressionParts.join(' '), LEFT + 10, y + 8, { width: WIDTH - 20, lineGap: 2 });
    y += 56;

    // ── Signature line ───────────────────────────────────────────────────────
    y = checkPageBreak(y, 60);
    y += 10;
    doc.fontSize(7.5).font('Helvetica').fillColor('#94a3b8').text('Electronically generated — no signature required', LEFT + 8, y);
    y += 14;
    doc.moveTo(LEFT, y).lineTo(LEFT + 200, y).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    doc.fontSize(7.5).font('Helvetica').fillColor('#64748b').text('Attending Physician', LEFT + 8, y + 4);
    doc.moveTo(COL_MID, y).lineTo(COL_MID + 200, y).strokeColor('#cbd5e1').lineWidth(0.5).stroke();
    doc.fontSize(7.5).font('Helvetica').fillColor('#64748b').text('Date', COL_MID + 8, y + 4);

    // ══════════════════════════════════════════════════════════════════════════
    // FOOTER — on every page
    // ══════════════════════════════════════════════════════════════════════════
    const pages = doc.bufferedPageRange();
    for (let i = 0; i < pages.count; i++) {
      doc.switchToPage(pages.start + i);
      doc.rect(LEFT, 775, WIDTH, 0.5).fill('#1a365d');
      doc.fontSize(6.5).font('Helvetica').fillColor('#94a3b8')
        .text(
          'DISCLAIMER: This report is generated by ECGenius AI-assisted diagnostic platform. It is intended to support trained healthcare '
          + 'professionals in clinical decision-making and does not constitute a definitive diagnosis. Clinical correlation is recommended. Not for self-diagnosis.',
          LEFT, 779, { width: WIDTH - 80, align: 'left' }
        );
      doc.fontSize(7).font('Helvetica-Bold').fillColor('#475569')
        .text(`${i + 1} / ${pages.count}`, RIGHT - 30, 779);
      doc.fontSize(6.5).font('Helvetica').fillColor('#94a3b8')
        .text(reportId, RIGHT - 80, 789, { width: 80, align: 'right' });
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

    if (review.reviewStatus === 'completed') {
      notify({
        userId: analysis.userId,
        category: 'review',
        title: 'Specialist review completed',
        description: `A cardiologist reviewed the ECG for ${analysis.patientInfo?.name ?? 'your upload'}.`,
        link: `/diagnosisdetail/${analysis._id}`,
        sourceType: 'SPECIALIST_REVIEW',
        sourceId: review._id,
      });
    }

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

    if (review.reviewStatus === 'completed') {
      const analysis = await ECGAnalysis.findById(review.analysisId).select('userId patientInfo');
      if (analysis) {
        notify({
          userId: analysis.userId,
          category: 'review',
          title: 'Specialist review completed',
          description: `A cardiologist reviewed the ECG for ${analysis.patientInfo?.name ?? 'your upload'}.`,
          link: `/diagnosisdetail/${analysis._id}`,
          sourceType: 'SPECIALIST_REVIEW',
          sourceId: review._id,
        });
      }
    }

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
