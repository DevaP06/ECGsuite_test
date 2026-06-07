// Local-derivation layer for ontology evidence fusion.
// No backend ontology-fusion endpoint exists yet, so the "fusion result" is computed
// locally from data the analysis/clinical-context already carry (mirrors the
// clinicalContextService pattern: persist locally, ready to wire to a real backend later).

import type { ECGAnalysis } from '../types/ecg';
import type { ClinicalContext } from '../types/clinicalContext';
import type { AnswersMap } from '../types/questionnaire';
import type {
  OntologyFusionResult,
  OntologyInput,
  OntologyProcessingStatus,
} from '../types/ontologyFusion';
import { buildFusionResult } from '../utils/ontologyFusion';

const SUBMITTED_KEY_PREFIX = 'ecg:ontologyFusion:submitted:';

export function buildOntologyInput(
  analysis: ECGAnalysis,
  clinicalContext?: ClinicalContext | null,
  riskFactorAnswers?: AnswersMap,
): OntologyInput {
  const result = analysis.analysisResult;
  return {
    analysisId: analysis._id,
    ecgFindings: result?.abnormalities ?? [],
    ontologyItems: result?.ontologyEnrichment ?? [],
    clinicalContext: clinicalContext ?? null,
    riskFactorAnswers,
    overallConfidence: typeof result?.confidence === 'number' ? result.confidence : undefined,
  };
}

export async function submitOntologyInput(input: OntologyInput): Promise<void> {
  try {
    localStorage.setItem(
      `${SUBMITTED_KEY_PREFIX}${input.analysisId}`,
      JSON.stringify({ ...input, submittedAt: new Date().toISOString() })
    );
  } catch {
    // quota exceeded — ignore silently, mirrors clinicalContextService
  }
}

/**
 * Returns a locally-derived fusion result, or null when there isn't enough source
 * data (no ontology enrichment and no clinical context) to produce one — callers
 * should render a graceful empty state rather than an empty-but-present result.
 */
export async function getOntologyResult(
  analysis: ECGAnalysis,
  clinicalContext?: ClinicalContext | null,
  riskFactorAnswers?: AnswersMap,
): Promise<OntologyFusionResult | null> {
  const input = buildOntologyInput(analysis, clinicalContext, riskFactorAnswers);
  if (input.ontologyItems.length === 0 && !input.clinicalContext) {
    return null;
  }
  return buildFusionResult(input);
}

export function getOntologyStatus(
  analysis: ECGAnalysis,
  hasClinicalContext?: boolean,
): OntologyProcessingStatus {
  const hasOntologyItems = (analysis.analysisResult?.ontologyEnrichment?.length ?? 0) > 0;
  if (hasOntologyItems) return 'completed';
  if (hasClinicalContext) return 'pending';
  return 'unavailable';
}
