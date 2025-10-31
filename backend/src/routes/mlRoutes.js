// import express from 'express';
// import multer from 'multer';
// import axios from 'axios';
// import FormData from 'form-data';
// import fs from 'fs';

// const router = express.Router();
// const upload = multer({ dest: 'uploads/' }); // Temporary storage for uploads

// // Define the base URL for your Python Flask service
// const PYTHON_API_URL = 'http://localhost:5001';

// // --- ECG Image Analysis Endpoint ---
// router.post('/analyze-ecg-image', upload.single('ecgFile'), async (req, res) => {
//     // This route now only processes the image and returns features.
//     // The final classification happens in the '/classify-ecg' route.
//     try {
//         if (!req.file) {
//             return res.status(400).json({ error: 'No ECG image uploaded' });
//         }

//         // Create a form to send the file to the Python service
//         const form = new FormData();
//         form.append('ecgImage', fs.createReadStream(req.file.path));

//         // Make the API call to the Python service's /process-image endpoint
//         const response = await axios.post(`${PYTHON_API_URL}/process-image`, form, {
//             headers: { ...form.getHeaders() }
//         });

//         res.json(response.data); // Forward the response from Python to the client

//     } catch (error) {
//         console.error('Error calling Python service:', error.response?.data || error.message);
//         res.status(500).json({
//             error: 'Failed to analyze ECG image',
//             details: error.response?.data || 'The ML service may be down.'
//         });
//     } finally {
//         // IMPORTANT: Clean up the temporary file
//         if (req.file?.path) {
//             fs.unlinkSync(req.file.path);
//         }
//     }
// });

// // --- ECG Classification Endpoint ---
// router.post('/classify-ecg', async (req, res) => {
//     try {
//         const { patientData } = req.body;
//         if (!patientData) {
//             return res.status(400).json({ error: 'Patient data required' });
//         }

//         // Make a direct JSON API call to the Python service's /classify endpoint
//         const response = await axios.post(`${PYTHON_API_URL}/classify`, {
//             patientData: patientData 
//         });

//         res.json(response.data); // Forward the response from Python to the client

//     } catch (error) {
//         console.error('Error calling Python service:', error.response?.data || error.message);
//         res.status(500).json({
//             error: 'Failed to classify ECG data',
//             details: error.response?.data || 'The ML service may be down.'
//         });
//     }
// });

// // Your other routes (history, delete, health check) can remain the same
// // ...

// export default router;




import express from 'express';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const router = express.Router();

// Store uploads temporarily on disk (cleaned up after each request)
const upload = multer({ dest: 'uploads/' });

// Base URL for your Flask service
const PYTHON_API_URL = 'http://127.0.0.1:5001';

// Simple health check for ML proxy
router.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', service: 'ml' });
});

/**
 * POST /api/ml/analyze-ecg-image
 * Proxies an ECG image to Flask /analyze-ecg-image and returns analysis/features.
 * Expects multipart/form-data with file field named: ecgFile (from client).
 * Will forward to Flask with field name: ecgImage (as Flask expects).
 */
router.post('/analyze-ecg-image', upload.single('ecgFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No ECG image uploaded' });
    }

    const form = new FormData();
    // Forward as 'ecgImage' because Flask expects that key
    form.append('ecgImage', fs.createReadStream(req.file.path), {
      filename: req.file.originalname || 'ecg.png',
      contentType: req.file.mimetype || 'image/png',
    });

    const response = await axios.post(`${PYTHON_API_URL}/analyze-ecg-image`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error calling Flask /analyze-ecg-image:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to analyze ECG image',
      details: error.response?.data || 'The ML service may be down.',
    });
  } finally {
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
  }
});

/**
 * POST /api/ml/classify
 * Proxies JSON patient data to Flask /classify and returns predictions.
 * Body: { patientData: { ... } }
 */
router.post('/classify', async (req, res) => {
  try {
    const { patientData } = req.body || {};
    if (!patientData) {
      return res.status(400).json({ success: false, error: 'patientData is required' });
    }

    const response = await axios.post(`${PYTHON_API_URL}/classify`, { patientData }, {
      headers: { 'Content-Type': 'application/json' },
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error calling Flask /classify:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to classify ECG data',
      details: error.response?.data || 'The ML service may be down.',
    });
  }
});

/**
 * NEW: POST /api/ml/classify-ecg-image
 * Single-call flow: upload ECG image + demographics, Flask analyzes and classifies.
 * Expects multipart/form-data with:
 *   - ecgFile: File (from client)
 *   - patientAge: number
 *   - gender: "MALE" | "FEMALE" | 1 | 0
 * Forwards to Flask /classify-ecg-image with the keys Flask expects:
 *   - ecgImage (file), patientAge (text), gender (text)
 */
router.post('/classify-ecg-image', upload.single('ecgFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No ECG image uploaded' });
    }

    const { patientAge, gender } = req.body || {};
    if (patientAge == null || gender == null) {
      return res.status(400).json({ success: false, error: 'patientAge and gender are required' });
    }

    const form = new FormData();
    // Forward file with key Flask expects
    form.append('ecgImage', fs.createReadStream(req.file.path), {
      filename: req.file.originalname || 'ecg.png',
      contentType: req.file.mimetype || 'image/png',
    });
    // Forward text fields
    form.append('patientAge', String(patientAge));
    form.append('gender', String(gender));

    const response = await axios.post(`${PYTHON_API_URL}/classify-ecg-image`, form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error calling Flask /classify-ecg-image:', error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      error: 'Failed to classify ECG image',
      details: error.response?.data || 'The ML service may be down.',
    });
  } finally {
    if (req.file?.path) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
  }
});

export default router;
