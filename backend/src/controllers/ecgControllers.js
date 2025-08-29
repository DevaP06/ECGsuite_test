import ECGAnalysis from '../models/ECGAnalysis.js';

// Save ECG analysis record
export const saveAnalysis = async (req, res) => {
  try {
    const { userId } = req.user;
    const { diagnosis, imagePath } = req.body;

    const record = new ECGAnalysis({ user: userId, diagnosis, imagePath, date: new Date() });
    await record.save();

    res.status(201).json({ message: 'Analysis saved', record });
  } catch (error) {
    res.status(500).json({ error: 'Could not save analysis' });
  }
};

// Get user’s ECG analyses
export const getUserAnalyses = async (req, res) => {
  try {
    const { userId } = req.user;
    const records = await ECGAnalysis.find({ user: userId }).sort({ date: -1 });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Could not fetch analyses' });
  }
};
