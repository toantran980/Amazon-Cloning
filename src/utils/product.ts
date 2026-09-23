import type { Product } from '../types';
import type { Product as ApiProduct } from '../../shared/types';

export function toLocalProduct(p: ApiProduct): Product {
  return {
    id: p.id,
    image: p.image,
    name: p.name,
    rating: { stars: p.ratingStars, count: p.ratingCount },
    priceCents: p.priceCents,
    keywords: p.keywords,
    type: p.type,
    sizeChartLink: p.sizeChartLink,
    stock: p.stock,
  };
}