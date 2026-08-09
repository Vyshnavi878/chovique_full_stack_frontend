import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid, List, Star, SlidersHorizontal, ChevronLeft, ChevronRight, ShoppingBag, Heart, Loader2 } from 'lucide-react';
import { useApp } from '../../app/providers';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Product } from '../../types';
import { pageTransition, hoverLift } from '../../lib/framer';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';

import { getImageUrl } from '../../utils/imageUrl';

export const ShopPage: React.FC = () => {
  const { addToCart, toggleWishlist, wishlist, role } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Product Data from Backend ---
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const itemsPerPage = 6;

  // --- Filter states ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoriesList, setCategoriesList] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Categories' },
  ]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 5000 });
  const [minRating, setMinRating] = useState<number | null>(null);
  const [isGridView, setIsGridView] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Dynamic Category Loading from Backend (Admin managed)
  useEffect(() => {
    categoryService.getCategories()
      .then((cats) => {
        if (Array.isArray(cats) && cats.length > 0) {
          setCategoriesList([
            { value: 'all', label: 'All Categories' },
            ...cats.map((c) => ({ value: c.slug, label: c.name })),
          ]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch categories:', err);
      });
  }, []);

  // Sync state with URL params on mount
  useEffect(() => {
    const categoryParam = searchParams.get('category');

    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('all');
    }

    setCurrentPage(1);
  }, [searchParams]);

  // --- Fetch products from backend ---
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await productService.getProducts({
        search: searchQuery || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        price_min: priceRange.min > 0 ? priceRange.min : undefined,
        price_max: priceRange.max < 5000 ? priceRange.max : undefined,
        min_rating: minRating ?? undefined,
        page: currentPage,
        per_page: itemsPerPage,
      });
      setProducts(result.items);
      setTotalProducts(result.total);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, priceRange.min, priceRange.max, minRating, currentPage]);


  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.ceil(totalProducts / itemsPerPage);

  // Rating stars filter options
  const ratingOptions = [4.5, 4.0, 3.5, 3.0];

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange({ min: 0, max: 5000 });
    setMinRating(null);
    setSearchParams({});
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const indexOfFirstItem = (currentPage - 1) * itemsPerPage + 1;
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalProducts);

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="shop-page"
    >
      <div className="container">
        {/* Breadcrumb / Title */}
        <div style={{ padding: '30px 0 10px 0', borderBottom: '1px solid var(--glass-border)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--beige)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Home / Shop Boutique
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '2.5rem',
              fontWeight: 700,
              marginTop: '10px',
              color: 'var(--cream)',
            }}
          >
            The Chocolate Boutique
          </h1>
        </div>

        {/* Core Layout container */}
        <div className="shop-container">
          {/* Filters Sidebar */}
          <aside className="filter-sidebar">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)' }}>
                <SlidersHorizontal size={18} />
                <span style={{ fontSize: '0.95rem', fontWeight: 600, textTransform: 'uppercase' }}>Filters</span>
              </div>
              <button
                onClick={handleResetFilters}
                style={{ fontSize: '0.8rem', color: 'var(--rose-gold)', textTransform: 'uppercase', fontWeight: 600 }}
              >
                Reset All
              </button>
            </div>

            {/* Filter: Search */}
            <div className="filter-group">
              <h4 className="filter-group-title">Search</h4>
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="Search chocolates..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <Search size={18} />
              </div>
            </div>

            {/* Filter: Categories */}
            <div className="filter-group">
              <h4 className="filter-group-title">Category</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {categoriesList.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => {
                      setSelectedCategory(cat.value);
                      setSearchParams(cat.value === 'all' ? {} : { category: cat.value });
                      setCurrentPage(1);
                    }}
                    style={{
                      textAlign: 'left',
                      fontSize: '0.9rem',
                      color: selectedCategory === cat.value ? 'var(--gold)' : 'var(--beige)',
                      fontWeight: selectedCategory === cat.value ? 600 : 400,
                      transition: 'color 0.3s',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter: Price Range */}
            <div className="filter-group">
              <h4 className="filter-group-title">Price Range</h4>
              <input
                type="range"
                min="0"
                max="5000"
                step="100"
                value={priceRange.max}
                onChange={(e) => {
                  setPriceRange({ ...priceRange, max: parseInt(e.target.value) });
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  accentColor: 'var(--gold)',
                  cursor: 'pointer',
                  marginBottom: '12px',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--beige)' }}>
                <span>Min: ₹{priceRange.min}</span>
                <span>Max: ₹{priceRange.max}</span>
              </div>
            </div>

            {/* Filter: Rating */}
            <div className="filter-group" style={{ borderBottom: 'none', marginBottom: 0 }}>
              <h4 className="filter-group-title">Rating</h4>
              <div className="rating-filter-list">
                <button
                  onClick={() => {
                    setMinRating(null);
                    setCurrentPage(1);
                  }}
                  style={{
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    color: minRating === null ? 'var(--gold)' : 'var(--beige)',
                    fontWeight: minRating === null ? 600 : 400,
                  }}
                >
                  All Ratings
                </button>
                {ratingOptions.map((rating) => (
                  <button
                    key={rating}
                    onClick={() => {
                      setMinRating(rating);
                      setCurrentPage(1);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.9rem',
                      color: minRating === rating ? 'var(--gold)' : 'var(--beige)',
                      fontWeight: minRating === rating ? 600 : 400,
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', color: 'var(--gold)' }}>
                      <Star size={14} fill="currentColor" />
                    </div>
                    <span>{rating}★ &amp; above</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Listing Shelf */}
          <main>
            {/* Toolbar Upper */}
            <div className="shop-toolbar">
              <span style={{ fontSize: '0.9rem', color: 'var(--beige)' }}>
                {isLoading ? (
                  <Loader2 size={16} className="spin" style={{ display: 'inline', color: 'var(--gold)' }} />
                ) : (
                  <>
                    Showing <strong>{totalProducts > 0 ? indexOfFirstItem : 0} - {indexOfLastItem}</strong> of{' '}
                    <strong>{totalProducts}</strong> products
                  </>
                )}
              </span>

              {/* Grid/List toggles */}
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={() => setIsGridView(true)}
                  style={{
                    color: isGridView ? 'var(--gold)' : 'var(--beige)',
                    padding: '4px',
                  }}
                  title="Grid View"
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setIsGridView(false)}
                  style={{
                    color: !isGridView ? 'var(--gold)' : 'var(--beige)',
                    padding: '4px',
                  }}
                  title="List View"
                >
                  <List size={18} />
                </button>
              </div>
            </div>

            {/* List / Grid Display */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--gold)' }}>
                <Loader2 size={40} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '16px', color: 'var(--beige)' }}>Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="shop-empty-state">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', marginBottom: '10px' }}>
                  No Products Found
                </h3>
                <p style={{ color: 'var(--grey-light)', marginBottom: '20px' }}>
                  No products matched your active filters. Try adjustments or reset.
                </p>
                <Button variant="gold" onClick={handleResetFilters}>
                  Clear Filters
                </Button>
              </div>
            ) : isGridView ? (
              /* Grid Layout */
              <div className="shop-product-grid">
                {products.map((prod) => (
                  <Card key={prod.id} product={prod} />
                ))}
              </div>
            ) : (
              /* List Layout */
              <div className="shop-list-layout">
                {products.map((prod) => {
                  const inWish = wishlist.some((p) => p.id === prod.id);
                  return (
                    <motion.div
                      key={prod.id}
                      variants={hoverLift}
                      whileHover="whileHover"
                      className="list-card"
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ overflow: 'hidden', borderRadius: '4px' }}>
                        <img
                          src={getImageUrl(prod.image)}
                          alt={prod.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span style={{ fontSize: '0.75rem', color: 'var(--gold)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                                {prod.category}
                              </span>
                              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', margin: '4px 0 8px 0' }}>
                                {prod.name}
                              </h3>
                            </div>
                            {prod.badge && (
                              <span style={{ background: 'var(--gold)', color: 'var(--dark-chocolate)', fontSize: '0.7rem', padding: '3px 8px', fontWeight: 700, textTransform: 'uppercase' }}>
                                {prod.badge}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.9rem', color: 'var(--beige)', lineHeight: 1.5, marginBottom: '15px' }}>
                            {prod.description}
                          </p>
                          <span style={{ fontSize: '0.8rem', color: 'var(--grey-light)', display: 'block', marginBottom: '8px' }}>
                            Weight: {prod.weight}
                          </span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--cream)' }}>
                            ₹{prod.price.toLocaleString()}
                          </span>

                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(prod);
                              }}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '4px',
                                border: '1px solid var(--glass-border)',
                                background: inWish ? 'var(--rose-gold)' : 'rgba(255,255,255,0.05)',
                                color: inWish ? 'white' : 'var(--cream)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Heart size={16} fill={inWish ? 'currentColor' : 'none'} />
                            </button>
                            <Button
                              variant="gold"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                addToCart(prod, 1);
                              }}
                            >
                              <ShoppingBag size={14} />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && !isLoading && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '10px',
                  marginTop: '40px',
                }}
              >
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  style={{
                    color: currentPage === 1 ? 'var(--grey-mid)' : 'var(--cream)',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronLeft size={20} />
                </button>

                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => handlePageChange(idx + 1)}
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      background: currentPage === idx + 1 ? 'var(--gradient-gold)' : 'transparent',
                      color: currentPage === idx + 1 ? 'var(--dark-chocolate)' : 'var(--cream)',
                      border: currentPage === idx + 1 ? '1px solid var(--gold)' : '1px solid var(--glass-border)',
                    }}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  style={{
                    color: currentPage === totalPages ? 'var(--grey-mid)' : 'var(--cream)',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </motion.div>
  );
};
export default ShopPage;
