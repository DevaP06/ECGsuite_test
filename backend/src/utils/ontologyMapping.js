// Shared mapping between the ECGenius-Ontology-layer /diagnose response and the
// flat { displayName, confidenceTier, urgencyTier, ... } shape AnalysisResult
// expects. Used by both the upload path (ecgRoutes.js) and the clinical-context
// re-fusion path (clinicalContextController.js) so the two never drift.

// Ontology triage tier (1/2/3) → AnalysisResult urgency vocabulary.
export const ONTOLOGY_TIER_TO_URGENCY = { 1: 'critical', 2: 'high', 3: 'moderate' };

// Lower rank wins when reducing per-finding urgencyTier values down to a single
// top-level emergencyLevel.
export const EMERGENCY_LEVEL_RANK = { critical: 0, high: 1, moderate: 2, low: 3, none: 4 };

export const mapOntologyEnrichment = (ontology) => {
  const differential = Array.isArray(ontology?.differential) ? ontology.differential : [];

  return differential.map(item => ({
    displayName: item.label_name,
    confidenceTier: item.confidence_label,
    urgencyTier: ONTOLOGY_TIER_TO_URGENCY[item.tier] ?? 'low',
    isEmergency: item.tier === 1,
    severity: item.tier_label,
    recommendedTests: item.default_action ? [item.default_action] : [],
  }));
};

export const deriveEmergencyLevel = (ontologyEnrichment) => {
  if (!Array.isArray(ontologyEnrichment)) return 'none';
  return ontologyEnrichment.reduce((level, item) => {
    const tier = item?.urgencyTier;
    return tier && EMERGENCY_LEVEL_RANK[tier] < EMERGENCY_LEVEL_RANK[level] ? tier : level;
  }, 'none');
};
