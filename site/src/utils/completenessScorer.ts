import { ContentCompletenessReport } from '../types/contracts';
import { Product } from '../types';

export interface CompletenessScorerOptions {
  categoryRequiredSpecs?: string[];
  isWarrantyRequired?: boolean;
}

/**
 * Calculates a 0-100% Content Completeness Score for a product
 * and provides missing field notices and actionable recommendations.
 */
export function calculateCompletenessScore(
  product: Partial<Product> | any,
  options?: CompletenessScorerOptions
): ContentCompletenessReport {
  let score = 0;
  const missingFields: string[] = [];
  const recommendations: string[] = [];

  // 1. Brand check (20 pts)
  if (product.brandId && product.brandId.trim().length > 0) {
    score += 20;
  } else {
    missingFields.push('Brend (Marka)');
    recommendations.push('Məhsula təsdiqlənmiş brend təyin edin.');
  }

  // 2. Model code check (20 pts)
  const modelCode = product.code || (product as any).modelCode;
  if (modelCode && modelCode.trim().length > 0) {
    score += 20;
  } else {
    missingFields.push('Model kodu');
    recommendations.push('Dəqiq istehsalçı model kodunu daxil edin.');
  }

  // 3. Media asset check (20 pts)
  const hasImage = Boolean(product.image && product.image.trim().length > 0);
  const hasMedia = Array.isArray(product.media) && product.media.length > 0;
  const hasGallery = Array.isArray(product.gallery) && product.gallery.length > 0;

  if (hasImage || hasMedia || hasGallery) {
    score += 20;
  } else {
    missingFields.push('Ən azı 1 şəkil və ya video');
    recommendations.push('Məhsula ən azı 1 keyfiyyətli şəkil və ya video əlavə edin.');
  }

  // 4. Category & Specs check (20 pts)
  if (product.category && product.category.trim().length > 0) {
    const specs = Array.isArray(product.specs) ? product.specs : [];
    const requiredSpecs = options?.categoryRequiredSpecs || [];

    if (requiredSpecs.length > 0) {
      const existingKeys = specs.map((s) => s.name.toLowerCase());
      const missingRequired = requiredSpecs.filter(
        (req) => !existingKeys.includes(req.toLowerCase())
      );
      if (missingRequired.length === 0) {
        score += 20;
      } else {
        score += 10;
        missingFields.push(`Məcburi xüsusiyyətlər (${missingRequired.join(', ')})`);
        recommendations.push(
          `Kateqoriyanın məcburi xüsusiyyətlərini doldurun: ${missingRequired.join(', ')}`
        );
      }
    } else if (specs.length >= 2) {
      score += 20;
    } else if (specs.length === 1) {
      score += 10;
      recommendations.push('Məhsula daha ətraflı texniki xüsusiyyətlər əlavə edin.');
    } else {
      missingFields.push('Texniki xüsusiyyətlər (Spesifikasiyalar)');
      recommendations.push('Əsas texniki göstəriciləri qeyd edin.');
    }
  } else {
    missingFields.push('Kateqoriya');
    recommendations.push('Məhsula müvafiq kateqoriya təyin edin.');
  }

  // 5. Title & Short Description check (10 pts)
  const hasTitle = Boolean(product.title && product.title.trim().length > 0);
  const hasDesc = Boolean(
    (product.shortDesc && product.shortDesc.trim().length > 0) ||
    ((product as any).description && (product as any).description.trim().length > 0)
  );

  if (hasTitle && hasDesc) {
    score += 10;
  } else if (hasTitle) {
    score += 5;
    recommendations.push('Məhsula aydın qısa təsvir əlavə edin.');
  } else {
    missingFields.push('Məhsul adı');
    recommendations.push('Məhsul adını daxil edin.');
  }

  // 6. Highlights / Badges check (10 pts)
  const hasHighlights = Array.isArray(product.highlights) && product.highlights.length > 0;
  const hasBadge = Boolean(product.badgeText && product.badgeText.trim().length > 0);

  if (hasHighlights || hasBadge) {
    score += 10;
  } else {
    recommendations.push('Məhsulun əsas üstünlüklərini (highlights) əlavə edin.');
  }

  // 7. Optional Category-Specific Warranty check
  if (options?.isWarrantyRequired) {
    const warranty = (product as any).warrantyMonths;
    if (warranty === undefined || warranty === null || warranty <= 0) {
      missingFields.push('Zəmanət müddəti (ay)');
      recommendations.push('Bu kateqoriya üçün rəsmi zəmanət müddətini qeyd edin.');
    }
  }

  const isPublishable =
    score >= 80 &&
    Boolean(product.brandId) &&
    Boolean(modelCode) &&
    (hasImage || hasMedia || hasGallery) &&
    Boolean(product.category);

  return {
    score,
    isPublishable,
    missingFields,
    recommendations,
  };
}
