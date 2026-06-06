import { BookOpen } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function OntologyRulesPage() {
  return (
    <ComingSoonLayout
      title="Ontology Rules"
      description="View and manage the SNOMED CT and ICD-10 mapping rules used in AI-assisted diagnosis enrichment and ontology panel generation."
      icon={BookOpen}
      iconBg="bg-teal-50"
      iconColor="text-teal-500"
      plannedFeatures={[
        'Browse active SNOMED CT condition mappings',
        'ICD-10 code assignment rules per condition',
        'Confidence threshold configuration per tier',
        'Custom rule creation for institution-specific conditions',
        'Version history and change audit for all rules',
      ]}
    />
  );
}
