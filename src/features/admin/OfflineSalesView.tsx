import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  Building2,
  CreditCard,
  Receipt,
  FileSpreadsheet,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { adminService } from '../../services/adminService';

interface OfflineSalesViewProps {
  addToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

interface BasketItem {
  product_id: string;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  available_stock: number;
  line_total: number;
}

export const OfflineSalesView: React.FC<OfflineSalesViewProps> = ({ addToast }) => {
  // DB Products State
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Selected product input state for adding to basket
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [itemError, setItemError] = useState<string | null>(null);

  // Basket State
  const [basket, setBasket] = useState<BasketItem[]>([]);

  // Company Details Form State
  const [companyForm, setCompanyForm] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
  });

  // Transaction Details Form State
  const [paymentMethod, setPaymentMethod] = useState<string>('Cash');
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  // Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ledger Entries State
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Fetch Products & Stock from Backend DB
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const data = await adminService.getProducts();
      setProducts(data || []);
      if (data && data.length > 0 && !selectedProductId) {
        setSelectedProductId(data[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch products for offline sales:', err);
      addToast('error', 'Failed to load products from database.', 'Error');
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch Ledger Entries from Backend DB
  const fetchLedgerEntries = async () => {
    setLoadingLedger(true);
    try {
      const data = await adminService.getOfflineSales();
      setLedgerEntries(data || []);
    } catch (err: any) {
      console.error('Failed to fetch offline sales ledger:', err);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchLedgerEntries();
  }, []);

  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Selected product line total calculation
  const currentLineTotal = useMemo(() => {
    if (!selectedProduct) return 0;
    return (selectedProduct.price || 0) * (itemQuantity || 1);
  }, [selectedProduct, itemQuantity]);

  // Add Item to Transaction Basket
  const handleAddToBasket = (e: React.FormEvent) => {
    e.preventDefault();
    setItemError(null);

    if (!selectedProduct) {
      setItemError('Please select a valid product.');
      return;
    }

    if (itemQuantity <= 0) {
      setItemError('Quantity must be at least 1.');
      return;
    }

    const availableStock = selectedProduct.stock || 0;
    const existingInBasket = basket.find((b) => b.product_id === selectedProduct.id);
    const existingQty = existingInBasket ? existingInBasket.quantity : 0;
    const totalRequested = existingQty + itemQuantity;

    if (totalRequested > availableStock) {
      setItemError(
        `Cannot add ${itemQuantity} unit(s). Available stock for "${selectedProduct.name}" is ${availableStock} (already ${existingQty} in basket).`
      );
      return;
    }

    const unitPrice = selectedProduct.price || 0;
    const lineTotal = unitPrice * itemQuantity;

    if (existingInBasket) {
      setBasket((prev) =>
        prev.map((b) =>
          b.product_id === selectedProduct.id
            ? {
                ...b,
                quantity: b.quantity + itemQuantity,
                line_total: (b.quantity + itemQuantity) * unitPrice,
              }
            : b
        )
      );
    } else {
      setBasket((prev) => [
        ...prev,
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          sku: selectedProduct.sku || selectedProduct.id.substring(0, 8).toUpperCase(),
          unit_price: unitPrice,
          quantity: itemQuantity,
          available_stock: availableStock,
          line_total: lineTotal,
        },
      ]);
    }

    setItemQuantity(1);
    addToast('info', `Added "${selectedProduct.name}" (${itemQuantity}x) to transaction basket.`, 'Added to Basket');
  };

  const handleRemoveFromBasket = (index: number) => {
    setBasket((prev) => prev.filter((_, i) => i !== index));
  };

  // Subtotal & Financial Calculations
  const subtotal = useMemo(() => {
    return basket.reduce((sum, item) => sum + item.line_total, 0);
  }, [basket]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - (discount || 0) + (tax || 0));
  }, [subtotal, discount, tax]);

  // Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!companyForm.company_name.trim()) {
      errors.company_name = 'Company Name is required.';
    }
    if (!companyForm.contact_person.trim()) {
      errors.contact_person = 'Contact Person is required.';
    }
    if (!companyForm.phone.trim()) {
      errors.phone = 'Phone Number is required.';
    } else {
      const phoneRegex = /^(\+91[\-\s]?)?[0]?[6-9]\d{9}$|^\+?[0-9\s\-()]{7,15}$/;
      if (!phoneRegex.test(companyForm.phone.trim())) {
        errors.phone = 'Please enter a valid phone number (e.g. +91 9876543210).';
      }
    }

    if (companyForm.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(companyForm.email.trim())) {
        errors.email = 'Please enter a valid email address.';
      }
    }

    if (!companyForm.address.trim()) {
      errors.address = 'Company Address is required.';
    }

    if (basket.length === 0) {
      errors.basket = 'Transaction basket cannot be empty. Please add at least one product.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Complete Transaction Submission
  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('error', 'Please complete all required fields and add items to the basket.', 'Validation Error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        company_name: companyForm.company_name.trim(),
        contact_person: companyForm.contact_person.trim(),
        phone: companyForm.phone.trim(),
        email: companyForm.email.trim() || undefined,
        address: companyForm.address.trim(),
        payment_method: paymentMethod,
        discount: discount || 0,
        tax: tax || 0,
        items: basket.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      };

      const result = await adminService.addOfflineSale(payload);

      addToast(
        'success',
        `Offline Sale ${result.receipt_id} completed successfully! Invoice logged & product stock updated.`,
        'Transaction Recorded'
      );

      // Reset form & basket
      setBasket([]);
      setCompanyForm({
        company_name: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
      });
      setDiscount(0);
      setTax(0);
      setPaymentMethod('Cash');
      setFormErrors({});

      // Refresh inventory & ledger
      fetchProducts();
      fetchLedgerEntries();
    } catch (err: any) {
      console.error('Failed to log offline sale:', err);
      addToast('error', err?.detail || err?.message || 'Failed to complete transaction.', 'Transaction Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Ledger Entries
  const filteredLedger = useMemo(() => {
    if (!ledgerSearch.trim()) return ledgerEntries;
    const q = ledgerSearch.toLowerCase().trim();
    return ledgerEntries.filter(
      (entry) =>
        entry.receipt_id?.toLowerCase().includes(q) ||
        entry.id?.toLowerCase().includes(q) ||
        entry.company_name?.toLowerCase().includes(q) ||
        entry.productName?.toLowerCase().includes(q) ||
        entry.payment_method?.toLowerCase().includes(q)
    );
  }, [ledgerEntries, ledgerSearch]);

  return (
    <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px', color: '#f5efe6' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ color: 'rgba(201, 168, 76, 0.85)', fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
            — BOUTIQUE POS &amp; B2B SALES
          </span>
          <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2.4rem', color: '#f5efe6', fontWeight: 700, margin: 0 }}>
            Offline Sales &amp; Ledger
          </h1>
        </div>

        <button
          onClick={() => {
            fetchProducts();
            fetchLedgerEntries();
          }}
          disabled={loadingProducts || loadingLedger}
          style={{
            padding: '10px 18px',
            background: 'rgba(20, 16, 13, 0.85)',
            border: '1px solid rgba(201, 168, 76, 0.3)',
            borderRadius: '8px',
            color: '#c9a84c',
            fontSize: '0.82rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <RefreshCw size={15} className={loadingProducts || loadingLedger ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>

      {/* Main Grid: Left Unified "Record Offline Sale" Card & Right Separate "Ledger Entries" Card */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '28px', alignItems: 'flex-start' }}>
        
        {/* UNIFIED SINGLE CARD: Record Offline Sale */}
        <form onSubmit={handleSubmitSale}>
          <div
            className="glass-panel"
            style={{
              padding: '28px',
              background: 'rgba(20, 16, 13, 0.85)',
              border: '1px solid rgba(201, 168, 76, 0.3)',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
            }}
          >
            <h3 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.4rem', color: '#f5efe6', margin: 0, paddingBottom: '12px', borderBottom: '1px solid rgba(201, 168, 76, 0.2)' }}>
              Record Offline Sale
            </h3>

            {/* SECTION 1: Product Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <ShoppingBag size={18} color="#c9a84c" />
                <h4 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.1rem', color: '#c9a84c', margin: 0 }}>
                  1. Product Details
                </h4>
              </div>

              {/* Product Add Selector */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', gap: '14px', alignItems: 'end', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                    Product Name / SKU
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setItemError(null);
                    }}
                    disabled={loadingProducts}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(10, 8, 6, 0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#f5efe6',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Stock: {p.stock || 0}) — ₹{(p.price || 0).toLocaleString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                    Qty Sold
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedProduct ? selectedProduct.stock || 1 : 100}
                    value={itemQuantity}
                    onChange={(e) => {
                      setItemQuantity(parseInt(e.target.value) || 1);
                      setItemError(null);
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(10, 8, 6, 0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#f5efe6',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleAddToBasket}
                  disabled={!selectedProduct || (selectedProduct.stock || 0) <= 0}
                  style={{
                    height: '40px',
                    padding: '0 16px',
                    background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#0f0c0a',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={16} /> Add to Basket
                </button>
              </div>

              {/* Selected Product Pricing Badge */}
              {selectedProduct && (
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.6)', display: 'flex', justifyContent: 'space-between', marginBottom: '14px', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                  <span>Unit Price: <strong style={{ color: '#c9a84c' }}>₹{(selectedProduct.price || 0).toLocaleString('en-IN')}</strong></span>
                  <span>Available Stock: <strong style={{ color: (selectedProduct.stock || 0) > 5 ? '#2ecc71' : '#e74c3c' }}>{selectedProduct.stock || 0} units</strong></span>
                  <span>Line Total: <strong style={{ color: '#c9a84c' }}>₹{currentLineTotal.toLocaleString('en-IN')}</strong></span>
                </div>
              )}

              {itemError && (
                <div style={{ padding: '8px 12px', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '6px', color: '#e74c3c', fontSize: '0.78rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={14} /> {itemError}
                </div>
              )}

              {formErrors.basket && (
                <div style={{ padding: '8px 12px', background: 'rgba(231,76,60,0.15)', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '6px', color: '#e74c3c', fontSize: '0.78rem', marginBottom: '14px' }}>
                  {formErrors.basket}
                </div>
              )}

              {/* Basket Items List inside same card */}
              <div>
                <h5 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f5efe6', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Selected Basket Items ({basket.length})
                </h5>
                {basket.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '6px' }}>
                    No products added yet. Select a product above and click "Add to Basket".
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
                    {basket.map((item, index) => (
                      <div
                        key={index}
                        style={{
                          padding: '10px 14px',
                          background: 'rgba(10, 8, 6, 0.6)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f5efe6' }}>{item.product_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)' }}>
                            Qty: {item.quantity} × ₹{item.unit_price.toLocaleString('en-IN')}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#c9a84c' }}>
                            ₹{item.line_total.toLocaleString('en-IN')}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFromBasket(index)}
                            style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: 0 }}
                            title="Remove product"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Internal Divider */}
            <div style={{ height: '1px', background: 'rgba(201, 168, 76, 0.15)' }} />

            {/* SECTION 2: Company Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <Building2 size={18} color="#c9a84c" />
                <h4 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.1rem', color: '#c9a84c', margin: 0 }}>
                  2. Company Details
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                    Company Name <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Royal Chocolates Pvt Ltd"
                    value={companyForm.company_name}
                    onChange={(e) => setCompanyForm({ ...companyForm, company_name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(10, 8, 6, 0.8)',
                      border: formErrors.company_name ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#f5efe6',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formErrors.company_name && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.company_name}</span>}
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                    Contact Person <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    value={companyForm.contact_person}
                    onChange={(e) => setCompanyForm({ ...companyForm, contact_person: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(10, 8, 6, 0.8)',
                      border: formErrors.contact_person ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#f5efe6',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formErrors.contact_person && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.contact_person}</span>}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                    Phone Number <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="+91 9876543210"
                    value={companyForm.phone}
                    onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(10, 8, 6, 0.8)',
                      border: formErrors.phone ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#f5efe6',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formErrors.phone && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.phone}</span>}
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(10, 8, 6, 0.8)',
                      border: formErrors.email ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#f5efe6',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  {formErrors.email && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.email}</span>}
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                  Company Address <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Full billing &amp; shipping address"
                  value={companyForm.address}
                  onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: 'rgba(10, 8, 6, 0.8)',
                    border: formErrors.address ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    color: '#f5efe6',
                    fontSize: '0.85rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                  }}
                />
                {formErrors.address && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.address}</span>}
              </div>
            </div>

            {/* Internal Divider */}
            <div style={{ height: '1px', background: 'rgba(201, 168, 76, 0.15)' }} />

            {/* SECTION 3: Transaction Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <CreditCard size={18} color="#c9a84c" />
                <h4 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.1rem', color: '#c9a84c', margin: 0 }}>
                  3. Transaction Details
                </h4>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '18px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                    Payment Method <span style={{ color: '#e74c3c' }}>*</span>
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(10, 8, 6, 0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#f5efe6',
                      fontSize: '0.85rem',
                      outline: 'none',
                    }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                    Discount (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={discount}
                    onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(10, 8, 6, 0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#f5efe6',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                    Tax / GST (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={tax}
                    onChange={(e) => setTax(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: 'rgba(10, 8, 6, 0.8)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '6px',
                      color: '#f5efe6',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div style={{ padding: '16px', background: 'rgba(10, 8, 6, 0.6)', border: '1px solid rgba(201, 168, 76, 0.2)', borderRadius: '8px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px', color: 'rgba(255,255,255,0.7)' }}>
                  <span>Basket Subtotal:</span>
                  <span>₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '6px', color: 'rgba(255,255,255,0.7)' }}>
                  <span>Discount:</span>
                  <span>- ₹{(discount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '12px', color: 'rgba(255,255,255,0.7)' }}>
                  <span>Tax / GST:</span>
                  <span>+ ₹{(tax || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '12px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f5efe6' }}>Total Transaction Amount:</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#c9a84c', fontFamily: 'var(--font-display, serif)' }}>
                    ₹{finalTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || basket.length === 0}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 50%, #c9a84c 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#0f0c0a',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: isSubmitting || basket.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting || basket.length === 0 ? 0.6 : 1,
                  boxShadow: '0 4px 16px rgba(201, 168, 76, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Recording Transaction...
                  </>
                ) : (
                  <>
                    <Receipt size={18} /> Complete Offline Sale &amp; Record Ledger
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* RIGHT COLUMN: Separate "Ledger Entries" Card */}
        <div
          className="glass-panel"
          style={{
            padding: '28px',
            background: 'rgba(20, 16, 13, 0.85)',
            border: '1px solid rgba(201, 168, 76, 0.3)',
            borderRadius: '12px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={20} color="#c9a84c" />
              <h3 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.25rem', color: '#f5efe6', margin: 0 }}>
                Ledger Entries ({filteredLedger.length})
              </h3>
            </div>
          </div>

          {/* Search bar */}
          <div style={{ position: 'relative', marginBottom: '16px' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)', pointerEvents: 'none' }} />
            <input
              type="text"
              placeholder="Search by receipt ID, company or payment..."
              value={ledgerSearch}
              onChange={(e) => setLedgerSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: '12px',
                paddingTop: '8px',
                paddingBottom: '8px',
                background: 'rgba(10, 8, 6, 0.8)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#f5efe6',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Ledger Table */}
          <div style={{ maxHeight: '680px', overflowY: 'auto' }}>
            {loadingLedger ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 10px', display: 'block', color: '#c9a84c' }} />
                Loading ledger entries from database...
              </div>
            ) : filteredLedger.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
                No offline sales ledger entries found in database.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filteredLedger.map((entry) => {
                  const receipt = entry.receipt_id || entry.id;
                  const compName = entry.company_name || 'Direct Customer';
                  const contact = entry.contact_person || 'Walk-in';
                  const total = entry.total_amount || entry.totalPrice || 0;
                  const itemsList = entry.items || [];

                  return (
                    <div
                      key={entry.id}
                      style={{
                        padding: '14px 16px',
                        background: 'rgba(10, 8, 6, 0.6)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#c9a84c', fontFamily: 'monospace' }}>
                            {receipt}
                          </span>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f5efe6', margin: '2px 0 0 0' }}>
                            {compName}
                          </h4>
                          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)' }}>
                            Contact: {contact}
                          </span>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '0.98rem', fontWeight: 800, color: '#2ecc71', fontFamily: 'var(--font-display, serif)' }}>
                            ₹{total.toLocaleString('en-IN')}
                          </div>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              background: 'rgba(46, 204, 113, 0.15)',
                              color: '#2ecc71',
                              marginTop: '4px',
                            }}
                          >
                            {entry.payment_method || entry.paymentMethod || 'Cash'}
                          </span>
                        </div>
                      </div>

                      {/* Items Summary */}
                      {itemsList.length > 0 ? (
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          {itemsList.map((it: any, i: number) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>• {it.product_name} (x{it.quantity})</span>
                              <span>₹{it.line_total?.toLocaleString('en-IN')}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                          Product: {entry.productName || 'Offline Sale'} ({entry.quantity || 1}x)
                        </div>
                      )}

                      <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', marginTop: '8px', textAlign: 'right' }}>
                        Date: {entry.created_at || entry.date}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default OfflineSalesView;
