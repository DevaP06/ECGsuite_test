// Pure derivation of notification feed items from already-fetchable role data.
// No backend notification endpoint exists, so items are derived strictly from
// real records the user already owns — nothing is invented. PATIENT/PHC_DOCTOR
// see updates about their own analyses; CARDIOLOGIST sees updates about their
// review queue. Read/dismissed state is tracked separately and persisted
// locally (see notificationStore.ts).

import type { ECGAnalysis } from '../types/ecg';
import type { ReviewQueueItem } from '../types/review';
import type { NotificationItem } from '../types/notification';

const RECENT_LIMIT = 12;

function byTimestampDesc(a: NotificationItem, b: NotificationItem): number {
  return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
}

function buildAnalysisNotifications(analyses: ECGAnalysis[]): NotificationItem[] {
  const items: NotificationItem[] = [];

  analyses.forEach((a) => {
    if (a.status === 'completed' && a.analysisResult) {
      items.push({
        id: `diagnosis-${a._id}`,
        category: 'diagnosis',
        title: 'AI diagnosis ready',
        description: `${a.analysisResult.rhythm} reported for ${a.patientInfo?.name ?? 'your upload'}.`,
        timestamp: a.processedAt ?? a.createdAt,
        link: `/diagnosisdetail/${a._id}`,
      });
    }

    if (a.analysisResult?.isEmergency === true) {
      items.push({
        id: `alert-emergency-${a._id}`,
        category: 'alert',
        title: 'Emergency finding detected',
        description: `${a.analysisResult.rhythm} was flagged as an emergency for ${a.patientInfo?.name ?? 'this analysis'}.`,
        timestamp: a.processedAt ?? a.createdAt,
        link: `/diagnosisdetail/${a._id}`,
      });
    }

    if (a.status === 'failed') {
      items.push({
        id: `alert-failed-${a._id}`,
        category: 'alert',
        title: 'Analysis failed',
        description: a.failureReason?.trim() || 'Your ECG analysis could not be completed.',
        timestamp: a.createdAt,
        link: `/analysis-failed/${a._id}`,
      });
    }
  });

  return items;
}

function buildQueueNotifications(queue: ReviewQueueItem[]): NotificationItem[] {
  return queue
    .filter((item) => item.status === 'pending' || item.status === 'assigned' || item.status === 'in_review')
    .map((item) => {
      const isUrgent = item.priority === 'urgent' || item.priority === 'critical';
      return {
        id: `review-${item._id}`,
        category: isUrgent ? 'alert' : 'review',
        title: isUrgent ? 'Urgent case awaiting review' : 'New case in your review queue',
        description: `${item.primaryDiagnosis ?? 'Diagnosis pending'} — ${item.patientName ?? 'Unknown patient'}`,
        timestamp: item.createdAt,
        link: `/cardiologist/review/${item.analysisId}`,
      } satisfies NotificationItem;
    });
}

export function buildNotifications(analyses: ECGAnalysis[], queue: ReviewQueueItem[]): NotificationItem[] {
  return [...buildAnalysisNotifications(analyses), ...buildQueueNotifications(queue)]
    .sort(byTimestampDesc)
    .slice(0, RECENT_LIMIT);
}
