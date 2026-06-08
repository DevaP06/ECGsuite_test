import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layers, ListOrdered, Gauge, ClipboardCheck, ArrowRight } from 'lucide-react';
import { reviewService } from '../../services/reviewService';
import type { OntologyFusionResult } from '../../types/ontologyFusion';
import type { SpecialistReview, ReviewStatus } from '../../types/review';

interface Props {
  result: OntologyFusionResult | null;
  analysisId: string;
}

const STATUS_LABEL: Record<ReviewStatus, string> = {
  pending: 'Pending Review',
  assigned: 'Assigned',
  in_review: 'In Review',
  completed: 'Review Complete',
  escalated: 'Escalated',
  rejected: 'Rejected',
};

function scrollToReviewStatus(e: React.MouseEvent) {
  e.preventDefault();
  document.getElementById('review-status')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function EvidenceFusionSummary({ result, analysisId }: Props) {
  const [review, setReview] = useState<SpecialistReview | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!analysisId) return;
    (async () => {
      try {
        const data = await reviewService.getAnalysisReview(analysisId);
        if (!cancelled) setReview(data);
      } catch {
        // graceful — review status simply won't be shown in the summary
      }
    })();
    return () => { cancelled = true; };
  }, [analysisId]);

  const evidenceCount = result ? Object.values(result.evidenceGroups).flat().length : 0;
  const diagnosesCount = result?.diagnoses.length ?? 0;
  const overall = result?.scores.find((s) => s.category === 'overall');

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-blue-500" />
        <h3 className="text-sm font-semibold text-slate-800">Evidence Fusion Summary</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-gray-100 px-3 py-3 text-center">
          <ListOrdered className="w-4 h-4 text-slate-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-800">{evidenceCount}</p>
          <p className="text-xs text-slate-500">Evidence Items</p>
        </div>
        <div className="rounded-lg border border-gray-100 px-3 py-3 text-center">
          <Layers className="w-4 h-4 text-slate-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-800">{diagnosesCount}</p>
          <p className="text-xs text-slate-500">Candidate Diagnoses</p>
        </div>
        <div className="rounded-lg border border-gray-100 px-3 py-3 text-center">
          <Gauge className="w-4 h-4 text-slate-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-slate-800">
            {overall?.available && overall.value !== undefined ? `${overall.value}%` : '—'}
          </p>
          <p className="text-xs text-slate-500">Overall Confidence</p>
        </div>
        <div className="rounded-lg border border-gray-100 px-3 py-3 text-center">
          <ClipboardCheck className="w-4 h-4 text-slate-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-slate-800 mt-0.5">
            {review ? STATUS_LABEL[review.reviewStatus] : 'Not Requested'}
          </p>
          <p className="text-xs text-slate-500">Review Status</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Link
          to={`/diagnosisdetail/${analysisId}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
        >
          View Full Diagnosis <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <a
          href="#review-status"
          onClick={scrollToReviewStatus}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-blue-600 transition"
        >
          Specialist Review <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}
