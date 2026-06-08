// Pure derivation of a cardiologist's personal review-activity insights from
// their own review queue — already-fetchable via reviewService.getQueue().
// Nothing is fabricated: volumes/distributions/breakdowns are computed strictly
// by grouping and counting real queue records.

import type { ReviewQueueItem, ReviewPriority, ReviewStatus } from '../types/review';

export interface CardiologistInsightsSummary {
  reviewQueueCount: number;
  completedReviewsCount: number;
  urgentCasesCount: number;
  reviewVolumeTrend: { date: string; count: number }[];
  priorityDistribution: { priority: ReviewPriority; count: number }[];
  statusBreakdown: { status: ReviewStatus; count: number }[];
  mostReviewedConditions: { label: string; count: number }[];
}

const TREND_DAYS = 14;
const CONDITIONS_LIMIT = 8;
const PRIORITIES: ReviewPriority[] = ['critical', 'urgent', 'normal'];
const STATUSES: ReviewStatus[] = ['pending', 'assigned', 'in_review', 'completed', 'escalated', 'rejected'];

function dayKey(iso: string): string {
  return iso.slice(0, 10);
}

function buildReviewVolumeTrend(queue: ReviewQueueItem[]): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  queue.forEach((item) => {
    if (!item.createdAt) return;
    const key = dayKey(item.createdAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  });

  const days: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = TREND_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, count: counts.get(key) ?? 0 });
  }
  return days;
}

function buildPriorityDistribution(queue: ReviewQueueItem[]): { priority: ReviewPriority; count: number }[] {
  const counts = new Map<ReviewPriority, number>();
  queue.forEach((item) => {
    counts.set(item.priority, (counts.get(item.priority) ?? 0) + 1);
  });
  return PRIORITIES.map((priority) => ({ priority, count: counts.get(priority) ?? 0 }));
}

function buildStatusBreakdown(queue: ReviewQueueItem[]): { status: ReviewStatus; count: number }[] {
  const counts = new Map<ReviewStatus, number>();
  queue.forEach((item) => {
    counts.set(item.status, (counts.get(item.status) ?? 0) + 1);
  });
  return STATUSES
    .map((status) => ({ status, count: counts.get(status) ?? 0 }))
    .filter((entry) => entry.count > 0);
}

function buildMostReviewedConditions(queue: ReviewQueueItem[]): { label: string; count: number }[] {
  const counts = new Map<string, number>();
  queue.forEach((item) => {
    const label = item.primaryDiagnosis?.trim();
    if (!label) return;
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, CONDITIONS_LIMIT);
}

export function buildCardiologistInsights(queue: ReviewQueueItem[]): CardiologistInsightsSummary {
  return {
    reviewQueueCount: queue.filter((item) => item.status === 'pending' || item.status === 'assigned' || item.status === 'in_review').length,
    completedReviewsCount: queue.filter((item) => item.status === 'completed').length,
    urgentCasesCount: queue.filter((item) => item.priority === 'urgent' || item.priority === 'critical').length,
    reviewVolumeTrend: buildReviewVolumeTrend(queue),
    priorityDistribution: buildPriorityDistribution(queue),
    statusBreakdown: buildStatusBreakdown(queue),
    mostReviewedConditions: buildMostReviewedConditions(queue),
  };
}
