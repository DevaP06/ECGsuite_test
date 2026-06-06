import { Cpu } from 'lucide-react';
import ComingSoonLayout from '../../components/common/ComingSoonLayout';

export default function ModelsPage() {
  return (
    <ComingSoonLayout
      title="Models"
      description="Monitor AI model versions, inference accuracy metrics, and deployment health for all active ECG analysis models."
      icon={Cpu}
      iconBg="bg-purple-50"
      iconColor="text-purple-500"
      plannedFeatures={[
        'Active model version and deployment date',
        'Inference accuracy and confidence calibration metrics',
        'Model performance comparison across versions',
        'Rollback to previous model version',
        'Staged deployment and A/B testing configuration',
      ]}
    />
  );
}
