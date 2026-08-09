import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  ShieldCheck,
  Truck,
  CreditCard,
  ChevronRight,
  Loader2,
  Coins,
  Tag,
} from 'lucide-react';
import { useApp } from '../../app/providers';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Progress } from '../../components/ui/Progress';
import { pageTransition, scaleUp } from '../../lib/framer';
import { apiPost } from '../../lib/api';
import { orderService } from '../../services/orderService';
import { walletService } from '../../services/walletService';
import { cartService } from '../../services/cartService';
import type { Order, CheckoutInitiateResponse, VerifyPaymentPayload } from '../../types';

// Razorpay global type declaration
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: new (options: Record<string, any>) => { open: () => void };
  }
}

/** Coupon data passed from CartPage via sessionStorage */
interface CheckoutCouponData {
  code: string;
  discount_percent: number;
  discount_amount: number;
}

export const CheckoutPage: React.FC = () => {
  const { cart, user, wallet, refreshWallet, placeOrderLocal } = useApp();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Coins redemption state
  const [useCoins, setUseCoins] = useState(false);
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [coinPreview, setCoinPreview] = useState<{
    allowed_coins: number;
    coin_discount: number;
    max_usable_coins: number;
    message: string;
  }>({ allowed_coins: 0, coin_discount: 0, max_usable_coins: 0, message: '' });

  // Check if this is a Buy Now flow or Cart flow
  const buyNowItemRaw = sessionStorage.getItem('chovique_buy_now_item');
  const buyNowItem = buyNowItemRaw ? (JSON.parse(buyNowItemRaw) as { product: any; quantity: number }) : null;

  // The checkout items to display and place order for
  const checkoutItems = buyNowItem
    ? [{ product: buyNowItem.product, quantity: buyNowItem.quantity }]
    : cart;

  // Redirect if checkout items list is empty (only on steps 1–5, not success screen)
  useEffect(() => {
    if (checkoutItems.length === 0 && activeStep < 6) {
      navigate('/cart');
    }
  }, [checkoutItems, navigate, activeStep]);

  // Pre-fill shipping form from authenticated user's default address if available
  const [shippingForm, setShippingForm] = useState({
    name: user?.profile?.name || '',
    street: user?.profile?.address?.street || '',
    city: user?.profile?.address?.city || '',
    state: user?.profile?.address?.state || '',
    zip: user?.profile?.address?.zip || '',
    phone: user?.profile?.phone || '',
  });

  const [deliveryOption, setDeliveryOption] = useState('Standard Delivery');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  // Coupon state: read initial coupon from sessionStorage or allow applying/removing directly
  const [appliedCoupon, setAppliedCoupon] = useState<CheckoutCouponData | null>(() => {
    try {
      const raw = sessionStorage.getItem('chovique_checkout_coupon');
      return raw ? (JSON.parse(raw) as CheckoutCouponData) : null;
    } catch {
      return null;
    }
  });

  const [couponInputCode, setCouponInputCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isCouponLoading, setIsCouponLoading] = useState(false);

  // Pricing calculations (display-only; backend recalculates authoritatively)
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = appliedCoupon?.discount_amount ?? 0;

  // Calculate coin redemption when useCoins is toggled or subtotal/coupon changes
  useEffect(() => {
    if (wallet && wallet.coin_balance > 0 && useCoins) {
      const requested = coinsToUse || wallet.coin_balance;
      walletService
        .calculateRedemption({
          subtotal,
          coupon_discount: discountAmount,
          coins_to_use: requested,
        })
        .then((res) => {
          setCoinPreview(res);
          if (!coinsToUse || coinsToUse > res.allowed_coins) {
            setCoinsToUse(res.allowed_coins);
          }
        })
        .catch(() => {});
    } else {
      setCoinPreview({ allowed_coins: 0, coin_discount: 0, max_usable_coins: 0, message: '' });
    }
  }, [wallet, useCoins, coinsToUse, subtotal, discountAmount]);

  const coinDiscountAmount = useCoins ? coinPreview.coin_discount : 0;
  // Free delivery for orders >= ₹1500, else ₹99
  const shippingFee = subtotal >= 1500 ? 0 : 99;
  const total = Math.max(0, subtotal - discountAmount - coinDiscountAmount + shippingFee);

  // Coupon handlers
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInputCode.trim()) return;
    setIsCouponLoading(true);
    setCouponError('');
    try {
      const res = await cartService.validateCoupon(couponInputCode.trim().toUpperCase());
      if (res.valid) {
        let calculatedDisc = 0;
        if (res.discount_type === 'PERCENTAGE') {
          calculatedDisc = (subtotal * (res.discount_percent || 0)) / 100;
          if (res.maximum_discount_amount > 0) {
            calculatedDisc = Math.min(calculatedDisc, res.maximum_discount_amount);
          }
        } else if (res.discount_type === 'FIXED_AMOUNT') {
          calculatedDisc = Math.min(res.discount_amount || 0, subtotal);
        } else {
          calculatedDisc = res.calculated_discount || 0;
        }

        const data: CheckoutCouponData = {
          code: res.code,
          discount_percent: res.discount_percent || 0,
          discount_amount: calculatedDisc,
        };
        setAppliedCoupon(data);
        sessionStorage.setItem('chovique_checkout_coupon', JSON.stringify(data));
        setCouponInputCode('');
      } else {
        setCouponError(res.message || 'Invalid promo code');
      }
    } catch {
      setCouponError('Could not validate promo code.');
    } finally {
      setIsCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    sessionStorage.removeItem('chovique_checkout_coupon');
  };

  // Validate shipping form before proceeding from step 2
  const validateShipping = (): boolean => {
    const required = ['name', 'street', 'city', 'state', 'zip', 'phone'] as const;
    return required.every((field) => shippingForm[field].trim().length > 0);
  };

  const nextStep = async () => {
    if (activeStep === 2 && !validateShipping()) {
      return; // Fields are marked required; browser/custom validation handles UI
    }

    if (activeStep === 4) {
      // ================================================================
      // DIRECT ORDER PLACEMENT FLOW (bypasses Razorpay authentication errors)
      // ================================================================
      setIsPlacingOrder(true);
      setOrderError('');
      setActiveStep(5); // Show processing screen immediately

      const orderPayload = {
        items: checkoutItems.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        shipping_address: {
          name: shippingForm.name,
          street: shippingForm.street,
          city: shippingForm.city,
          state: shippingForm.state,
          zip: shippingForm.zip,
          phone: shippingForm.phone,
        },
        delivery_option: deliveryOption,
        payment_method: paymentMethod,
        ...(appliedCoupon ? { coupon_code: appliedCoupon.code } : {}),
        coins_to_use: useCoins ? (coinsToUse || coinPreview.allowed_coins) : 0,
      };

      try {
        const order = await orderService.placeOrder(orderPayload);
        placeOrderLocal(order);
        setCreatedOrder(order);
        refreshWallet();
        sessionStorage.removeItem('chovique_checkout_coupon');
        sessionStorage.removeItem('chovique_buy_now_item');
        setActiveStep(6);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to place order. Please try again.';
        setOrderError(message);
        setActiveStep(4);
      } finally {
        setIsPlacingOrder(false);
      }
      return;
    }

    setActiveStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => {
    setActiveStep((prev) => Math.max(1, prev - 1));
  };

  const stepsHeader = [
    { num: 1, label: 'Cart Review' },
    { num: 2, label: 'Shipping Address' },
    { num: 3, label: 'Payment Method' },
    { num: 4, label: 'Order Summary' },
  ];

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="checkout-page"
    >
      <div className="container">
        {/* Checkout Header steps indicator (Only for steps 1-4) */}
        {activeStep <= 4 && (
          <div className="checkout-steps">
            <div className="checkout-step-list">
              {stepsHeader.map((st) => (
                <div
                  key={st.num}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    opacity: activeStep >= st.num ? 1 : 0.4,
                    transition: 'opacity 0.3s',
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: activeStep >= st.num ? 'var(--gradient-gold)' : 'rgba(255,255,255,0.1)',
                      color: activeStep >= st.num ? 'var(--dark-chocolate)' : 'var(--cream)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {st.num}
                  </span>
                  <span
                    style={{
                      fontSize: '0.85rem',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: activeStep === st.num ? 600 : 400,
                      color: activeStep === st.num ? 'var(--gold)' : 'var(--cream)',
                    }}
                  >
                    {st.label}
                  </span>
                  {st.num < 4 && <ChevronRight size={14} style={{ color: 'var(--grey-mid)' }} />}
                </div>
              ))}
            </div>
            <Progress value={activeStep} max={4} height={3} />
          </div>
        )}

        {/* Step Content panels */}
        <div className="checkout-panel">
          <AnimatePresence mode="wait">
            {/* STEP 1: REVIEW ITEMS */}
            {activeStep === 1 && (
              <motion.div
                key="step1"
                variants={scaleUp}
                initial="initial"
                animate="animate"
                exit="initial"
                className="glass-panel"
                style={{ padding: '30px', border: '1px solid var(--glass-border)' }}
              >
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--cream)', marginBottom: '20px' }}>
                  1. Review Your Selections
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                  {checkoutItems.map((item) => (
                    <div
                      key={item.product.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        paddingBottom: '12px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '2px' }}
                        />
                        <div>
                          <h4 style={{ fontSize: '0.95rem', color: 'var(--cream)', margin: 0 }}>{item.product.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--gold)' }}>
                            {item.product.weight} · Qty: {item.quantity}
                          </span>
                        </div>
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--cream)' }}>
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="gold" onClick={nextStep} glow>
                    Proceed to Shipping
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: SHIPPING FORM */}
            {activeStep === 2 && (
              <motion.div
                key="step2"
                variants={scaleUp}
                initial="initial"
                animate="animate"
                exit="initial"
                className="glass-panel"
                style={{ padding: '30px', border: '1px solid var(--glass-border)' }}
              >
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--cream)', marginBottom: '20px' }}>
                  2. Shipping Destination
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '30px' }}>
                  <Input
                    label="Full Name"
                    value={shippingForm.name}
                    onChange={(e) => setShippingForm({ ...shippingForm, name: e.target.value })}
                    required
                    autoComplete="name"
                  />
                  <Input
                    label="Street Address"
                    value={shippingForm.street}
                    onChange={(e) => setShippingForm({ ...shippingForm, street: e.target.value })}
                    required
                    autoComplete="street-address"
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Input
                      label="City"
                      value={shippingForm.city}
                      onChange={(e) => setShippingForm({ ...shippingForm, city: e.target.value })}
                      required
                      autoComplete="address-level2"
                    />
                    <Input
                      label="State"
                      value={shippingForm.state}
                      onChange={(e) => setShippingForm({ ...shippingForm, state: e.target.value })}
                      required
                      autoComplete="address-level1"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Input
                      label="ZIP Code"
                      value={shippingForm.zip}
                      onChange={(e) => setShippingForm({ ...shippingForm, zip: e.target.value })}
                      required
                      autoComplete="postal-code"
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      value={shippingForm.phone}
                      onChange={(e) => setShippingForm({ ...shippingForm, phone: e.target.value })}
                      required
                      autoComplete="tel"
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="secondary" onClick={prevStep}>
                    Back
                  </Button>
                  <Button
                    variant="gold"
                    onClick={nextStep}
                    glow
                    disabled={!validateShipping()}
                  >
                    Proceed to Payment
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PAYMENT OPTIONS */}
            {activeStep === 3 && (
              <motion.div
                key="step3"
                variants={scaleUp}
                initial="initial"
                animate="animate"
                exit="initial"
                className="glass-panel"
                style={{ padding: '30px', border: '1px solid var(--glass-border)' }}
              >
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--cream)', marginBottom: '20px' }}>
                  3. Choose Payment Option
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                  {['Credit Card', 'UPI / Google Pay', 'Net Banking', 'Cash on Delivery'].map((method) => (
                    <div
                      key={method}
                      onClick={() => setPaymentMethod(method)}
                      style={{
                        padding: '16px 20px',
                        borderRadius: '4px',
                        background: paymentMethod === method ? 'rgba(201, 168, 76, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                        border: paymentMethod === method ? '1px solid var(--gold)' : '1px solid var(--glass-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '15px',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                      }}
                    >
                      <CreditCard size={20} style={{ color: paymentMethod === method ? 'var(--gold)' : 'var(--beige)' }} />
                      <span style={{ color: 'var(--cream)', fontSize: '1rem', fontWeight: 600 }}>{method}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="secondary" onClick={prevStep}>
                    Back
                  </Button>
                  <Button variant="gold" onClick={nextStep} glow>
                    Order Summary
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: ORDER PREVIEW */}
            {activeStep === 4 && (
              <motion.div
                key="step4"
                variants={scaleUp}
                initial="initial"
                animate="animate"
                exit="initial"
                className="glass-panel"
                style={{ padding: '30px', border: '1px solid var(--glass-border)' }}
              >
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--cream)', marginBottom: '20px' }}>
                  4. Review and Place Order
                </h2>

                {/* Order error banner */}
                {orderError && (
                  <div
                    role="alert"
                    style={{
                      background: 'rgba(231, 76, 60, 0.1)',
                      border: '1px solid #e74c3c',
                      color: '#e74c3c',
                      borderRadius: '4px',
                      padding: '12px 16px',
                      fontSize: '0.9rem',
                      marginBottom: '20px',
                    }}
                  >
                    {orderError}
                  </div>
                )}

                {/* Sub panels details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                  <div
                    style={{
                      padding: '16px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '4px',
                      border: '1px solid var(--glass-border)',
                    }}
                  >
                    <h4 style={{ color: 'var(--gold)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                      Deliver To:
                    </h4>
                    <p style={{ color: 'var(--cream)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                      <strong>{shippingForm.name}</strong>
                      <br />
                      {shippingForm.street}
                      <br />
                      {shippingForm.city}, {shippingForm.state} - {shippingForm.zip}
                    </p>
                  </div>

                  <div
                    style={{
                      padding: '16px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '4px',
                      border: '1px solid var(--glass-border)',
                    }}
                  >
                    <h4 style={{ color: 'var(--gold)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                      Payment & Delivery:
                    </h4>
                    <p style={{ color: 'var(--cream)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                      <strong>Payment Method:</strong> {paymentMethod}
                      <br />
                      <strong>Delivery Charge:</strong> {shippingFee === 0 ? 'Free Standard Delivery' : 'Standard Delivery (₹99)'}
                    </p>
                  </div>
                </div>

                {/* Promo Code Entry & Applied Coupon Panel */}
                <div style={{ marginBottom: '25px' }}>
                  {appliedCoupon ? (
                    <div
                      style={{
                        padding: '12px 16px',
                        background: 'rgba(46, 204, 113, 0.1)',
                        border: '1px solid #2ecc71',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2ecc71' }}>
                        <Tag size={18} />
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Coupon Code Applied: {appliedCoupon.code}</span>
                          <span style={{ fontSize: '0.8rem', opacity: 0.9, display: 'block' }}>Saving -₹{discountAmount.toLocaleString()} on this order</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        style={{ background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <Input
                            placeholder="Enter Promo Code (e.g. WELCOME10)"
                            value={couponInputCode}
                            onChange={(e) => setCouponInputCode(e.target.value)}
                            style={{ textTransform: 'uppercase' }}
                          />
                        </div>
                        <Button variant="gold" type="submit" disabled={isCouponLoading || !couponInputCode.trim()} style={{ whiteSpace: 'nowrap' }}>
                          {isCouponLoading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : 'Apply Coupon'}
                        </Button>
                      </form>
                      {couponError && (
                        <p style={{ color: '#e74c3c', fontSize: '0.82rem', marginTop: '6px', marginBottom: 0 }}>{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Rewards Panel */}
                {wallet && wallet.coin_balance > 0 ? (
                  <div
                    style={{
                      padding: '16px 20px',
                      background: 'rgba(212, 175, 55, 0.08)',
                      border: '1px solid var(--gold)',
                      borderRadius: '6px',
                      marginBottom: '25px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Coins size={24} style={{ color: 'var(--gold)' }} />
                        <div>
                          <h4 style={{ color: 'var(--cream)', margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                            Chovique Reward Coins
                          </h4>
                          <p style={{ color: 'var(--beige)', fontSize: '0.82rem', margin: 0 }}>
                            Available: <strong>{wallet.coin_balance} coins</strong> (₹{(wallet.coin_balance / (wallet.settings?.coins_per_rupee || 10)).toFixed(0)} discount value)
                          </p>
                        </div>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--gold)', fontWeight: 600, fontSize: '0.9rem' }}>
                        <input
                          type="checkbox"
                          checked={useCoins}
                          onChange={(e) => {
                            setUseCoins(e.target.checked);
                            if (e.target.checked) {
                              setCoinsToUse(wallet.coin_balance);
                            }
                          }}
                          style={{ width: '18px', height: '18px', accentColor: 'var(--gold)', cursor: 'pointer' }}
                        />
                        <span>Use Available Coins</span>
                      </label>
                    </div>

                    {useCoins && coinPreview.allowed_coins > 0 && (
                      <div
                        style={{
                          marginTop: '12px',
                          paddingTop: '10px',
                          borderTop: '1px dashed rgba(212, 175, 55, 0.3)',
                          display: 'flex',
                          justify: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.85rem',
                          color: '#2ecc71',
                        }}
                      >
                        <span>✓ Redeeming {coinPreview.allowed_coins} coins</span>
                        <span style={{ fontWeight: 700 }}>-₹{coinPreview.coin_discount.toLocaleString()} Off</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '6px',
                      marginBottom: '25px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.85rem',
                      color: 'var(--beige)',
                    }}
                  >
                    <Coins size={18} style={{ color: 'var(--gold)' }} />
                    <span>You will earn <strong style={{ color: 'var(--gold)' }}>+{Math.floor(subtotal / 10)} Chovique Reward Coins</strong> on this order!</span>
                  </div>
                )}

                {/* Pricing totals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--beige)', fontSize: '0.9rem' }}>
                    <span>Items Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>

                  {appliedCoupon && discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71', fontSize: '0.9rem', fontWeight: 600 }}>
                      <span>Coupon Discount ({appliedCoupon.code}):</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {useCoins && coinDiscountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71', fontSize: '0.9rem', fontWeight: 600 }}>
                      <span>Coins Discount ({coinPreview.allowed_coins} coins):</span>
                      <span>-₹{coinDiscountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--beige)', fontSize: '0.9rem' }}>
                    <span>Delivery Charges:</span>
                    <span>{shippingFee === 0 ? 'Free (Order over ₹1,500)' : `₹${shippingFee}`}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cream)', fontSize: '1.25rem', fontWeight: 700, marginTop: '8px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span>Final Payable Amount:</span>
                    <span style={{ color: 'var(--gold)' }}>₹{total.toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="secondary" onClick={prevStep} disabled={isPlacingOrder}>
                    Back
                  </Button>
                  <Button
                    variant="gold"
                    onClick={nextStep}
                    glow
                    disabled={isPlacingOrder}
                    style={{ gap: '10px' }}
                  >
                    {isPlacingOrder ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Placing Order...
                      </>
                    ) : (
                      `Place Order (₹${total.toLocaleString()})`
                    )}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: PROCESSING LOADER */}
            {activeStep === 5 && (
              <motion.div
                key="step5"
                variants={scaleUp}
                initial="initial"
                animate="animate"
                exit="initial"
                style={{
                  textAlign: 'center',
                  padding: '80px 20px',
                  background: 'rgba(var(--dark-chocolate-rgb), 0.4)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '8px',
                }}
              >
                <Loader2
                  size={48}
                  style={{
                    color: 'var(--gold)',
                    margin: '0 auto 24px auto',
                    display: 'block',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--cream)', marginBottom: '10px' }}>
                  Processing Transaction...
                </h2>
                <p style={{ color: 'var(--beige)', maxWidth: '400px', margin: '0 auto' }}>
                  Securing payment credentials and lodging your artisan order inside our ledger. Please do not close the window.
                </p>
              </motion.div>
            )}

            {/* STEP 6: SUCCESS SCREEN */}
            {activeStep === 6 && createdOrder && (
              <motion.div
                key="step7"
                variants={scaleUp}
                initial="initial"
                animate="animate"
                style={{
                  textAlign: 'center',
                  padding: '60px 40px',
                  background: 'rgba(var(--dark-chocolate-rgb), 0.6)',
                  border: '1px solid var(--glass-border)',
                  boxShadow: 'var(--glass-shadow)',
                  borderRadius: '8px',
                }}
              >
                <CheckCircle size={64} style={{ color: '#2ecc71', margin: '0 auto 24px auto' }} />
                <h2
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '2.2rem',
                    color: 'var(--cream)',
                    marginBottom: '10px',
                  }}
                >
                  Order Lodged Successfully!
                </h2>
                <p style={{ color: 'var(--gold)', fontSize: '1.1rem', fontWeight: 600, marginBottom: '24px' }}>
                  Ticket Reference: {createdOrder.id}
                </p>
                <p style={{ color: 'var(--beige)', maxWidth: '500px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
                  Thank you for ordering with Chovique. Your chocolates are being prepared by hand and packaged in cooler-packs to ensure they reach you in immaculate form.
                </p>

                {createdOrder.coins_earned && createdOrder.coins_earned > 0 ? (
                  <div
                    style={{
                      maxWidth: '500px',
                      margin: '0 auto 30px auto',
                      padding: '12px 20px',
                      background: 'rgba(212, 175, 55, 0.15)',
                      border: '1px solid var(--gold)',
                      borderRadius: '6px',
                      color: 'var(--gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                    }}
                  >
                    <Coins size={20} />
                    <span>You earned <strong>+{createdOrder.coins_earned} Chovique Reward Coins</strong> on this purchase!</span>
                  </div>
                ) : null}

                {/* Invoice sheet */}
                <div
                  className="glass-panel"
                  style={{
                    padding: '24px',
                    textAlign: 'left',
                    marginBottom: '35px',
                    border: '1px solid var(--glass-border)',
                    background: 'rgba(0,0,0,0.2)',
                  }}
                >
                  <h4 style={{ color: 'var(--gold)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px', marginBottom: '12px', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Artisan Invoice Details
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.9rem', color: 'var(--cream)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--beige)' }}>Items total:</span>
                      <span>₹{createdOrder.subtotal.toLocaleString()}</span>
                    </div>
                    {createdOrder.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71' }}>
                        <span>Promo Discount:</span>
                        <span>-₹{createdOrder.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--beige)' }}>Shipping:</span>
                      <span>{createdOrder.shipping === 0 ? 'Free' : `₹${createdOrder.shipping}`}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '8px', fontSize: '1rem', color: 'var(--gold)' }}>
                      <span>Charged Total:</span>
                      <span>₹{createdOrder.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                  <Button variant="glass" onClick={() => window.print()}>
                    Print Invoice
                  </Button>
                  <Button variant="gold" onClick={() => navigate('/')} glow>
                    Return to Boutique
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default CheckoutPage;
