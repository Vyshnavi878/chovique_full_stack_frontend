/**
 * Product Service — CRUD and listing operations for products.
 * Falls back to demo localStorage store when backend is unreachable.
 *
 * FastAPI endpoints expected:
 *   GET    /products          → PaginatedResponse<Product>
 *   GET    /products/{id}     → Product
 *   POST   /products          → Product  (multipart/form-data; admin only)
 *   PATCH  /products/{id}     → Product  (admin only)
 *   DELETE /products/{id}     → 204      (admin only)
 */

import { apiGet, apiPatch, apiDelete, apiPostFormData } from '../lib/api';
import { withDemoFallback } from '../lib/demoMode';
import { demoGetProducts, demoGetProduct } from '../lib/demoStore';
import type { Product, PaginatedResponse, ProductQueryParams, ProductUpdatePayload } from '../types';

export const productService = {
  /**
   * Fetch paginated, filtered, sorted product list.
   * Demo fallback: client-side filter/sort/paginate on initialProducts.
   */
  getProducts: (params: ProductQueryParams = {}): Promise<PaginatedResponse<Product>> =>
    withDemoFallback(
      () => {
        const query = new URLSearchParams();
        if (params.search)      query.set('search', params.search);
        if (params.category && params.category !== 'all') query.set('category', params.category);
        if (params.price_min !== undefined) query.set('price_min', String(params.price_min));
        if (params.price_max !== undefined) query.set('price_max', String(params.price_max));
        if (params.min_rating !== undefined) query.set('min_rating', String(params.min_rating));
        if (params.sort)        query.set('sort', params.sort);
        if (params.page)        query.set('page', String(params.page));
        if (params.per_page)    query.set('per_page', String(params.per_page));
        const qs = query.toString();
        return apiGet<PaginatedResponse<Product>>(`/products${qs ? `?${qs}` : ''}`);
      },
      () => demoGetProducts(params)
    ),

  /** Fetch single product by ID. Demo fallback: find in initialProducts. */
  getProduct: (id: string): Promise<Product> =>
    withDemoFallback(
      () => apiGet<Product>(`/products/${id}`),
      () => demoGetProduct(id)
    ),

  /**
   * Create a new product (admin only).
   * Demo fallback: no-op (returns a placeholder product).
   */
  createProduct: (formData: FormData): Promise<Product> =>
    withDemoFallback(
      () => apiPostFormData<Product>('/products', formData),
      async () => {
        // In demo mode, return the FormData fields as a mock product
        const name = (formData.get('name') as string) || 'New Product';
        const price = parseFloat((formData.get('price') as string) || '0');
        const category = (formData.get('category') as string) || 'dark';
        const weight = (formData.get('weight') as string) || '100g';
        const description = (formData.get('description') as string) || '';
        const ingredients = (formData.get('ingredients') as string) || '';
        return {
          id: `demo-${Date.now()}`,
          name,
          price,
          category: category as Product['category'],
          weight,
          description,
          ingredients,
          badge: (formData.get('badge') as Product['badge']) || undefined,
          image: 'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=600&q=80',
          rating: 5.0,
          ratingsCount: 0,
          reviews: [],
          nutrition: {
            calories: (formData.get('nutrition_calories') as string) || '550 kcal',
            totalFat: (formData.get('nutrition_total_fat') as string) || '35g',
            saturatedFat: (formData.get('nutrition_saturated_fat') as string) || '20g',
            cholesterol: (formData.get('nutrition_cholesterol') as string) || '0mg',
            sodium: (formData.get('nutrition_sodium') as string) || '15mg',
            totalCarb: (formData.get('nutrition_total_carb') as string) || '50g',
            protein: (formData.get('nutrition_protein') as string) || '7g',
          },
        } as Product;
      }
    ),

  /** Update an existing product (admin only). Demo fallback: no-op. */
  updateProduct: (id: string, payload: ProductUpdatePayload): Promise<Product> =>
    withDemoFallback(
      () => apiPatch<Product>(`/products/${id}`, payload),
      async () => {
        const product = await demoGetProduct(id);
        return { ...product, ...payload } as Product;
      }
    ),

  /** Delete a product (admin only). Demo fallback: no-op. */
  deleteProduct: (id: string): Promise<void> =>
    withDemoFallback(
      () => apiDelete<void>(`/products/${id}`),
      async () => { /* no-op in demo */ }
    ),
};
