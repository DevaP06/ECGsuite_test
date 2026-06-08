import { ecgService } from './ecgService';
import { reviewService } from './reviewService';
import { buildDoctorInsights } from '../utils/doctorInsights';
import type { DoctorInsightsSummary } from '../utils/doctorInsights';

export async function getDoctorInsights(): Promise<DoctorInsightsSummary> {
  const [analyses, requests] = await Promise.all([
    ecgService.getMyAnalyses(),
    reviewService.getMyRequests(),
  ]);
  return buildDoctorInsights(analyses, requests);
}
