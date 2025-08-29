const express = require('express');
const router = express.Router();
const upload = require('./src/Middleware/uploadMiddleware');
const diagnoseController = require('./src/controllers/diagnoseController');

// ECG Diagnose endpoint
router.post('/diagnose', upload.single('ecgImage'), diagnoseController.diagnoseECG);

module.exports = router;
