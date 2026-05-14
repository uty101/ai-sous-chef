import { FeaturePage } from '@/components/feature-page';
import { featurePages } from '@/constants/feature-pages';

export default function TasteProfileScreen() {
  return <FeaturePage content={featurePages['taste-profile']} />;
}
