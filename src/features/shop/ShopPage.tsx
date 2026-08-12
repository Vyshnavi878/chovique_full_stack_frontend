import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Grid,
  List,
  Star,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Heart,
  Loader2,
  X,
  Sparkles,
  Gift,
  ShieldCheck,
  ChevronDown,
  Info,
  Plus,
} from 'lucide-react';
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

  // --- Product Data State ---
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState<number>(12);

  // --- Filter states ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categoriesList, setCategoriesList] = useState<{ value: string; label: string }[]>([
    { value: 'all', label: 'All Categories' },
    { value: 'dark', label: 'Dark Collection' },
    { value: 'milk', label: 'Milk Collection' },
    { value: 'white', label: 'White Collection' },
    { value: 'gift', label: 'Gift Hampers' },
    { value: 'beverage', label: 'Truffles & Specialty' },
  ]);

  const [priceRange, setPriceRange] = useState({ min: 0, max: 50000 });
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sortOption, setSortOption] = useState<string>('popularity');

  const [isGridView, setIsGridView] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Dynamic Category Loading from Backend
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
      .catch((err) => console.error('Failed to fetch categories:', err));
  }, []);

  // Sync state with URL params on mount / URL change
  useEffect(() => {
    const catParam = searchParams.get('category');
    const searchParam = searchParams.get('search');
    const filterParam = searchParams.get('filter');

    if (catParam) setSelectedCategory(catParam);
    else setSelectedCategory('all');

    if (searchParam) setSearchQuery(searchParam);

    if (filterParam === 'new') setSortOption('newest');
    else if (filterParam === 'premium') setSortOption('rating');

    setCurrentPage(1);
  }, [searchParams]);

  // Map sort option to API parameter
  const getApiSortValue = (opt: string) => {
    switch (opt) {
      case 'price_asc': return 'price_asc';
      case 'price_desc': return 'price_desc';
      case 'newest': return 'newest';
      case 'rating': return 'rating';
      case 'popularity':
      default: return 'bestseller';
    }
  };

  // --- Fetch products from backend ---
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await productService.getProducts({
        search: searchQuery || undefined,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        price_min: priceRange.min > 0 ? priceRange.min : undefined,
        price_max: priceRange.max < 50000 ? priceRange.max : undefined,
        min_rating: minRating ?? undefined,
        sort: getApiSortValue(sortOption),
        page: currentPage,
        per_page: itemsPerPage,
      });

      setProducts(result.items || []);
      setTotalProducts(result.total || (result.items || []).length);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setProducts([]);
      setTotalProducts(0);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategory, priceRange.min, priceRange.max, minRating, sortOption, currentPage, itemsPerPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const totalPages = Math.max(1, Math.ceil(totalProducts / itemsPerPage));

  // Active filter count calculation
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (searchQuery.trim() !== '') count++;
    if (priceRange.max < 50000) count++;
    if (minRating !== null) count++;
    return count;
  }, [selectedCategory, searchQuery, priceRange.max, minRating]);

  // Reset all filters handler
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange({ min: 0, max: 50000 });
    setMinRating(null);
    setSortOption('popularity');
    setSearchParams({});
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const indexOfFirstItem = totalProducts > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, totalProducts);

  // Top category horizontal chips
  const categoryChips = [
    { id: 'all', label: 'All' },
    { id: 'dark', label: 'Dark' },
    { id: 'milk', label: 'Milk' },
    { id: 'white', label: 'White' },
    { id: 'truffles', label: 'Truffles' },
    { id: 'gift', label: 'Gift Hampers' },
  ];

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="shop-page"
    >
      <div className="container">
        {/* HERO / TITLE HEADER */}
        <div className="shop-hero-header">
          <span className="shop-breadcrumb">
            HOME / SHOP BOUTIQUE
          </span>
          <h1 className="shop-title">
            The Chocolate Boutique
          </h1>

          {/* Top Search & Category Chips Row (Horizontal inline on desktop) */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
            {/* Top Search Input */}
            <div className="search-input-wrapper" style={{ width: '280px', flexShrink: 0 }}>
              <input
                type="text"
                placeholder="Search chocolates..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ padding: '10px 38px 10px 14px', fontSize: '0.88rem', borderRadius: '4px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(201, 168, 76, 0.3)' }}
              />
              <Search size={16} />
            </div>

            {/* Top Horizontal Category Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', flex: 1, justifyContent: 'flex-start' }}>
              <span style={{ fontSize: '0.82rem', color: '#c9a84c', fontWeight: 600 }}>
                Top Categories:
              </span>
              <div className="category-chips-row" style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                {categoryChips.map((chip) => {
                  const isActive = selectedCategory === chip.id;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => {
                        setSelectedCategory(chip.id);
                        setSearchParams(chip.id === 'all' ? {} : { category: chip.id });
                        setCurrentPage(1);
                      }}
                      className={`chip-btn ${isActive ? 'active' : ''}`}
                    >
                      {chip.label}
                    </button>
                  );
                })}
                <button
                  className="chip-btn"
                  onClick={() => setSelectedCategory('all')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                >
                  More <ChevronDown size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE TOOLBAR BUTTONS (Screens <= 992px) */}
        <div className="show-on-mobile-flex" style={{ display: 'none', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '4px',
              background: 'rgba(20, 16, 13, 0.9)',
              border: '1px solid rgba(201, 168, 76, 0.4)',
              color: '#f5efe6',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <SlidersHorizontal size={16} color="#c9a84c" />
            <span>Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <select
              value={sortOption}
              onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                background: 'rgba(20, 16, 13, 0.9)',
                border: '1px solid rgba(201, 168, 76, 0.4)',
                color: '#f5efe6',
                fontSize: '0.82rem',
                outline: 'none',
              }}
            >
              <option value="popularity">Popularity</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="newest">Newest</option>
              <option value="rating">Rating</option>
            </select>

            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                onClick={() => setIsGridView(true)}
                style={{ padding: '6px', color: isGridView ? '#c9a84c' : 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <Grid size={18} />
              </button>
              <button
                onClick={() => setIsGridView(false)}
                style={{ padding: '6px', color: !isGridView ? '#c9a84c' : 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <List size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* MAIN SHOP CONTAINER */}
        <div className="shop-container">
          {/* DESKTOP FILTERS SIDEBAR */}
          <aside className="filter-sidebar-desktop">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c9a84c' }}>
                <SlidersHorizontal size={16} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px' }}>FILTERS</span>
              </div>
              <button
                onClick={handleResetFilters}
                style={{ fontSize: '0.78rem', color: '#e74c3c', textTransform: 'uppercase', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                RESET ALL
              </button>
            </div>

            {/* Filter: Search */}
            <div className="filter-group">
              <h4 className="filter-group-title">SEARCH</h4>
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
                <Search size={16} />
              </div>
            </div>

            {/* Filter: Category */}
            <div className="filter-group">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                <h4 className="filter-group-title" style={{ margin: 0 }}>CATEGORY</h4>
                <Info size={14} color="#c9a84c" style={{ cursor: 'pointer', opacity: 0.8 }} />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSearchParams(e.target.value === 'all' ? {} : { category: e.target.value });
                  setCurrentPage(1);
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'rgba(0, 0, 0, 0.4)',
                  border: '1px solid rgba(201, 168, 76, 0.3)',
                  borderRadius: '4px',
                  color: '#f5efe6',
                  fontSize: '0.88rem',
                  outline: 'none',
                  marginBottom: '12px',
                }}
              >
                {categoriesList.map((cat) => (
                  <option key={cat.value} value={cat.value} style={{ background: '#0f0c0a', color: '#f5efe6' }}>
                    {cat.label}
                  </option>
                ))}
              </select>

              <button
                onClick={() => { setSelectedCategory('all'); setSearchParams({}); }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: 'transparent',
                  border: '1px solid rgba(201, 168, 76, 0.25)',
                  borderRadius: '4px',
                  color: '#c9a84c',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                }}
              >
                <Plus size={14} /> View all categories
              </button>
            </div>

            {/* Filter: Price Range */}
            <div className="filter-group">
              <h4 className="filter-group-title">PRICE RANGE</h4>
              <input
                type="range"
                min="0"
                max="50000"
                step="500"
                value={priceRange.max}
                onChange={(e) => {
                  setPriceRange({ ...priceRange, max: parseInt(e.target.value) });
                  setCurrentPage(1);
                }}
                style={{ width: '100%', accentColor: '#c9a84c', cursor: 'pointer', marginBottom: '12px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                <span>Min: ₹0</span>
                <span>Max: ₹{priceRange.max.toLocaleString()}</span>
              </div>
            </div>

            {/* Filter: Rating */}
            <div className="filter-group" style={{ borderBottom: 'none', marginBottom: 0, paddingBottom: 0 }}>
              <div style={{ marginBottom: '8px' }}>
                <h4 className="filter-group-title" style={{ margin: '0 0 4px 0' }}>RATING</h4>
                <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic', display: 'block', marginBottom: '10px' }}>Ratings</span>
              </div>
              <div className="rating-filter-list">
                {[4.5, 4.0, 4.0, 3.5, 3.0].map((rating, idx) => (
                  <button
                    key={`${rating}-${idx}`}
                    onClick={() => { setMinRating(rating); setCurrentPage(1); }}
                    className={`rating-filter-btn ${minRating === rating ? 'active' : ''}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: minRating === rating ? '#c9a84c' : 'rgba(255,255,255,0.8)',
                      fontSize: '0.88rem',
                    }}
                  >
                    <Star size={15} fill="#c9a84c" color="#c9a84c" />
                    <span>{rating}★ &amp; above</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* PRODUCT LISTING AREA */}
          <main>
            {/* DESKTOP TOOLBAR */}
            <div className="shop-toolbar hide-on-mobile">
              <span style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.7)' }}>
                {isLoading ? (
                  <Loader2 size={16} style={{ display: 'inline', animation: 'spin 1s linear infinite', color: '#c9a84c' }} />
                ) : (
                  <>
                    Showing <strong style={{ color: '#f5efe6' }}>{indexOfFirstItem} - {indexOfLastItem}</strong> of{' '}
                    <strong style={{ color: '#f5efe6' }}>{totalProducts}</strong> products
                  </>
                )}
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Grid / List view toggle */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => setIsGridView(true)}
                    style={{
                      color: isGridView ? '#c9a84c' : 'rgba(255,255,255,0.4)',
                      padding: '6px',
                      background: 'none',
                      border: isGridView ? '1px solid #c9a84c' : '1px solid transparent',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    title="Grid View"
                  >
                    <Grid size={18} />
                  </button>
                  <button
                    onClick={() => setIsGridView(false)}
                    style={{
                      color: !isGridView ? '#c9a84c' : 'rgba(255,255,255,0.4)',
                      padding: '6px',
                      background: 'none',
                      border: !isGridView ? '1px solid #c9a84c' : '1px solid transparent',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                    title="List View"
                  >
                    <List size={18} />
                  </button>
                </div>

                {/* Sort Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.85rem', color: '#f5efe6', fontWeight: 600 }}>Sort by:</span>
                  <select
                    value={sortOption}
                    onChange={(e) => { setSortOption(e.target.value); setCurrentPage(1); }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '4px',
                      background: 'rgba(0, 0, 0, 0.4)',
                      border: '1px solid rgba(201, 168, 76, 0.3)',
                      color: '#f5efe6',
                      fontSize: '0.85rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="popularity" style={{ background: '#0f0c0a' }}>Popularity</option>
                    <option value="price_asc" style={{ background: '#0f0c0a' }}>Price: Low to High</option>
                    <option value="price_desc" style={{ background: '#0f0c0a' }}>Price: High to Low</option>
                    <option value="newest" style={{ background: '#0f0c0a' }}>Newest</option>
                    <option value="rating" style={{ background: '#0f0c0a' }}>Rating</option>
                  </select>
                </div>
              </div>
            </div>

            {/* PRODUCT DISPLAY GRID / LIST */}
            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#c9a84c' }}>
                <Loader2 size={42} style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '16px', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>Loading chocolates...</p>
              </div>
            ) : products.length === 0 ? (
              /* EMPTY STATE */
              <div
                style={{
                  padding: '60px 30px',
                  textAlign: 'center',
                  background: 'rgba(18, 14, 11, 0.85)',
                  border: '1px solid rgba(201, 168, 76, 0.25)',
                  borderRadius: '12px',
                }}
              >
                <ShoppingBag size={48} color="#c9a84c" style={{ marginBottom: '16px', opacity: 0.8 }} />
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: '#f5efe6', marginBottom: '8px' }}>
                  No chocolates found
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginBottom: '24px', maxWidth: '380px', margin: '0 auto 24px auto' }}>
                  Try adjusting your active filters or search keywords to find what you are looking for.
                </p>
                <Button variant="gold" onClick={handleResetFilters} glow>
                  RESET FILTERS
                </Button>
              </div>
            ) : isGridView ? (
              /* GRID VIEW (3-col Desktop, 2-col Mobile) */
              <div className="shop-product-grid">
                {products.map((prod) => (
                  <Card key={prod.id} product={prod} />
                ))}
              </div>
            ) : (
              /* LIST VIEW */
              <div className="shop-list-layout" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {products.map((prod) => {
                  const inWish = wishlist.some((p) => p.id === prod.id);
                  return (
                    <motion.div
                      key={prod.id}
                      variants={hoverLift}
                      whileHover="whileHover"
                      className="list-card"
                    >
                      <div style={{ overflow: 'hidden', borderRadius: '6px', position: 'relative' }}>
                        <img
                          src={getImageUrl(prod.image)}
                          alt={prod.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1548907040-4d42b52115ca?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span style={{ fontSize: '0.72rem', color: '#c9a84c', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>
                                {prod.category} Collection
                              </span>
                              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: '#f5efe6', margin: '4px 0 8px 0', fontWeight: 700 }}>
                                {prod.name}
                              </h3>
                            </div>
                            {prod.badge && (
                              <span style={{ background: '#c9a84c', color: '#0f0c0a', fontSize: '0.68rem', padding: '3px 8px', fontWeight: 800, textTransform: 'uppercase', borderRadius: '2px' }}>
                                {prod.badge}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.5, marginBottom: '14px' }}>
                            {prod.description}
                          </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f5efe6' }}>
                            ₹{prod.price.toLocaleString()}
                          </span>

                          <div style={{ display: 'flex', gap: '10px' }}>
                            <button
                              onClick={(e) => { e.stopPropagation(); toggleWishlist(prod); }}
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                border: '1px solid rgba(201, 168, 76, 0.3)',
                                background: inWish ? '#e74c3c' : 'rgba(20, 16, 13, 0.8)',
                                color: inWish ? '#fff' : '#f5efe6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                              }}
                            >
                              <Heart size={16} fill={inWish ? 'currentColor' : 'none'} />
                            </button>
                            <Button variant="gold" size="sm" onClick={(e) => { e.stopPropagation(); addToCart(prod, 1); }}>
                              <ShoppingBag size={14} style={{ marginRight: '6px' }} />
                              Add to Cart
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* PAGINATION CONTROLS */}
            {!isLoading && totalProducts > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px',
                  marginTop: '40px',
                  paddingTop: '24px',
                  borderTop: '1px solid rgba(201, 168, 76, 0.2)',
                }}
              >
                {/* Showing Count Info */}
                <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                  Showing <strong style={{ color: '#c9a84c' }}>{indexOfFirstItem}</strong> to{' '}
                  <strong style={{ color: '#c9a84c' }}>{indexOfLastItem}</strong> of{' '}
                  <strong style={{ color: '#c9a84c' }}>{totalProducts}</strong> products
                </div>

                {/* Page Number Buttons */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(201, 168, 76, 0.3)',
                        background: currentPage === 1 ? 'rgba(255, 255, 255, 0.02)' : 'rgba(20, 16, 13, 0.9)',
                        color: currentPage === 1 ? 'rgba(255,255,255,0.25)' : '#f5efe6',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <ChevronLeft size={16} />
                      Prev
                    </button>

                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      const isActive = currentPage === pageNum;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '6px',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            background: isActive
                              ? 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)'
                              : 'rgba(20, 16, 13, 0.9)',
                            color: isActive ? '#0f0c0a' : '#f5efe6',
                            border: isActive ? 'none' : '1px solid rgba(201, 168, 76, 0.3)',
                            boxShadow: isActive ? '0 4px 12px rgba(201, 168, 76, 0.35)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid rgba(201, 168, 76, 0.3)',
                        background: currentPage === totalPages ? 'rgba(255, 255, 255, 0.02)' : 'rgba(20, 16, 13, 0.9)',
                        color: currentPage === totalPages ? 'rgba(255,255,255,0.25)' : '#f5efe6',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {/* Per Page Dropdown */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                  <span>Show per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '6px',
                      background: 'rgba(20, 16, 13, 0.9)',
                      border: '1px solid rgba(201, 168, 76, 0.4)',
                      color: '#f5efe6',
                      fontSize: '0.82rem',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value={12}>12</option>
                    <option value={24}>24</option>
                    <option value={36}>36</option>
                    <option value={48}>48</option>
                  </select>
                </div>
              </div>
            )}
          </main>
        </div>

        {/* BOTTOM FEATURE BADGES BAR */}
        <div className="shop-features-bar">
          <div className="feature-badge-item">
            <div className="feature-badge-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h5 style={{ color: '#f5efe6', fontWeight: 700, margin: '0 0 2px 0', fontSize: '0.9rem' }}>
                Premium Ingredients
              </h5>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.78rem' }}>
                Finest cocoa &amp; nuts
              </p>
            </div>
          </div>

          <div className="feature-badge-item">
            <div className="feature-badge-icon">
              <Heart size={20} />
            </div>
            <div>
              <h5 style={{ color: '#f5efe6', fontWeight: 700, margin: '0 0 2px 0', fontSize: '0.9rem' }}>
                Made with Love
              </h5>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.78rem' }}>
                Crafted in small batches
              </p>
            </div>
          </div>

          <div className="feature-badge-item">
            <div className="feature-badge-icon">
              <Gift size={20} />
            </div>
            <div>
              <h5 style={{ color: '#f5efe6', fontWeight: 700, margin: '0 0 2px 0', fontSize: '0.9rem' }}>
                Elegant Gifting
              </h5>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.78rem' }}>
                Perfect for every occasion
              </p>
            </div>
          </div>

          <div className="feature-badge-item">
            <div className="feature-badge-icon">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h5 style={{ color: '#f5efe6', fontWeight: 700, margin: '0 0 2px 0', fontSize: '0.9rem' }}>
                Secure Checkout
              </h5>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: 0, fontSize: '0.78rem' }}>
                100% safe &amp; secure
              </p>
            </div>
          </div>
        </div>

        {/* MOBILE FILTER BOTTOM SHEET DRAWER */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mobile-filter-drawer-overlay"
                onClick={() => setMobileFiltersOpen(false)}
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="mobile-filter-drawer-content"
              >
                <div className="mobile-filter-drawer-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c9a84c' }}>
                    <SlidersHorizontal size={18} />
                    <span style={{ fontWeight: 700, fontSize: '1rem', textTransform: 'uppercase' }}>FILTERS</span>
                  </div>
                  <button onClick={handleResetFilters} style={{ color: '#e74c3c', background: 'none', border: 'none', fontSize: '0.8rem', fontWeight: 700 }}>
                    RESET ALL
                  </button>
                </div>

                <div className="mobile-filter-drawer-body">
                  {/* Category */}
                  <div className="filter-group">
                    <h4 className="filter-group-title">CATEGORY</h4>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '6px', color: '#f5efe6', fontSize: '0.9rem' }}
                    >
                      {categoriesList.map((cat) => (
                        <option key={cat.value} value={cat.value} style={{ background: '#0f0c0a', color: '#f5efe6' }}>
                          {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div className="filter-group">
                    <h4 className="filter-group-title">PRICE RANGE</h4>
                    <input
                      type="range"
                      min="0"
                      max="50000"
                      step="500"
                      value={priceRange.max}
                      onChange={(e) => setPriceRange({ ...priceRange, max: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: '#c9a84c', cursor: 'pointer', marginBottom: '12px' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>
                      <span>Min: ₹0</span>
                      <span>Max: ₹{priceRange.max.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="filter-group">
                    <h4 className="filter-group-title">RATING</h4>
                    <div className="rating-filter-list">
                      {[4.5, 4.0, 4.0, 3.5, 3.0].map((rating, idx) => (
                        <button key={`${rating}-${idx}`} onClick={() => setMinRating(rating)} className={`rating-filter-btn ${minRating === rating ? 'active' : ''}`}>
                          <Star size={14} fill="#c9a84c" color="#c9a84c" />
                          <span>{rating}★ &amp; above</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mobile-filter-drawer-footer">
                  <Button variant="secondary" fullWidth onClick={() => { handleResetFilters(); setMobileFiltersOpen(false); }}>
                    RESET ALL
                  </Button>
                  <Button variant="gold" fullWidth onClick={() => setMobileFiltersOpen(false)} glow>
                    APPLY FILTERS {activeFiltersCount > 0 && `(${activeFiltersCount})`}
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ShopPage;
