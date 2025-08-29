import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import ECGAnalysis from '../models/ECGAnalysis.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for ECG file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/ecg/'));
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

// Upload ECG file
router.post('/upload', upload.single('ecgFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No ECG file uploaded' });
    }

    const { patientName, patientAge, patientGender, notes } = req.body;
    const userId = req.user.id; // From auth middleware

    const ecgAnalysis = new ECGAnalysis({
      userId,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      patientInfo: {
        name: patientName,
        age: patientAge,
        gender: patientGender
      },
      notes,
      status: 'uploaded',
      uploadedAt: new Date()
    });

    await ecgAnalysis.save();

    res.status(201).json({
      success: true,
      message: 'ECG file uploaded successfully',
      analysisId: ecgAnalysis._id,
      fileName: req.file.filename
    });

  } catch (error) {
    console.error('ECG upload error:', error);
    res.status(500).json({ 
      error: 'Failed to upload ECG file',
      message: error.message 
    });
  }
});

// Get user's ECG analyses
router.get('/my-analyses', async (req, res) => {
  try {
    const userId = req.user.id;
    const analyses = await ECGAnalysis.find({ userId })
      .sort({ createdAt: -1 })
      .select('-filePath'); // Don't send file paths

    res.json({
      success: true,
      analyses,
      count: analyses.length
    });

  } catch (error) {
    console.error('Error fetching ECG analyses:', error);
    res.status(500).json({ 
      error: 'Failed to fetch ECG analyses',
      message: error.message 
    });
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

export default router;
