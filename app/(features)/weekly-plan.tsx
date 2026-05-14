import { FeaturePage } from '@/components/feature-page';
import { featurePages } from '@/constants/feature-pages';

export default function WeeklyPlanScreen() {
  return <FeaturePage content={featurePages['weekly-plan']} />;
}
