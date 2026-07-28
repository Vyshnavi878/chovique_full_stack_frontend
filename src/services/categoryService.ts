/**
 * Category Service — product categories management.
 *
 * FastAPI endpoints:
 *   GET    /categories              → Category[]  (public)
 *   GET    /categories/{id_or_slug} → Category    (public)
 *   GET    /categories/{slug}/products → PaginatedResponse<Product> (public)
 */

import { apiGet } from '../lib/api';
import type { Category, PaginatedResponse, Product } from '../types';

export const categoryService = {
  /** List all active categories */
  getCategories: (): Promise<Category[]> =>
    apiGet<Category[]>('/categories'),

  /** Get a single category by ID or slug */
  getCategory: (idOrSlug: string): Promise<Category> =>
    apiGet<Category>(`/categories/${idOrSlug}`),

  /** Get paginated products for a category slug */
  getCategoryProducts: (
    slug: string,
    page = 1,
    perPage = 12
  ): Promise<PaginatedResponse<Product>> =>
    apiGet<PaginatedResponse<Product>>(
      `/categories/${slug}/products?page=${page}&per_page=${perPage}`
    ),
};
