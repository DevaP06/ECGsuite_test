import asyncHandler from '../middleware/asyncHandler.js';
import { sendResponse } from '../utils/responseHandler.js';
import SpecialistReview from '../models/SpecialistReview.js';
import Validation from '../models/Validation.js';
import Feedback, { FEEDBACK_TYPE_VALUES } from '../models/Feedback.js';
import ECGAnalysis from '../models/ECGAnalysis.js';
import { logAction } from '../services/auditService.js';

const VALID_PERIODS = ['day', 'week', 'month', 'all'];

const SLA_TIERS = {
  critical: { key: 'tier1Critical', targetHours: 4 },
  urgent: { key: 'tier2Urgent', targetHours: 24 },
  normal: { key: 'tier3Normal', targetHours: 48 }
};

const resolvePeriod = (value, fallback) => (VALID_PERIODS.includes(String(value)) ? String(value) : fallback);

const periodStartDate = (period) => {
  const now = new Date();
  switch (period) {
    case 'day': {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'week': {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case 'month': {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    case 'all':
    default:
      return null;
  }
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const minutesBetween = (start, end) => Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60000);

const dateKey = (value) => new Date(value).toISOString().slice(0, 10);

// POST /api/analytics/feedback  (CARDIOLOGIST only)
export const submitFeedback = asyncHandler(async (req, res) => {
  const analysisId = String(req.body.analysisId ?? '');
  if (!analysisId.match(/^[a-f\d]{24}$/i)) {
    return sendResponse(res, 400, false, 'A valid analysisId is required');
  }

  const feedbackType = String(req.body.feedbackType ?? '');
  if (!FEEDBACK_TYPE_VALUES.includes(feedbackType)) {
    return sendResponse(res, 400, false, `feedbackType must be one of: ${FEEDBACK_TYPE_VALUES.join(', ')}`);
  }

  const notes = req.body.notes !== undefined ? String(req.body.notes).trim() : undefined;
  const cardiologistId = req.user._id || req.user.id;

  const analysis = await ECGAnalysis.findById(analysisId).select('_id');
  if (!analysis) {
    return sendResponse(res, 404, false, 'ECG analysis not found');
  }

  const feedback = await Feedback.create({ analysisId, cardiologistId, feedbackType, notes });

  logAction({ req, userId: cardiologistId, entityType: 'FEEDBACK', entityId: feedback._id, action: 'REVIEW', newValue: { analysisId, feedbackType } });

  return sendResponse(res, 201, true, 'Feedback submitted successfully', { feedback });
});

// GET /api/analytics/review-metrics?period=week  (CARDIOLOGIST only)
export const getReviewMetrics = asyncHandler(async (req, res) => {
  const period = resolvePeriod(req.query.period, 'week');
  const cardiologistId = req.user._id || req.user.id;
  const since = periodStartDate(period);

  const completedFilter = { cardiologistId, reviewStatus: 'completed' };
  if (since) completedFilter.reviewDate = { $gte: since };

  const validationFilter = { cardiologistId };
  if (since) validationFilter.createdAt = { $gte: since };

  const [completedReviews, pendingCount, completedToday, validations] = await Promise.all([
    SpecialistReview.find(completedFilter).select('priority createdAt reviewDate overrideReason').lean(),
    SpecialistReview.countDocuments({ reviewStatus: { $in: ['pending', 'in_review'] } }),
    SpecialistReview.countDocuments({ cardiologistId, reviewStatus: 'completed', reviewDate: { $gte: startOfToday() } }),
    Validation.find(validationFilter).select('aiRhythmCorrect aiAbnormalitiesCorrect correctedRhythm').lean()
  ]);

  const slaCounts = {
    tier1Critical: { met: 0, total: 0 },
    tier2Urgent: { met: 0, total: 0 },
    tier3Normal: { met: 0, total: 0 }
  };
  const dailyMap = new Map();
  let totalMinutes = 0;

  for (const review of completedReviews) {
    const completedAt = review.reviewDate || review.createdAt;
    const minutes = minutesBetween(review.createdAt, completedAt);
    totalMinutes += minutes;

    const tier = SLA_TIERS[review.priority] ?? SLA_TIERS.normal;
    const bucket = slaCounts[tier.key];
    bucket.total += 1;
    if (minutes <= tier.targetHours * 60) bucket.met += 1;

    const key = dateKey(completedAt);
    if (!dailyMap.has(key)) {
      dailyMap.set(key, { date: key, reviewed: 0, overridden: 0, escalated: 0, totalMinutes: 0 });
    }
    const day = dailyMap.get(key);
    day.reviewed += 1;
    day.totalMinutes += minutes;
    if (review.overrideReason) day.overridden += 1;
    if (review.priority === 'critical') day.escalated += 1;
  }

  const dailyStats = [...dailyMap.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(({ date, reviewed, overridden, escalated, totalMinutes: mins }) => ({
      date,
      reviewed,
      overridden,
      escalated,
      avgMinutes: reviewed > 0 ? Math.round(mins / reviewed) : 0
    }));

  const aiCorrect = validations.filter((v) => v.aiRhythmCorrect && v.aiAbnormalitiesCorrect).length;
  const aiOverridden = validations.length - aiCorrect;
  const overrideRate = validations.length > 0 ? Math.round((aiOverridden / validations.length) * 100) / 100 : 0;

  const overriddenRhythmCounts = new Map();
  for (const v of validations) {
    if (!v.aiRhythmCorrect && v.correctedRhythm) {
      overriddenRhythmCounts.set(v.correctedRhythm, (overriddenRhythmCounts.get(v.correctedRhythm) ?? 0) + 1);
    }
  }
  let topOverriddenRhythm;
  let topCount = 0;
  for (const [rhythm, count] of overriddenRhythmCounts) {
    if (count > topCount) {
      topCount = count;
      topOverriddenRhythm = rhythm;
    }
  }

  return sendResponse(res, 200, true, 'Review metrics fetched successfully', {
    metrics: {
      period,
      totalReviewed: completedReviews.length,
      pendingCount,
      completedToday,
      avgReviewMinutes: completedReviews.length > 0 ? Math.round(totalMinutes / completedReviews.length) : 0,
      accuracy: {
        totalReviewed: validations.length,
        aiCorrect,
        aiOverridden,
        overrideRate,
        ...(topOverriddenRhythm && { topOverriddenRhythm })
      },
      sla: {
        tier1Critical: { target: 4, ...slaCounts.tier1Critical },
        tier2Urgent: { target: 24, ...slaCounts.tier2Urgent },
        tier3Normal: { target: 48, ...slaCounts.tier3Normal }
      },
      dailyStats
    }
  });
});

// GET /api/analytics/insights?period=month  (CARDIOLOGIST only)
export const getInsights = asyncHandler(async (req, res) => {
  const period = resolvePeriod(req.query.period, 'month');
  const cardiologistId = req.user._id || req.user.id;
  const since = periodStartDate(period);

  const filter = { cardiologistId, reviewStatus: 'completed' };
  if (since) filter.reviewDate = { $gte: since };

  const reviews = await SpecialistReview.find(filter)
    .select('analysisId overrideReason reviewDate')
    .populate({ path: 'analysisId', select: 'analysisResult' })
    .lean();

  const distributionMap = new Map();
  const abnormalityCounts = new Map();
  const trendMap = new Map();
  let totalCases = 0;

  for (const review of reviews) {
    const result = review.analysisId?.analysisResult;
    if (!result) continue;
    totalCases += 1;

    const rhythm = result.rhythm ?? 'other';
    if (!distributionMap.has(rhythm)) {
      distributionMap.set(rhythm, { rhythm, count: 0, overrideCount: 0, confidenceTotal: 0 });
    }
    const entry = distributionMap.get(rhythm);
    entry.count += 1;
    entry.confidenceTotal += Number(result.confidence ?? 0);
    if (review.overrideReason) entry.overrideCount += 1;

    for (const abnormality of (result.abnormalities ?? [])) {
      abnormalityCounts.set(abnormality, (abnormalityCounts.get(abnormality) ?? 0) + 1);
    }

    const day = dateKey(review.reviewDate);
    const trendKey = `${day}::${rhythm}`;
    if (!trendMap.has(trendKey)) {
      trendMap.set(trendKey, { date: day, condition: rhythm, count: 0 });
    }
    trendMap.get(trendKey).count += 1;
  }

  const diagnosisDistribution = [...distributionMap.values()]
    .map(({ rhythm, count, overrideCount, confidenceTotal }) => ({
      rhythm,
      count,
      overrideCount,
      confidence: count > 0 ? Math.round((confidenceTotal / count) * 100) / 100 : 0
    }))
    .sort((a, b) => b.count - a.count);

  const topAbnormalities = [...abnormalityCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const conditionTrends = [...trendMap.values()].sort((a, b) => a.date.localeCompare(b.date));

  return sendResponse(res, 200, true, 'Insights fetched successfully', {
    insights: { period, totalCases, diagnosisDistribution, topAbnormalities, conditionTrends }
  });
});
