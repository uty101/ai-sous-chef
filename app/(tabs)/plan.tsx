import { FeaturePage } from '@/components/feature-page';
import { featurePages } from '@/constants/feature-pages';

export default function PlanTabScreen() {
  return <FeaturePage content={featurePages['weekly-plan']} />;
}
