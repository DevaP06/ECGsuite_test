import type { OntologyItem } from '../types/ecg';
import type { ClinicalContext } from '../types/clinicalContext';
import type {
  EvidenceSource,
  OntologyDiagnosis,
  OntologyEvidence,
  OntologyFinding,
  OntologyFusionResult,
  OntologyInput,
  OntologyScore,
} from '../types/ontologyFusion';
import { getQuestionLabel } from '../data/questionLabels';

const EVIDENCE_SOURCES: EvidenceSource[] = ['ecg', 'symptom', 'riskFactor', 'vital'];

type ContextCategory = 'symptoms' | 'riskFactors' | 'vitals';

function contextEvidence(
  context: ClinicalContext | null | undefined,
  category: ContextCategory,
  source: EvidenceSource,
): OntologyEvidence[] {
  if (!context) return [];
  return Object.entries(context[category] ?? {})
    .filter(([, present]) => present === true)
    .map(([key]) => ({ source, label: getQuestionLabel(key), detail: key }));
}

/**
 * Re-organizes evidence the backend/user already produced into source-grouped buckets.
 * No new evidence is generated — abnormalities become "ecg" evidence, submitted clinical
 * context answers become "symptom"/"riskFactor"/"vital" evidence.
 */
export function mergeEvidence(input: OntologyInput): Record<EvidenceSource, OntologyEvidence[]> {
  const ecg: OntologyEvidence[] = (input.ecgFindings ?? [])
    .filter((finding): finding is string => typeof finding === 'string' && finding.trim().length > 0)
    .map((finding) => ({ source: 'ecg', label: finding }));

  const context = input.clinicalContext ?? null;

  return {
    ecg,
    symptom: contextEvidence(context, 'symptoms', 'symptom'),
    riskFactor: contextEvidence(context, 'riskFactors', 'riskFactor'),
    vital: contextEvidence(context, 'vitals', 'vital'),
  };
}

/**
 * Collapses evidence that appears under more than one source (e.g. an abnormality the
 * patient also confirmed as a symptom) into a single finding, counting occurrences.
 */
export function deduplicateFindings(
  evidenceGroups: Record<EvidenceSource, OntologyEvidence[]>,
): OntologyFinding[] {
  const findingsByKey = new Map<string, OntologyFinding>();

  EVIDENCE_SOURCES.forEach((source) => {
    (evidenceGroups[source] ?? []).forEach((evidence) => {
      const key = evidence.label.trim().toLowerCase();
      if (!key) return;
      const existing = findingsByKey.get(key);
      if (existing) {
        existing.occurrences += 1;
        if (!existing.sources.includes(source)) existing.sources.push(source);
      } else {
        findingsByKey.set(key, { key, label: evidence.label, sources: [source], occurrences: 1 });
      }
    });
  });

  return Array.from(findingsByKey.values());
}

/**
 * Re-presents each backend-provided OntologyItem as a ranked OntologyDiagnosis, ordered
 * by the item's own confidence value. No new diagnoses or probabilities are produced —
 * this purely cross-references the existing item against the merged evidence groups.
 */
export function rankDiagnoses(
  ontologyItems: OntologyItem[] | undefined,
  evidenceGroups: Record<EvidenceSource, OntologyEvidence[]>,
): OntologyDiagnosis[] {
  const items = ontologyItems ?? [];
  const symptoms = (evidenceGroups.symptom ?? []).map((e) => e.label);
  const riskFactors = (evidenceGroups.riskFactor ?? []).map((e) => e.label);
  const ecgFindings = (evidenceGroups.ecg ?? []).map((e) => e.label);

  return [...items]
    .sort((a, b) => (b.confidence ?? -1) - (a.confidence ?? -1))
    .map((item) => ({
      displayName: item.displayName,
      confidence: item.confidence,
      confidenceTier: item.confidenceTier,
      urgencyTier: item.urgencyTier,
      isEmergency: item.isEmergency,
      severity: item.severity,
      snomedCode: item.snomedCode,
      icd10Code: item.icd10Code,
      evidence: (item.evidence ?? []).map((label) => ({ source: 'ecg' as const, label })),
      symptoms,
      riskFactors,
      ecgFindings,
      recommendedTests: item.recommendedTests ?? [],
    }));
}

function buildEcgScore(items: OntologyItem[]): OntologyScore {
  const withConfidence = items.filter((item): item is OntologyItem & { confidence: number } =>
    typeof item.confidence === 'number');
  if (withConfidence.length === 0) {
    return { category: 'ecg', label: 'ECG Evidence Confidence', available: false };
  }
  const top = withConfidence.reduce((max, item) => (item.confidence > max.confidence ? item : max));
  return { category: 'ecg', label: 'ECG Evidence Confidence', value: top.confidence, available: true };
}

const PLACEHOLDER_SCORES: OntologyScore[] = [
  { category: 'clinical', label: 'Clinical Context Confidence', available: false },
  { category: 'risk', label: 'Risk Factor Confidence', available: false },
  { category: 'vitals', label: 'Vitals Confidence', available: false },
];

/**
 * Composes the full fusion result. Every score is either a real backend-provided value
 * (overall analysis confidence, top ontology item confidence) or an explicit
 * `available: false` placeholder — never a locally-computed composite.
 */
export function buildFusionResult(input: OntologyInput): OntologyFusionResult {
  const evidenceGroups = mergeEvidence(input);
  const findings = deduplicateFindings(evidenceGroups);
  const diagnoses = rankDiagnoses(input.ontologyItems, evidenceGroups);

  const overall: OntologyScore = {
    category: 'overall',
    label: 'Overall Confidence',
    value: input.overallConfidence,
    available: input.overallConfidence !== undefined,
  };

  return {
    analysisId: input.analysisId,
    diagnoses,
    evidenceGroups,
    findings,
    scores: [overall, buildEcgScore(input.ontologyItems ?? []), ...PLACEHOLDER_SCORES],
    generatedAt: new Date().toISOString(),
  };
}
