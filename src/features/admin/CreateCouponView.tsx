import React, { useState } from 'react';
import { Tag, HelpCircle, CheckCircle2, Calendar, Info, X, AlertCircle } from 'lucide-react';

interface CreateCouponViewProps {
  onAddCoupon: (couponData: any) => Promise<void>;
  onCancel?: () => void;
  addToast: (type: 'success' | 'error' | 'info', message: string, title?: string) => void;
}

export const CreateCouponView: React.FC<CreateCouponViewProps> = ({
  onAddCoupon,
  onCancel,
  addToast,
}) => {
  const [formData, setFormData] = useState({
    coupon_type: 'CUSTOMER', // CUSTOMER or INFLUENCER
    code: '',
    name: '',
    description: '',
    discount_type: 'PERCENTAGE', // PERCENTAGE, FIXED_AMOUNT, FREE_SHIPPING
    discount_value: '',
    maximum_discount_amount: '',
    minimum_order_amount: '',
    eligibility_rule: 'ALL_USERS',
    eligibility_value: '',
    applicability: 'ENTIRE_STORE',
    applicable_ids: '',
    usage_limit: '',
    per_user_usage_limit: '',
    start_at: '',
    expires_at: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      addToast('error', 'Coupon code is required.', 'Validation Error');
      return;
    }
    if (!formData.name.trim()) {
      addToast('error', 'Coupon name is required.', 'Validation Error');
      return;
    }
    if (!formData.description.trim()) {
      addToast('error', 'Coupon description is required.', 'Validation Error');
      return;
    }
    if (!formData.expires_at) {
      addToast('error', 'Expiry date is required.', 'Validation Error');
      return;
    }

    const discountVal = parseFloat(formData.discount_value) || 0;
    const isPercentage = formData.discount_type === 'PERCENTAGE';
    const isFixed = formData.discount_type === 'FIXED_AMOUNT';

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim() || formData.code.trim().toUpperCase(),
      description: formData.description.trim() || formData.name.trim() || formData.code.trim().toUpperCase(),
      coupon_type: formData.coupon_type,
      discount_type: formData.discount_type,
      discount_percent: isPercentage ? discountVal : 0,
      discount_amount: isFixed ? discountVal : 0,
      maximum_discount_amount: parseFloat(formData.maximum_discount_amount) || 0,
      minimum_order_amount: parseFloat(formData.minimum_order_amount) || 0,
      eligibility_rule: formData.eligibility_rule,
      eligibility_value: formData.eligibility_value || undefined,
      applicability: formData.applicability,
      applicable_ids: formData.applicable_ids
        ? formData.applicable_ids.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
      usage_limit: parseInt(formData.usage_limit) || 0,
      per_user_usage_limit: parseInt(formData.per_user_usage_limit) || 1,
      start_at: formData.start_at ? `${formData.start_at}T00:00:00Z` : undefined,
      expires_at: formData.expires_at ? `${formData.expires_at}T23:59:59Z` : undefined,
      is_active: true,
    };

    setIsSubmitting(true);
    try {
      await onAddCoupon(payload);
      addToast('success', `Coupon "${payload.code}" created successfully!`, 'Coupon Created');
      // Reset form
      setFormData({
        coupon_type: 'CUSTOMER',
        code: '',
        name: '',
        description: '',
        discount_type: 'PERCENTAGE',
        discount_value: '',
        maximum_discount_amount: '',
        minimum_order_amount: '',
        eligibility_rule: 'ALL_USERS',
        eligibility_value: '',
        applicability: 'ENTIRE_STORE',
        applicable_ids: '',
        usage_limit: '',
        per_user_usage_limit: '',
        start_at: '',
        expires_at: '',
      });
    } catch (err: any) {
      addToast('error', err?.detail || err?.message || 'Failed to create coupon.', 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Compute live preview text
  const discountPreview = () => {
    if (!formData.discount_value) return '-';
    if (formData.discount_type === 'PERCENTAGE') return `${formData.discount_value}% OFF`;
    if (formData.discount_type === 'FIXED_AMOUNT') return `₹${formData.discount_value} OFF`;
    if (formData.discount_type === 'FREE_SHIPPING') return 'Free Shipping';
    return '-';
  };

  const validityPreview = () => {
    if (!formData.start_at && !formData.expires_at) return '-';
    const startStr = formData.start_at ? new Date(formData.start_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Immediate';
    const expStr = formData.expires_at ? new Date(formData.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No Expiry';
    return `${startStr} - ${expStr}`;
  };

  const eligibilityLabel = () => {
    switch (formData.eligibility_rule) {
      case 'ALL_USERS': return 'All Users';
      case 'FIRST_ORDER': return 'First Order Only';
      case 'INACTIVE_CUSTOMER': return 'Inactive Customers (180+ days)';
      case 'MIN_LIFETIME_SPEND': return `Min Spend (₹${formData.eligibility_value || 0})`;
      case 'SPECIFIC_USERS': return 'Specific Users';
      default: return '-';
    }
  };

  const applicabilityLabel = () => {
    switch (formData.applicability) {
      case 'ENTIRE_STORE': return 'Entire Store';
      case 'SPECIFIC_PRODUCTS': return 'Specific Products';
      case 'SPECIFIC_CATEGORIES': return 'Specific Categories';
      default: return '-';
    }
  };

  return (
    <div style={{ color: 'var(--cream)', fontFamily: 'var(--font-body)', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>
      {/* ── Breadcrumb & Header ────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '0.85rem', color: '#c9a84c', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <span>Coupons &amp; Discounts</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>&gt;</span>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>Create New Coupon</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.2rem', color: '#f5efe6', margin: 0, fontWeight: 700 }}>
          Create New Coupon
        </h1>
      </div>

      {/* ── Main Two Column Layout ──────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '28px', alignItems: 'start' }}>
        
        {/* ── Left Form Column ──────────────────────────────────────── */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* SECTION 1: Coupon Type */}
          <div style={{ background: 'rgba(20,15,10,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#c9a84c', margin: '0 0 4px 0', fontWeight: 700 }}>
              1. Coupon Type
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', margin: '0 0 16px 0' }}>
              Select the type of coupon you want to create.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {/* Customer Coupon Radio Option */}
              <div
                onClick={() => handleChange('coupon_type', 'CUSTOMER')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: formData.coupon_type === 'CUSTOMER' ? '1.5px solid #c9a84c' : '1px solid rgba(255,255,255,0.1)',
                  background: formData.coupon_type === 'CUSTOMER' ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: formData.coupon_type === 'CUSTOMER' ? '5px solid #c9a84c' : '2px solid rgba(255,255,255,0.3)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: formData.coupon_type === 'CUSTOMER' ? '#f5efe6' : 'rgba(255,255,255,0.8)' }}>
                    Customer Coupon
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '4px', lineHeight: 1.4 }}>
                    Visible to customers in available coupons list.
                  </div>
                </div>
              </div>

              {/* Influencer Coupon Radio Option */}
              <div
                onClick={() => handleChange('coupon_type', 'INFLUENCER')}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '16px',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  border: formData.coupon_type === 'INFLUENCER' ? '1.5px solid #c9a84c' : '1px solid rgba(255,255,255,0.1)',
                  background: formData.coupon_type === 'INFLUENCER' ? 'rgba(201,168,76,0.06)' : 'rgba(255,255,255,0.02)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ marginTop: '2px' }}>
                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: formData.coupon_type === 'INFLUENCER' ? '5px solid #c9a84c' : '2px solid rgba(255,255,255,0.3)',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: formData.coupon_type === 'INFLUENCER' ? '#f5efe6' : 'rgba(255,255,255,0.8)' }}>
                    Influencer Coupon
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginTop: '4px', lineHeight: 1.4 }}>
                    Shared by influencers. Customers enter code manually.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Basic Information */}
          <div style={{ background: 'rgba(20,15,10,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#c9a84c', margin: '0 0 16px 0', fontWeight: 700 }}>
              2. Basic Information
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                  Coupon Code <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter coupon code (e.g. SAVE10)"
                  value={formData.code}
                  onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                  Coupon Name <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter coupon name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                Description <span style={{ color: '#e74c3c' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="Enter coupon description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '6px',
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(0,0,0,0.4)',
                  color: '#fff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* SECTION 3: Discount Details */}
          <div style={{ background: 'rgba(20,15,10,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#c9a84c', margin: '0 0 16px 0', fontWeight: 700 }}>
              3. Discount Details
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                  Discount Type <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => handleChange('discount_type', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(15,10,5,0.95)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount (₹)</option>
                  <option value="FREE_SHIPPING">Free Shipping</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                  Discount Value <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter discount value"
                  value={formData.discount_value}
                  onChange={(e) => handleChange('discount_value', e.target.value)}
                  min={1}
                  required
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                  Maximum Discount (₹) <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter maximum discount"
                  value={formData.maximum_discount_amount}
                  onChange={(e) => handleChange('maximum_discount_amount', e.target.value)}
                  min={0}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Order & Eligibility */}
          <div style={{ background: 'rgba(20,15,10,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#c9a84c', margin: '0 0 16px 0', fontWeight: 700 }}>
              4. Order &amp; Eligibility
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                  Minimum Order Value (₹) <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter minimum order value"
                  value={formData.minimum_order_amount}
                  onChange={(e) => handleChange('minimum_order_amount', e.target.value)}
                  min={0}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                  Eligibility Rule <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <select
                  value={formData.eligibility_rule}
                  onChange={(e) => handleChange('eligibility_rule', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(15,10,5,0.95)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ALL_USERS">All Users</option>
                  <option value="FIRST_ORDER">First Order Only</option>
                  <option value="INACTIVE_CUSTOMER">Inactive Customers (180+ days)</option>
                  <option value="MIN_LIFETIME_SPEND">Min Lifetime Spend</option>
                  <option value="SPECIFIC_USERS">Specific Users</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                  Applicability <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <select
                  value={formData.applicability}
                  onChange={(e) => handleChange('applicability', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(15,10,5,0.95)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer',
                  }}
                >
                  <option value="ENTIRE_STORE">Entire Store</option>
                  <option value="SPECIFIC_PRODUCTS">Specific Products</option>
                  <option value="SPECIFIC_CATEGORIES">Specific Categories</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 5: Usage Limits */}
          <div style={{ background: 'rgba(20,15,10,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#c9a84c', margin: '0 0 16px 0', fontWeight: 700 }}>
              5. Usage Limits
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                  Usage Limit (Total) <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter total usage limit"
                  value={formData.usage_limit}
                  onChange={(e) => handleChange('usage_limit', e.target.value)}
                  min={0}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                  Limit Per User <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <input
                  type="number"
                  placeholder="Enter limit per user"
                  value={formData.per_user_usage_limit}
                  onChange={(e) => handleChange('per_user_usage_limit', e.target.value)}
                  min={1}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '6px',
                    border: '1px solid rgba(255,255,255,0.12)',
                    background: 'rgba(0,0,0,0.4)',
                    color: '#fff',
                    fontSize: '0.88rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 6: Validity Period */}
          <div style={{ background: 'rgba(20,15,10,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#c9a84c', margin: '0 0 16px 0', fontWeight: 700 }}>
              6. Validity Period
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                  Start Date <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    value={formData.start_at}
                    onChange={(e) => handleChange('start_at', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      paddingRight: '36px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(0,0,0,0.4)',
                      color: '#fff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.83rem', fontWeight: 600, color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
                  Expiry Date <span style={{ color: '#e74c3c' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => handleChange('expires_at', e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      paddingRight: '36px',
                      borderRadius: '6px',
                      border: '1px solid rgba(255,255,255,0.12)',
                      background: 'rgba(0,0,0,0.4)',
                      color: '#fff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '8px' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 24px',
                borderRadius: '6px',
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(0,0,0,0.3)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <X size={16} /> Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 32px',
                borderRadius: '6px',
                border: 'none',
                background: 'linear-gradient(135deg, #c9a84c 0%, #a68434 100%)',
                color: '#0e0a05',
                fontWeight: 700,
                fontSize: '0.92rem',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 15px rgba(201,168,76,0.3)',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              <Tag size={16} /> {isSubmitting ? 'Creating...' : 'Create Coupon'}
            </button>
          </div>
        </form>

        {/* ── Right Info & Preview Sidebar ────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Important Notes Box */}
          <div style={{ background: 'rgba(20,15,10,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <Info size={18} color="#c9a84c" />
              <h4 style={{ fontSize: '0.95rem', color: '#c9a84c', margin: 0, fontWeight: 700 }}>
                Important Notes
              </h4>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45 }}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#c9a84c' }}>✦</span>
                <span>All fields marked with <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>*</span> are mandatory.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#c9a84c' }}>✦</span>
                <span>Customer Coupons will be visible to customers in the Available Coupons section.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#c9a84c' }}>✦</span>
                <span>Influencer Coupons will not be listed. Customers must enter the code manually.</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <span style={{ color: '#c9a84c' }}>✦</span>
                <span>Ensure the coupon has a valid date range and usage limits.</span>
              </div>
            </div>
          </div>

          {/* Coupon Summary (Preview) Box */}
          <div style={{ background: 'rgba(20,15,10,0.6)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', padding: '20px' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#c9a84c', margin: '0 0 16px 0', fontWeight: 700 }}>
              Coupon Summary (Preview)
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.83rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Coupon Type</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{formData.coupon_type === 'CUSTOMER' ? 'Customer Coupon' : 'Influencer Coupon'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Coupon Code</span>
                <span style={{ color: '#c9a84c', fontWeight: 700 }}>{formData.code || '-'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Discount</span>
                <span style={{ color: '#2ecc71', fontWeight: 600 }}>{discountPreview()}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Min. Order Value</span>
                <span style={{ color: '#fff' }}>{formData.minimum_order_amount ? `₹${formData.minimum_order_amount}` : '-'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Validity</span>
                <span style={{ color: '#fff' }}>{validityPreview()}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Usage Limit</span>
                <span style={{ color: '#fff' }}>{formData.usage_limit ? `${formData.usage_limit} total` : '-'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Applicability</span>
                <span style={{ color: '#fff' }}>{applicabilityLabel()}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Eligibility</span>
                <span style={{ color: '#fff' }}>{eligibilityLabel()}</span>
              </div>
            </div>

            <p style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.35)', margin: '16px 0 0 0', textAlign: 'center' }}>
              Preview will be shown after creating the coupon.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
