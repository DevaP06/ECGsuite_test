import ECGAnalysis from '../models/ECGAnalysis.js';
import { sendResponse } from '../utils/responseHandler.js';

// Save ECG analysis record
export const saveAnalysis = async (req, res) => {
  try {
    const { userId } = req.user;
    const { diagnosis, imagePath } = req.body;

    const record = new ECGAnalysis({ user: userId, diagnosis, imagePath, date: new Date() });
    await record.save();

    return sendResponse(res, 201, true, 'Analysis saved', record);
  } catch (error) {
    return sendResponse(res, 500, false, 'Could not save analysis');
  }
};

// Get user’s ECG analyses
export const getUserAnalyses = async (req, res) => {
  try {
    const { userId } = req.user;
    const records = await ECGAnalysis.find({ user: userId }).sort({ date: -1 });
    return sendResponse(res, 200, true, 'Analyses fetched successfully', records);
  } catch (error) {
    return sendResponse(res, 500, false, 'Could not fetch analyses');
  }
};
