import { FeaturePage } from '@/components/feature-page';
import { featurePages } from '@/constants/feature-pages';

export default function IngredientReviewScreen() {
  return <FeaturePage content={featurePages['ingredient-review']} />;
}
