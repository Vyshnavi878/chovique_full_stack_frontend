/**
 * Resolves product / banner image URLs.
 * - Absolute URLs (https://res.cloudinary.com/..., https://images.unsplash.com/...) return untouched.
 * - Relative URLs starting with /static/ resolve to the FastAPI backend host (http://localhost:8000/static/...).
 */
export const getImageUrl = (url?: string | null): string => {
  if (!url) {
    return 'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=600&q=80';
  }
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const backendBase = (import.meta.env.VITE_API_URL as string)?.replace('/api/v1', '') || 'http://localhost:8000';
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};
