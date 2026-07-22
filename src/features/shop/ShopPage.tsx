import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid, List, Star, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, ShoppingBag, Heart } from 'lucide-react';
import { useApp } from '../../app/providers';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Product } from '../../types';
import { pageTransition, hoverLift } from '../../lib/framer';

export const ShopPage: React.FC = () => {
  const { products, addToCart, toggleWishlist, wishlist, role } = useApp();
  const [searchParams, setSearchParams] = useSearchParams();

  // --- Filter states ---
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 4000 });
  const [minRating, setMinRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>('featured');
  const [isGridView, setIsGridView] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Sync state with URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const filterParam = searchParams.get('filter');

    if (categoryParam) {
      setSelectedCategory(categoryParam);
    } else {
      setSelectedCategory('all');
    }

    if (filterParam) {
      if (filterParam === 'bestseller') setSortBy('bestseller');
      if (filterParam === 'new') setSortBy('new');
      if (filterParam === 'premium') setSortBy('premium');
    } else {
      setSortBy('featured');
    }
    setCurrentPage(1);
  }, [searchParams]);

  // Categories list
  const categoriesList = [
    { value: 'all', label: 'All Categories' },
    { value: 'dark', label: 'Dark Chocolate' },
    { value: 'milk', label: 'Milk Chocolate' },
    { value: 'white', label: 'White Chocolate' },
    { value: 'gift', label: 'Gifts & Hampers' },
    { value: 'beverage', label: 'Beverages' },
  ];

  // Rating stars filter options
  const ratingOptions = [4.8, 4.7, 4.6];

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setPriceRange({ min: 0, max: 4000 });
    setMinRating(null);
    setSortBy('featured');
    setSearchParams({});
    setCurrentPage(1);
  };

  // --- Filtering Logic ---
  const filteredProducts = products.filter((product) => {
    // 1. Search Query
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Category
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;

    // 3. Price
    const matchesPrice = product.price >= priceRange.min && product.price <= priceRange.max;

    // 4. Rating
    const matchesRating = minRating === null || product.rating >= minRating;

    return matchesSearch && matchesCategory && matchesPrice && matchesRating;
  });

  // --- Sorting Logic ---
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'bestseller') {
      return (b.badge === 'Bestseller' ? 1 : 0) - (a.badge === 'Bestseller' ? 1 : 0);
    }
    if (sortBy === 'new') {
      return (b.badge === 'New' ? 1 : 0) - (a.badge === 'New' ? 1 : 0);
    }
    if (sortBy === 'premium') {
      return (b.badge === 'Premium' ? 1 : 0) - (a.badge === 'Premium' ? 1 : 0);
    }
    return 0; // 'featured'
  });

  // --- Pagination Logic ---
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
                max="4000"
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
                    <span>{rating}+ Rated</span>
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
                Showing <strong>{indexOfFirstItem + 1} - {Math.min(indexOfLastItem, sortedProducts.length)}</strong> of{' '}
                <strong>{sortedProducts.length}</strong> products
              </span>

              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                {/* Sort Selector */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                  <ArrowUpDown size={14} style={{ color: 'var(--gold)' }} />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--cream)',
                      outline: 'none',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    <option value="featured" style={{ background: 'var(--dark-chocolate)' }}>Featured</option>
                    <option value="price-low" style={{ background: 'var(--dark-chocolate)' }}>Price: Low to High</option>
                    <option value="price-high" style={{ background: 'var(--dark-chocolate)' }}>Price: High to Low</option>
                    <option value="rating" style={{ background: 'var(--dark-chocolate)' }}>Highest Rated</option>
                    <option value="bestseller" style={{ background: 'var(--dark-chocolate)' }}>Bestsellers</option>
                    <option value="new" style={{ background: 'var(--dark-chocolate)' }}>New Arrivals</option>
                  </select>
                </div>

                {/* Grid/List toggles */}
                <div style={{ display: 'flex', gap: '6px', borderLeft: '1px solid var(--glass-border)', paddingLeft: '15px' }}>
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
            </div>

            {/* List / Grid Display */}
            {currentItems.length === 0 ? (
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
                {currentItems.map((prod) => (
                  <Card key={prod.id} product={prod} />
                ))}
              </div>
            ) : (
              /* List Layout */
              <div className="shop-list-layout">
                {currentItems.map((prod) => {
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
                          src={prod.image}
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
            {totalPages > 1 && (
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
