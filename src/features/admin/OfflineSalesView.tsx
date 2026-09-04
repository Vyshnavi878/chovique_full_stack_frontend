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
  ArrowLeft,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { adminService } from '../../services/adminService';
import { productService } from '../../services/productService';
import { Button } from '../../components/ui/Button';

interface OfflineSalesViewProps {
  addToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

interface BasketItem {
  product_id: string;
  product_name: string;
  sku: string;
  unit_price: number;
  quantity: number;
  available_stock?: number;
  line_total: number;
}

export const OfflineSalesView: React.FC<OfflineSalesViewProps> = ({ addToast }) => {
  // Navigation State — Toggle between main Ledger listing view and Record Form view
  const [showRecordForm, setShowRecordForm] = useState(false);

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
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Bank Transfer'>('Cash');
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  // Payment-Method-Specific Additional Fields State
  const [paymentDetails, setPaymentDetails] = useState({
    received_amount: '',
    receipt_number: '',
    card_type: 'Credit Card',
    card_last4: '',
    transaction_id: '',
    upi_id: '',
    bank_name: '',
    account_holder: '',
    payment_status: 'Paid',
  });

  // Switch Payment Method — resets previous method-specific values
  const handlePaymentMethodChange = (newMethod: 'Cash' | 'Card' | 'UPI' | 'Bank Transfer') => {
    setPaymentMethod(newMethod);
    setPaymentDetails({
      received_amount: '',
      receipt_number: '',
      card_type: 'Credit Card',
      card_last4: '',
      transaction_id: '',
      upi_id: '',
      bank_name: '',
      account_holder: '',
      payment_status: 'Paid',
    });
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.received_amount;
      delete next.receipt_number;
      delete next.card_type;
      delete next.card_last4;
      delete next.transaction_id;
      delete next.upi_id;
      delete next.bank_name;
      delete next.account_holder;
      delete next.payment_status;
      return next;
    });
  };

  // Validation Errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Ledger Entries State
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [ledgerSearch, setLedgerSearch] = useState('');

  // Fetch Products & Stock from Backend DB via productService
  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await productService.getProducts({ per_page: 100 });
      const items = res?.items || [];
      setProducts(items);
      if (items.length > 0 && !selectedProductId) {
        setSelectedProductId(items[0].id);
      }
    } catch (err: any) {
      console.error('Failed to fetch products for offline sales:', err);
      addToast('error', err?.message || 'Failed to load products from database.', 'Error');
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
      addToast('error', err?.message || 'Failed to load offline sales ledger.', 'Error');
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchLedgerEntries();
  }, []);

  // Selected product object
  const selectedProduct = useMemo(() => {
    return products.find((p) => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Line total for current input
  const currentLineTotal = useMemo(() => {
    if (!selectedProduct) return 0;
    return (selectedProduct.price || 0) * (itemQuantity || 0);
  }, [selectedProduct, itemQuantity]);

  // Handle Add Item to Basket
  const handleAddToBasket = (e: React.FormEvent) => {
    e.preventDefault();
    setItemError(null);
    if (!selectedProduct) {
      setItemError('Please select a valid product.');
      return;
    }
    if (!itemQuantity || itemQuantity <= 0) {
      setItemError('Quantity must be at least 1.');
      return;
    }

    const availableStock = selectedProduct.stock || 0;
    const unitPrice = selectedProduct.price || 0;
    const sku = selectedProduct.sku || selectedProduct.id || 'N/A';

    // Check existing quantity in basket
    const existingIndex = basket.findIndex((item) => item.product_id === selectedProduct.id);
    const existingQty = existingIndex >= 0 ? basket[existingIndex].quantity : 0;
    const totalDesiredQty = existingQty + itemQuantity;

    if (existingIndex >= 0) {
      const updatedBasket = [...basket];
      updatedBasket[existingIndex].quantity = totalDesiredQty;
      updatedBasket[existingIndex].line_total = totalDesiredQty * unitPrice;
      setBasket(updatedBasket);
    } else {
      setBasket([
        ...basket,
        {
          product_id: selectedProduct.id,
          product_name: selectedProduct.name,
          sku: sku,
          unit_price: unitPrice,
          quantity: itemQuantity,
          available_stock: availableStock,
          line_total: itemQuantity * unitPrice,
        },
      ]);
    }

    // Reset item quantity input
    setItemQuantity(1);
  };

  // Handle Remove Item from Basket
  const handleRemoveFromBasket = (index: number) => {
    setBasket(basket.filter((_, i) => i !== index));
  };

  // Basket Subtotal & Final Total calculation
  const subtotal = useMemo(() => {
    return basket.reduce((acc, item) => acc + item.line_total, 0);
  }, [basket]);

  const finalTotal = useMemo(() => {
    const d = Math.max(0, discount || 0);
    const t = Math.max(0, tax || 0);
    return Math.max(0, subtotal - d + t);
  }, [subtotal, discount, tax]);

  // Form Validation
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

    // Dynamic Payment-Method Validation
    if (paymentMethod === 'Cash') {
      if (!paymentDetails.received_amount || isNaN(Number(paymentDetails.received_amount)) || Number(paymentDetails.received_amount) <= 0) {
        errors.received_amount = 'Received Amount (₹) is required and must be greater than 0.';
      }
      if (!paymentDetails.payment_status) {
        errors.payment_status = 'Payment Status is required.';
      }
    } else if (paymentMethod === 'Card') {
      if (!paymentDetails.card_type) {
        errors.card_type = 'Card Type is required.';
      }
      if (!paymentDetails.card_last4 || !/^\d{4}$/.test(paymentDetails.card_last4.trim())) {
        errors.card_last4 = 'Last 4 Digits are required and must be exactly 4 digits.';
      }
      if (!paymentDetails.transaction_id || !paymentDetails.transaction_id.trim()) {
        errors.transaction_id = 'Transaction ID is required.';
      }
      if (!paymentDetails.payment_status) {
        errors.payment_status = 'Payment Status is required.';
      }
    } else if (paymentMethod === 'UPI') {
      if (!paymentDetails.upi_id || !paymentDetails.upi_id.trim()) {
        errors.upi_id = 'UPI ID is required.';
      }
      if (!paymentDetails.transaction_id || !paymentDetails.transaction_id.trim()) {
        errors.transaction_id = 'Transaction ID / UTR Number is required.';
      }
      if (!paymentDetails.payment_status) {
        errors.payment_status = 'Payment Status is required.';
      }
    } else if (paymentMethod === 'Bank Transfer') {
      if (!paymentDetails.bank_name || !paymentDetails.bank_name.trim()) {
        errors.bank_name = 'Bank Name is required.';
      }
      if (!paymentDetails.account_holder || !paymentDetails.account_holder.trim()) {
        errors.account_holder = 'Account Holder Name is required.';
      }
      if (!paymentDetails.transaction_id || !paymentDetails.transaction_id.trim()) {
        errors.transaction_id = 'UTR / Transaction ID is required.';
      }
      if (!paymentDetails.payment_status) {
        errors.payment_status = 'Payment Status is required.';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Complete Transaction Submission
  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      addToast('error', 'Please complete all required fields and payment details.', 'Validation Error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        company_name: companyForm.company_name.trim(),
        contact_person: companyForm.contact_person.trim(),
        phone: companyForm.phone.trim(),
        email: companyForm.email.trim() || undefined,
        address: companyForm.address.trim(),
        payment_method: paymentMethod,
        discount: discount || 0,
        tax: tax || 0,
        payment_status: paymentDetails.payment_status,
        items: basket.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      };

      if (paymentMethod === 'Cash') {
        payload.received_amount = parseFloat(paymentDetails.received_amount);
        if (paymentDetails.receipt_number.trim()) {
          payload.receipt_number = paymentDetails.receipt_number.trim();
        }
      } else if (paymentMethod === 'Card') {
        payload.card_type = paymentDetails.card_type;
        payload.card_last4 = paymentDetails.card_last4.trim();
        payload.transaction_id = paymentDetails.transaction_id.trim();
      } else if (paymentMethod === 'UPI') {
        payload.upi_id = paymentDetails.upi_id.trim();
        payload.transaction_id = paymentDetails.transaction_id.trim();
      } else if (paymentMethod === 'Bank Transfer') {
        payload.bank_name = paymentDetails.bank_name.trim();
        payload.account_holder = paymentDetails.account_holder.trim();
        payload.transaction_id = paymentDetails.transaction_id.trim();
      }

      const result = await adminService.addOfflineSale(payload);

      addToast(
        'success',
        `Offline Sale ${result.receipt_id || result.id} recorded successfully! Ledger logged.`,
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
      setPaymentDetails({
        received_amount: '',
        receipt_number: '',
        card_type: 'Credit Card',
        card_last4: '',
        transaction_id: '',
        upi_id: '',
        bank_name: '',
        account_holder: '',
        payment_status: 'Paid',
      });
      setFormErrors({});

      // Refresh inventory & ledger, then return to Ledger list view
      await fetchProducts();
      await fetchLedgerEntries();
      setShowRecordForm(false);
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
        entry.contact_person?.toLowerCase().includes(q) ||
        entry.productName?.toLowerCase().includes(q) ||
        entry.payment_method?.toLowerCase().includes(q) ||
        entry.paymentMethod?.toLowerCase().includes(q)
    );
  }, [ledgerEntries, ledgerSearch]);

  // Calculate Ledger Metrics
  const ledgerMetrics = useMemo(() => {
    const totalCount = ledgerEntries.length;
    const totalRevenue = ledgerEntries.reduce((sum, entry) => sum + (entry.total_amount || entry.totalPrice || 0), 0);
    const avgSale = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;
    return { totalCount, totalRevenue, avgSale };
  }, [ledgerEntries]);

  return (
    <div style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px', color: '#f5efe6' }}>
      {/* Module Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <span style={{ color: 'rgba(201, 168, 76, 0.85)', fontSize: '0.78rem', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
            — POINT OF SALE &amp; DIRECT ORDERS
          </span>
          <h1 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '2.4rem', color: '#f5efe6', fontWeight: 700, margin: 0 }}>
            In-Store Sales
          </h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--beige)', marginTop: '4px', margin: 0 }}>
            Record in-store purchases and direct customer orders easily.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => {
              fetchProducts();
              fetchLedgerEntries();
            }}
            disabled={loadingProducts || loadingLedger}
            style={{
              padding: '10px 16px',
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

          <Button
            variant="gold"
            glow
            onClick={() => setShowRecordForm(!showRecordForm)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontWeight: 600 }}
          >
            <Plus size={18} />
            {showRecordForm ? 'VIEW SALES' : 'RECORD SALE'}
          </Button>
        </div>
      </div>

      {/* VIEW 1: RECORD OFFLINE SALE FORM VIEW */}
      {showRecordForm ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Breadcrumb Back Button */}
          <button
            type="button"
            onClick={() => setShowRecordForm(false)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--gold)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.9rem',
              fontWeight: 600,
              padding: 0,
              width: 'fit-content',
            }}
          >
            <ArrowLeft size={16} /> Back to Ledger Entries
          </button>

          {/* Record Sale Form */}
          <form onSubmit={handleSubmitSale}>
            <div
              className="glass-panel"
              style={{
                padding: '30px',
                background: 'rgba(20, 16, 13, 0.9)',
                border: '1px solid rgba(201, 168, 76, 0.35)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '28px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(201, 168, 76, 0.2)' }}>
                <h3 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.5rem', color: '#f5efe6', margin: 0 }}>
                  Record Sale
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'rgba(201, 168, 76, 0.85)', background: 'rgba(201, 168, 76, 0.1)', padding: '4px 12px', borderRadius: '20px', border: '1px solid rgba(201, 168, 76, 0.3)' }}>
                  In-Store POS
                </span>
              </div>

              {/* SECTION 1: Product Details & Basket */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <ShoppingBag size={18} color="#c9a84c" />
                  <h4 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.15rem', color: '#c9a84c', margin: 0 }}>
                    1. Product Details
                  </h4>
                </div>

                {/* Product Add Selector */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.2fr', gap: '14px', alignItems: 'end', marginBottom: '14px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                      Select Product from Database <span style={{ color: '#e74c3c' }}>*</span>
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
                        background: 'rgba(10, 8, 6, 0.85)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: '6px',
                        color: '#f5efe6',
                        fontSize: '0.85rem',
                        outline: 'none',
                      }}
                    >
                      {products.length === 0 ? (
                        <option value="">{loadingProducts ? 'Loading products...' : 'No products available in database'}</option>
                      ) : (
                        products.map((p) => {
                          const skuCode = p.sku || p.id.substring(0, 8).toUpperCase();
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} ({skuCode}) — ₹{(p.price || 0).toLocaleString('en-IN')}
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                      Qty Sold <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => {
                        setItemQuantity(parseInt(e.target.value) || 1);
                        setItemError(null);
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(10, 8, 6, 0.85)',
                        border: '1px solid rgba(255,255,255,0.18)',
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
                    disabled={!selectedProduct}
                    style={{
                      height: '40px',
                      padding: '0 16px',
                      background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 100%)',
                      border: 'none',
                      borderRadius: '6px',
                      color: '#0f0c0a',
                      fontWeight: 700,
                      fontSize: '0.82rem',
                      cursor: !selectedProduct ? 'not-allowed' : 'pointer',
                      opacity: !selectedProduct ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Plus size={16} /> Add to Basket
                  </button>
                </div>

                {/* Selected Product Pricing */}
                {selectedProduct && (
                  <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', display: 'flex', justifyContent: 'space-between', marginBottom: '14px', padding: '10px 14px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>Unit Price: <strong style={{ color: '#c9a84c' }}>₹{(selectedProduct.price || 0).toLocaleString('en-IN')}</strong></span>
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

                {/* Selected Basket Items Table */}
                <div>
                  <h5 style={{ fontSize: '0.82rem', fontWeight: 700, color: '#f5efe6', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Selected Basket Items ({basket.length})
                  </h5>
                  {basket.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '6px' }}>
                      No products added yet. Select a product above and click "Add to Basket".
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                      {basket.map((item, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '12px 16px',
                            background: 'rgba(10, 8, 6, 0.65)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f5efe6' }}>{item.product_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)' }}>
                              SKU: {item.sku} • Qty: {item.quantity} × ₹{item.unit_price.toLocaleString('en-IN')}
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#c9a84c' }}>
                              ₹{item.line_total.toLocaleString('en-IN')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromBasket(index)}
                              style={{ background: 'none', border: 'none', color: '#e74c3c', cursor: 'pointer', padding: 0 }}
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(201, 168, 76, 0.15)' }} />

              {/* SECTION 2: Company Details */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <Building2 size={18} color="#c9a84c" />
                  <h4 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.15rem', color: '#c9a84c', margin: 0 }}>
                    2. Company Details
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
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
                        background: 'rgba(10, 8, 6, 0.85)',
                        border: formErrors.company_name ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
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
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
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
                        background: 'rgba(10, 8, 6, 0.85)',
                        border: formErrors.contact_person ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
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
                        background: 'rgba(10, 8, 6, 0.85)',
                        border: formErrors.phone ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
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
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
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
                        background: 'rgba(10, 8, 6, 0.85)',
                        border: formErrors.email ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
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
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
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
                      background: 'rgba(10, 8, 6, 0.85)',
                      border: formErrors.address ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
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

              <div style={{ height: '1px', background: 'rgba(201, 168, 76, 0.15)' }} />

              {/* SECTION 3: Transaction Details */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                  <CreditCard size={18} color="#c9a84c" />
                  <h4 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.15rem', color: '#c9a84c', margin: 0 }}>
                    3. Transaction Details
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
                      Payment Method <span style={{ color: '#e74c3c' }}>*</span>
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => handlePaymentMethodChange(e.target.value as any)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(10, 8, 6, 0.85)',
                        border: '1px solid rgba(255,255,255,0.18)',
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
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
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
                        background: 'rgba(10, 8, 6, 0.85)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: '6px',
                        color: '#f5efe6',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)', display: 'block', marginBottom: '6px' }}>
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
                        background: 'rgba(10, 8, 6, 0.85)',
                        border: '1px solid rgba(255,255,255,0.18)',
                        borderRadius: '6px',
                        color: '#f5efe6',
                        fontSize: '0.85rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>


                {/* Cash Additional Fields */}
                {paymentMethod === 'Cash' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px', padding: '18px', background: 'rgba(201, 168, 76, 0.05)', borderRadius: '8px', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        Received Amount (₹) <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <input
                        id="cash-received-amount"
                        type="number"
                        min={0}
                        step="any"
                        placeholder="e.g. 5000"
                        value={paymentDetails.received_amount}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, received_amount: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.85)',
                          border: formErrors.received_amount ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      {formErrors.received_amount && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.received_amount}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        Payment Status <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <select
                        id="cash-payment-status"
                        value={paymentDetails.payment_status}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, payment_status: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.85)',
                          border: formErrors.payment_status ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          outline: 'none',
                        }}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                      {formErrors.payment_status && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.payment_status}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        Receipt Number <span style={{ color: 'var(--gold)', fontWeight: 400 }}>(Auto-generated)</span>
                      </label>
                      <input
                        id="cash-receipt-number"
                        type="text"
                        readOnly
                        disabled
                        value={`REC-${new Date().getFullYear()}-XXXXXX (Auto-generated)`}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.5)',
                          border: '1px dashed rgba(201, 168, 76, 0.35)',
                          borderRadius: '6px',
                          color: '#c9a84c',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                          cursor: 'not-allowed',
                          fontFamily: 'monospace',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Card Additional Fields */}
                {paymentMethod === 'Card' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px', padding: '18px', background: 'rgba(201, 168, 76, 0.05)', borderRadius: '8px', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        Card Type <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <select
                        id="card-type"
                        value={paymentDetails.card_type}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, card_type: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.85)',
                          border: formErrors.card_type ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          outline: 'none',
                        }}
                      >
                        <option value="Credit Card">Credit Card</option>
                        <option value="Debit Card">Debit Card</option>
                      </select>
                      {formErrors.card_type && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.card_type}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        Last 4 Digits <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <input
                        id="card-last4"
                        type="text"
                        inputMode="numeric"
                        maxLength={4}
                        placeholder="e.g. 4242"
                        value={paymentDetails.card_last4}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, card_last4: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.85)',
                          border: formErrors.card_last4 ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      {formErrors.card_last4 && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.card_last4}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        Transaction ID <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <input
                        id="card-transaction-id"
                        type="text"
                        placeholder="e.g. TXN-8923410"
                        value={paymentDetails.transaction_id}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, transaction_id: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.85)',
                          border: formErrors.transaction_id ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      {formErrors.transaction_id && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.transaction_id}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        Payment Status <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <select
                        id="card-payment-status"
                        value={paymentDetails.payment_status}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, payment_status: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.85)',
                          border: formErrors.payment_status ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          outline: 'none',
                        }}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                      {formErrors.payment_status && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.payment_status}</span>}
                    </div>
                  </div>
                )}

                {/* UPI Additional Fields */}
                {paymentMethod === 'UPI' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px', padding: '18px', background: 'rgba(201, 168, 76, 0.05)', borderRadius: '8px', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        UPI ID <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <input
                        id="upi-id"
                        type="text"
                        placeholder="e.g. merchant@okhdfcbank or 9876543210@upi"
                        value={paymentDetails.upi_id}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, upi_id: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.85)',
                          border: formErrors.upi_id ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      {formErrors.upi_id && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.upi_id}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        Transaction ID / UTR Number <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <input
                        id="upi-transaction-id"
                        type="text"
                        placeholder="e.g. 412890312384"
                        value={paymentDetails.transaction_id}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, transaction_id: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.85)',
                          border: formErrors.transaction_id ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      {formErrors.transaction_id && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.transaction_id}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        Payment Status <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <select
                        id="upi-payment-status"
                        value={paymentDetails.payment_status}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, payment_status: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.85)',
                          border: formErrors.payment_status ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          outline: 'none',
                        }}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                      {formErrors.payment_status && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.payment_status}</span>}
                    </div>
                  </div>
                )}

                {/* Bank Transfer Additional Fields */}
                {paymentMethod === 'Bank Transfer' && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px', padding: '18px', background: 'rgba(201, 168, 76, 0.05)', borderRadius: '8px', border: '1px solid rgba(201, 168, 76, 0.2)' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        Bank Name <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <input
                        id="bank-name"
                        type="text"
                        placeholder="e.g. HDFC Bank"
                        value={paymentDetails.bank_name}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, bank_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.85)',
                          border: formErrors.bank_name ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      {formErrors.bank_name && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.bank_name}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        Account Holder Name <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <input
                        id="bank-account-holder"
                        type="text"
                        placeholder="e.g. Rajesh Sharma"
                        value={paymentDetails.account_holder}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, account_holder: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.85)',
                          border: formErrors.account_holder ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      {formErrors.account_holder && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.account_holder}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        UTR / Transaction ID <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <input
                        id="bank-transaction-id"
                        type="text"
                        placeholder="e.g. UTR-9823471029"
                        value={paymentDetails.transaction_id}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, transaction_id: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.85)',
                          border: formErrors.transaction_id ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      {formErrors.transaction_id && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.transaction_id}</span>}
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: '6px' }}>
                        Payment Status <span style={{ color: '#e74c3c' }}>*</span>
                      </label>
                      <select
                        id="bank-payment-status"
                        value={paymentDetails.payment_status}
                        onChange={(e) => setPaymentDetails({ ...paymentDetails, payment_status: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: 'rgba(10, 8, 6, 0.85)',
                          border: formErrors.payment_status ? '1px solid #e74c3c' : '1px solid rgba(255,255,255,0.18)',
                          borderRadius: '6px',
                          color: '#f5efe6',
                          fontSize: '0.85rem',
                          outline: 'none',
                        }}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Pending">Pending</option>
                      </select>
                      {formErrors.payment_status && <span style={{ color: '#e74c3c', fontSize: '0.72rem', marginTop: '4px', display: 'block' }}>{formErrors.payment_status}</span>}
                    </div>
                  </div>
                )}

                {/* Financial Summary Box */}
                <div style={{ padding: '20px', background: 'rgba(10, 8, 6, 0.65)', border: '1px solid rgba(201, 168, 76, 0.25)', borderRadius: '8px', marginBottom: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>
                    <span>Basket Subtotal:</span>
                    <span>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '8px', color: 'rgba(255,255,255,0.7)' }}>
                    <span>Discount:</span>
                    <span>- ₹{(discount || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '14px', color: 'rgba(255,255,255,0.7)' }}>
                    <span>Tax / GST:</span>
                    <span>+ ₹{(tax || 0).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.12)', marginBottom: '14px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 700, color: '#f5efe6' }}>Total Transaction Amount:</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#c9a84c', fontFamily: 'var(--font-display, serif)' }}>
                      ₹{finalTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px' }}>
                  <button
                    type="submit"
                    disabled={isSubmitting || basket.length === 0}
                    style={{
                      flex: 1,
                      padding: '14px',
                      background: 'linear-gradient(135deg, #c9a84c 0%, #e5c875 50%, #c9a84c 100%)',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#0f0c0a',
                      fontSize: '0.95rem',
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
                        <Receipt size={18} /> Complete Sale
                      </>
                    )}
                  </button>
                  <Button
                    variant="glass"
                    type="button"
                    onClick={() => setShowRecordForm(false)}
                    style={{ padding: '14px 24px' }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* VIEW 2: MAIN LEDGER ENTRIES LISTING VIEW */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Ledger Entries List Panel */}
          <div
            className="glass-panel"
            style={{
              padding: '28px',
              background: 'rgba(20, 16, 13, 0.85)',
              border: '1px solid rgba(201, 168, 76, 0.3)',
              borderRadius: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(201,168,76,0.2)', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FileSpreadsheet size={22} color="#c9a84c" />
                <h3 style={{ fontFamily: 'var(--font-display, serif)', fontSize: '1.35rem', color: '#f5efe6', margin: 0 }}>
                  Ledger Entries ({filteredLedger.length})
                </h3>
              </div>

              {/* Search bar */}
              <div style={{ position: 'relative', width: '320px' }}>
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
                    paddingTop: '9px',
                    paddingBottom: '9px',
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
            </div>

            {/* Ledger Table Content */}
            <div>
              {loadingLedger ? (
                <div style={{ padding: '60px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
                  <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px', display: 'block', color: '#c9a84c' }} />
                  Loading ledger entries from database...
                </div>
              ) : filteredLedger.length === 0 ? (
                <div style={{ padding: '60px 20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                  No offline sales ledger entries found in database.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {filteredLedger.map((entry) => {
                    const receipt = entry.receipt_number || entry.receipt_id || entry.id;
                    const compName = entry.company_name || 'Direct Customer';
                    const contact = entry.contact_person || 'Walk-in';
                    const phone = entry.phone || '';
                    const email = entry.email || '';
                    const address = entry.address || '';
                    const subtotalVal = entry.subtotal ?? (entry.total_amount || entry.totalPrice || 0);
                    const discountVal = entry.discount ?? 0;
                    const taxVal = entry.tax ?? 0;
                    const total = entry.total_amount || entry.totalPrice || 0;
                    const itemsList = entry.items || [];
                    const createdDate = entry.created_at || entry.date || '';
                    const method = entry.payment_method || entry.paymentMethod || 'Cash';
                    const payStatus = entry.payment_status || entry.status || 'Paid';

                    return (
                      <div
                        key={entry.id}
                        style={{
                          padding: '18px 20px',
                          background: 'rgba(10, 8, 6, 0.65)',
                          border: '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '10px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#c9a84c', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
                                {receipt}
                              </span>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  background: 'rgba(201, 168, 76, 0.15)',
                                  color: '#c9a84c',
                                }}
                              >
                                {method}
                              </span>
                              <span
                                style={{
                                  padding: '2px 8px',
                                  borderRadius: '10px',
                                  fontSize: '0.68rem',
                                  fontWeight: 700,
                                  background: payStatus === 'Paid' ? 'rgba(46, 204, 113, 0.15)' : 'rgba(241, 196, 15, 0.15)',
                                  color: payStatus === 'Paid' ? '#2ecc71' : '#f1c40f',
                                }}
                              >
                                {payStatus}
                              </span>
                            </div>

                            <h4 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#f5efe6', margin: '4px 0 0 0' }}>
                              {compName}
                            </h4>
                            <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                              Contact: <strong>{contact}</strong> {phone ? `• ${phone}` : ''} {email ? `• ${email}` : ''}
                            </div>
                            {address && (
                              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                                Address: {address}
                              </div>
                            )}

                            {/* Payment Method Details Snippet */}
                            <div style={{ fontSize: '0.75rem', color: '#c9a84c', marginTop: '4px', background: 'rgba(201, 168, 76, 0.08)', padding: '4px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              {method === 'Cash' && (
                                <span>
                                  Cash Details: Received ₹{entry.received_amount != null ? entry.received_amount.toLocaleString('en-IN') : total.toLocaleString('en-IN')} {receipt ? `• Receipt #${receipt}` : ''}
                                </span>
                              )}
                              {method === 'Card' && (
                                <span>
                                  Card Details: {entry.card_type || 'Card'} •••• {entry.card_last4 || '****'} {entry.transaction_id ? `• Txn: ${entry.transaction_id}` : ''}
                                </span>
                              )}
                              {method === 'UPI' && (
                                <span>
                                  UPI Details: {entry.upi_id || 'UPI'} {entry.transaction_id ? `• Txn/UTR: ${entry.transaction_id}` : ''}
                                </span>
                              )}
                              {method === 'Bank Transfer' && (
                                <span>
                                  Bank Transfer Details: {entry.bank_name || 'Bank'} {entry.account_holder ? `(${entry.account_holder})` : ''} {entry.transaction_id ? `• UTR: ${entry.transaction_id}` : ''}
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2ecc71', fontFamily: 'var(--font-display, serif)' }}>
                              ₹{total.toLocaleString('en-IN')}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
                              Subtotal: ₹{subtotalVal.toLocaleString('en-IN')} {discountVal > 0 ? `• Disc: ₹${discountVal}` : ''} {taxVal > 0 ? `• Tax: ₹${taxVal}` : ''}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)', marginTop: '4px' }}>
                              Date: {createdDate}
                            </div>
                          </div>
                        </div>

                        {/* Itemized Products Breakdown */}
                        {itemsList.length > 0 ? (
                          <div style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.04)' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#c9a84c', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.5px' }}>
                              Purchased Items ({itemsList.length})
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {itemsList.map((it: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'rgba(255,255,255,0.75)' }}>
                                  <span>• {it.product_name} <span style={{ color: 'rgba(255,255,255,0.4)' }}>(SKU: {it.sku || 'N/A'})</span> × {it.quantity}</span>
                                  <span style={{ color: '#c9a84c', fontWeight: 600 }}>₹{(it.line_total || (it.unit_price * it.quantity) || 0).toLocaleString('en-IN')}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', padding: '6px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '6px' }}>
                            Item: {entry.productName || 'Offline Sale'} ({entry.quantity || 1}x)
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineSalesView;
