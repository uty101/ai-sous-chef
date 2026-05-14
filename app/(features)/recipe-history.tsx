import { FeaturePage } from '@/components/feature-page';
import { featurePages } from '@/constants/feature-pages';

export default function RecipeHistoryScreen() {
  return <FeaturePage content={featurePages['recipe-history']} />;
}
