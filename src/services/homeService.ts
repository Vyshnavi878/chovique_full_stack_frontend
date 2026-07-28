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

import { apiGet } from '../lib/api';
import type { Banner, Testimonial, HomeStats, ContactInfo, InstagramReel, HomePageData } from '../types';

export const homeService = {
  /** Aggregated home page data — banners + featured products + testimonials + stats + contact */
  getHomePage: (): Promise<HomePageData> =>
    apiGet<HomePageData>('/home'),

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

  /** Instagram-style reels/videos */
  getReels: (): Promise<InstagramReel[]> =>
    apiGet<InstagramReel[]>('/home/reels'),
};
