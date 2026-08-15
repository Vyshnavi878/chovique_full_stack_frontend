/**
 * Home Service — landing page content.
 *
 * FastAPI endpoints (all public, no auth required):
 *   GET /home             → HomePageData (aggregated)
 *   GET /home/banners     → Banner[]
 *   GET /home/testimonials → Testimonial[]
 *   GET /home/stats       → HomeStats
 *   GET /home/contact     → ContactInfo
 *   GET /home/reels       → InstagramReel[]
 */

import { apiGet, apiPost } from '../lib/api';
import type { Banner, Testimonial, HomeStats, ContactInfo, InstagramReel, HomePageData, StoreConfig } from '../types';

export const homeService = {
  /** Aggregated home page data — banners + featured products + testimonials + stats + contact */
  getHomePage: (): Promise<HomePageData> =>
    apiGet<HomePageData>('/home'),

  /** Store configuration (public settings like shipping, tax, etc.) */
  getStoreConfig: (): Promise<StoreConfig> =>
    apiGet<StoreConfig>('/home/store-config'),

  /** Active hero banner slides */
  getBanners: (): Promise<Banner[]> =>
    apiGet<Banner[]>('/home/banners'),

  /** Customer testimonials */
  getTestimonials: (): Promise<Testimonial[]> =>
    apiGet<Testimonial[]>('/home/testimonials'),

  /** Site stats (customers, flavors, countries, rating %) */
  getStats: (): Promise<HomeStats> =>
    apiGet<HomeStats>('/home/stats'),

  /** Contact info (address, phone, email, social links) */
  getContact: (): Promise<ContactInfo> =>
    apiGet<ContactInfo>('/home/contact'),

  /** Theme configuration */
  getTheme: (): Promise<any> =>
    apiGet<any>('/home/theme'),

  /** Instagram-style reels/videos */
  getReels: (): Promise<InstagramReel[]> =>
    apiGet<InstagramReel[]>('/home/reels'),

  /** Submit a customer testimonial (pending admin approval) */
  submitTestimonial: (payload: { author: string; text: string; title?: string; rating?: number }): Promise<Testimonial> =>
    apiPost<Testimonial>('/home/testimonials', payload),
};
