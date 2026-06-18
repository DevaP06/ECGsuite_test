import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import ECGAnalysis from '../models/ECGAnalysis.js';
import Patient from '../models/Patient.js';
import SpecialistReview from '../models/SpecialistReview.js';

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getDoctorStats = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.id;
  const today = startOfToday();

  const [ecgsToday, pendingReviews, criticalAlerts, totalPatients] = await Promise.all([
    ECGAnalysis.countDocuments({ userId, createdAt: { $gte: today } }),
    SpecialistReview.countDocuments({
      requestedBy: userId,
      reviewStatus: { $in: ['pending', 'in_review'] },
    }),
    SpecialistReview.countDocuments({
      requestedBy: userId,
      priority: 'critical',
      reviewStatus: { $in: ['pending', 'in_review'] },
    }),
    Patient.countDocuments({ registeredBy: userId }),
  ]);

  return sendResponse(res, 200, true, 'Dashboard stats fetched', {
    ecgsToday,
    pendingReviews,
    criticalAlerts,
    totalPatients,
  });
});
