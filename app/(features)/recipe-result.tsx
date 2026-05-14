import { FeaturePage } from '@/components/feature-page';
import { featurePages } from '@/constants/feature-pages';

export default function RecipeResultScreen() {
  return <FeaturePage content={featurePages['recipe-result']} />;
}
