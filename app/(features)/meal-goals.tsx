import { FeaturePage } from '@/components/feature-page';
import { featurePages } from '@/constants/feature-pages';

export default function MealGoalsScreen() {
  return <FeaturePage content={featurePages['meal-goals']} />;
}
