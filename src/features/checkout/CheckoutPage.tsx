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
import { userService } from '../../services/userService';
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

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const CheckoutPage: React.FC = () => {
  const { cart, user, wallet, refreshWallet, placeOrderLocal, storeConfig } = useApp();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Coins redemption state
  const [coinsToUse, setCoinsToUse] = useState(0);
  const [coinPreview, setCoinPreview] = useState<{
    allowed_coins: number;
    coin_discount: number;
    max_usable_coins: number;
    message: string;
  }>({ allowed_coins: 0, coin_discount: 0, max_usable_coins: 0, message: '' });

  // The checkout items to display and place order for (uses full cart infrastructure)
  const checkoutItems = cart;

  // Redirect if checkout items list is empty (only on steps 1–5, not success screen)
  useEffect(() => {
    if (checkoutItems.length === 0 && activeStep < 6) {
      navigate('/cart');
    }
  }, [checkoutItems, navigate, activeStep]);

  // Pre-fill shipping form from authenticated user's default address if available
  const [shippingForm, setShippingForm] = useState({
    name: user?.profile?.name || user?.name || '',
    street: '',
    city: '',
    state: '',
    zip: '',
    phone: user?.profile?.phone || '',
  });

  // Fetch the user's addresses and populate the default one
  useEffect(() => {
    if (user && user.role !== 'guest') {
      userService.getAddresses().then((addrs) => {
        if (addrs && addrs.length > 0) {
          const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
          setShippingForm(prev => ({
            ...prev,
            name: defaultAddr.name || prev.name,
            street: defaultAddr.street,
            city: defaultAddr.city,
            state: defaultAddr.state,
            zip: defaultAddr.zip,
            phone: defaultAddr.phone || prev.phone,
          }));
        }
      }).catch(console.error);
    }
  }, [user]);

  const [deliveryOption, setDeliveryOption] = useState('Standard Delivery');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [paymentError, setPaymentError] = useState('');

  // Shipping form validation errors
  const [shippingErrors, setShippingErrors] = useState<{
    name?: string;
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone?: string;
  }>({});

  // Coupon state: read initial coupon from sessionStorage or allow applying/removing directly
  const [appliedCoupon, setAppliedCoupon] = useState<CheckoutCouponData | null>(() => {
    try {
      const raw = sessionStorage.getItem('chovique_checkout_coupon');
      return raw ? (JSON.parse(raw) as CheckoutCouponData) : null;
    } catch {
      return null;
    }
  });

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  useEffect(() => {
    if (user && user.role !== 'guest') {
      cartService
        .getAvailableCoupons()
        .then((coupons) => {
          const eligible = (coupons || []).filter(
            (c: any) =>
              c.is_active !== false &&
              c.status !== 'Used' &&
              c.status !== 'USED' &&
              c.status !== 'Expired' &&
              c.status !== 'EXPIRED' &&
              c.status !== 'Not Available'
          );
          setAvailableCoupons(eligible);
        })
        .catch(() => {});
    }
  }, [user]);

  // Pricing calculations (display-only; backend recalculates authoritatively)
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = appliedCoupon?.discount_amount ?? 0;

  // Re-validate applied coupon against backend whenever items or subtotal changes
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.code && checkoutItems.length > 0) {
      cartService
        .validateCoupon(appliedCoupon.code)
        .then((res) => {
          if (res.valid) {
            const discountVal = res.calculated_discount ?? (
              res.discount_percent
                ? Math.round(subtotal * (res.discount_percent / 100) * 100) / 100
                : (res.discount_amount ?? 0)
            );
            const updatedPayload: CheckoutCouponData = {
              code: res.code || appliedCoupon.code,
              discount_percent: res.discount_percent || 0,
              discount_amount: discountVal,
            };
            setAppliedCoupon(updatedPayload);
            sessionStorage.setItem('chovique_checkout_coupon', JSON.stringify(updatedPayload));
            setCouponError('');
          } else {
            setAppliedCoupon(null);
            sessionStorage.removeItem('chovique_checkout_coupon');
            setCouponError(res.message || 'Selected coupon is no longer applicable to your cart.');
          }
        })
        .catch(() => {});
    }
  }, [checkoutItems, subtotal]);

  // Calculate coin redemption when coinsToUse, wallet, subtotal, or coupon changes
  useEffect(() => {
    if (wallet && wallet.coin_balance > 0 && coinsToUse > 0) {
      walletService
        .calculateRedemption({
          subtotal,
          coupon_discount: discountAmount,
          coins_to_use: coinsToUse,
        })
        .then((res) => {
          setCoinPreview(res);
        })
        .catch(() => {
          setCoinPreview({ allowed_coins: 0, coin_discount: 0, max_usable_coins: 0, message: 'Available reward coins are insufficient for redemption on this order.' });
        });
    } else {
      setCoinPreview({ allowed_coins: 0, coin_discount: 0, max_usable_coins: 0, message: '' });
    }
  }, [wallet, coinsToUse, subtotal, discountAmount]);

  const coinsPerRupee = wallet?.settings?.coins_per_rupee || 10;
  const coinDiscountAmount =
    coinsToUse > 0
      ? (coinPreview.coin_discount > 0
          ? coinPreview.coin_discount
          : Math.round((coinsToUse / coinsPerRupee) * 100) / 100)
      : 0;
  
  // Shipping
  const freeShippingMin = storeConfig?.free_shipping_min_order ?? 500;
  const standardShipping = storeConfig?.standard_shipping_charge ?? 50;
  const shippingFee = (freeShippingMin > 0 && subtotal >= freeShippingMin) || subtotal === 0 ? 0 : standardShipping;

  // Tax
  const gstRate = storeConfig?.gst_rate ?? 0;
  const taxAmount = Math.round(subtotal * (gstRate / 100) * 100) / 100;

  // Total
  const total = Math.max(0, subtotal - discountAmount - coinDiscountAmount + shippingFee + taxAmount);

  const formatCouponExpiry = (rawExp: any): string => {
    if (!rawExp) return '';
    const strVal = String(rawExp).trim();
    if (!strVal || strVal.toLowerCase() === 'no expiry' || strVal.toLowerCase() === 'none' || strVal.toLowerCase() === 'null' || strVal.toLowerCase() === 'undefined') {
      return '';
    }

    const matchYMD = strVal.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matchYMD) {
      const [, y, m, d] = matchYMD;
      return `${d}-${m}-${y}`;
    }

    const matchDMY = strVal.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (matchDMY) {
      return `${matchDMY[1]}-${matchDMY[2]}-${matchDMY[3]}`;
    }

    const matchSlashDMY = strVal.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
    if (matchSlashDMY) {
      const [, d, m, y] = matchSlashDMY;
      return `${d}-${m}-${y}`;
    }

    const matchSlashYMD = strVal.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
    if (matchSlashYMD) {
      const [, y, m, d] = matchSlashYMD;
      return `${d}-${m}-${y}`;
    }

    try {
      const d = new Date(rawExp);
      if (!isNaN(d.getTime())) {
        const day = String(d.getUTCDate()).padStart(2, '0');
        const month = String(d.getUTCMonth() + 1).padStart(2, '0');
        const year = d.getUTCFullYear();
        return `${day}-${month}-${year}`;
      }
    } catch {
      // fallback
    }

    return strVal;
  };

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponError('');
    setIsCouponLoading(true);

    try {
      const formatted = couponCode.trim().toUpperCase();
      const result = await cartService.validateCoupon(formatted);
      if (result.valid) {
        const discountVal = result.calculated_discount ?? (
          result.discount_percent
            ? Math.round(subtotal * (result.discount_percent / 100) * 100) / 100
            : (result.discount_amount ?? 0)
        );
        const couponPayload: CheckoutCouponData = {
          code: result.code || formatted,
          discount_percent: result.discount_percent || 0,
          discount_amount: discountVal,
        };
        setAppliedCoupon(couponPayload);
        sessionStorage.setItem('chovique_checkout_coupon', JSON.stringify(couponPayload));
        setCouponCode('');
      } else {
        setCouponError(result.message || 'Invalid coupon code.');
      }
    } catch {
      setCouponError('Could not validate coupon. Please try again.');
    } finally {
      setIsCouponLoading(false);
    }
  };

  const handleUseAvailableCoupon = async (code: string) => {
    const formatted = code.trim().toUpperCase();
    setCouponCode(formatted);
    setCouponError('');
    setIsCouponLoading(true);

    try {
      const result = await cartService.validateCoupon(formatted);
      if (result.valid) {
        const discountVal = result.calculated_discount ?? (
          result.discount_percent
            ? Math.round(subtotal * (result.discount_percent / 100) * 100) / 100
            : (result.discount_amount ?? 0)
        );
        const couponPayload: CheckoutCouponData = {
          code: result.code || formatted,
          discount_percent: result.discount_percent || 0,
          discount_amount: discountVal,
        };
        setAppliedCoupon(couponPayload);
        sessionStorage.setItem('chovique_checkout_coupon', JSON.stringify(couponPayload));
        setCouponCode('');
      } else {
        setCouponError(result.message || 'Invalid coupon code.');
      }
    } catch {
      setCouponError('Could not validate coupon. Please try again.');
    } finally {
      setIsCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
    sessionStorage.removeItem('chovique_checkout_coupon');
  };

  // Validate shipping form before proceeding from step 2
  const validateShipping = (): boolean => {
    const errors: typeof shippingErrors = {};
    const name = shippingForm.name.trim();
    const street = shippingForm.street.trim();
    const city = shippingForm.city.trim();
    const state = shippingForm.state.trim();
    const zip = shippingForm.zip.trim();
    const phone = shippingForm.phone.trim();

    if (!name) errors.name = 'Full name is required.';
    if (!street) errors.street = 'Street address is required.';
    if (!city) errors.city = 'City is required.';
    if (!state) errors.state = 'State is required.';

    if (!zip) {
      errors.zip = 'ZIP code is required.';
    } else if (!/^\d{6}$/.test(zip)) {
      errors.zip = 'ZIP/PIN code must contain exactly 6 numeric digits.';
    }

    if (!phone) {
      errors.phone = 'Phone number is required.';
    } else if (!/^\d{10}$/.test(phone)) {
      errors.phone = 'Phone number must contain exactly 10 numeric digits.';
    }

    setShippingErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = async () => {
    if (activeStep === 2) {
      if (!validateShipping()) return;
    }

    if (activeStep === 3) {
      if (!paymentMethod) {
        setPaymentError('Please select a payment method before proceeding.');
        return;
      }
      setPaymentError('');
    }

    if (activeStep === 4) {
      setIsPlacingOrder(true);
      setOrderError('');

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
        coins_to_use: coinsToUse > 0 ? coinsToUse : 0,
      };

      const isCod = ['Cash on Delivery', 'COD', 'Cash On Delivery'].includes(paymentMethod);

      if (isCod) {
        setActiveStep(5); // Processing screen
        try {
          const order = await orderService.placeOrder(orderPayload);
          if (!order || !order.id) {
            throw new Error('Order creation failed. No confirmation received.');
          }
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

      // Online Payment Flow (Razorpay / Card / UPI / NetBanking)
      try {
        const initData = await orderService.initiateCheckout(orderPayload);
        if (!initData || !initData.razorpay_order_id) {
          throw new Error('Failed to initiate online payment session.');
        }

        const isLoaded = await loadRazorpayScript();
        if (!isLoaded || !window.Razorpay) {
          throw new Error('Razorpay SDK failed to load. Please check your network connection.');
        }

        const options = {
          key: initData.key_id,
          amount: initData.amount,
          currency: initData.currency || 'INR',
          name: 'CHOVIQUE',
          description: `Order #${initData.order_id}`,
          order_id: initData.razorpay_order_id,
          prefill: {
            name: shippingForm.name,
            contact: shippingForm.phone,
          },
          theme: {
            color: '#1a100c',
          },
          handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
            setActiveStep(5); // Show processing screen during verification
            try {
              const verifyRes = await orderService.verifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                order_id: initData.order_id,
              });

              if (!verifyRes.success) {
                throw new Error(verifyRes.message || 'Payment verification failed.');
              }

              const confirmedOrder = await orderService.getOrder(initData.order_id);
              placeOrderLocal(confirmedOrder);
              setCreatedOrder(confirmedOrder);
              refreshWallet();
              sessionStorage.removeItem('chovique_checkout_coupon');
              sessionStorage.removeItem('chovique_buy_now_item');
              setActiveStep(6);
            } catch (vErr: unknown) {
              const msg = vErr instanceof Error ? vErr.message : 'Payment verification failed.';
              setOrderError(msg);
              setActiveStep(4);
            } finally {
              setIsPlacingOrder(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsPlacingOrder(false);
              setOrderError('Payment session was cancelled. You can try again.');
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to initiate payment. Please try again.';
        setOrderError(message);
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
            {/* STEP 1: REVIEW ITEMS & DISCOUNTS */}
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

                {/* Promo Code Entry & Available Coupons Section */}
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
                      {/* Manual Promo Code input */}
                      <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px', marginBottom: couponError ? '8px' : '20px' }}>
                        <div style={{ flex: 1 }}>
                          <Input
                            value={couponCode}
                            onChange={(e) => {
                              setCouponCode(e.target.value);
                              if (couponError) setCouponError('');
                            }}
                            placeholder="Enter promo code"
                            style={{ textTransform: 'uppercase', height: '42px', width: '100%' }}
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="gold"
                          disabled={isCouponLoading || !couponCode.trim()}
                          style={{ whiteSpace: 'nowrap', minWidth: '90px', height: '42px' }}
                        >
                          {isCouponLoading ? <Loader2 size={16} className="animate-spin" /> : 'APPLY'}
                        </Button>
                      </form>

                      {couponError && (
                        <p style={{ color: '#e74c3c', fontSize: '0.8rem', margin: '0 0 15px 0' }}>{couponError}</p>
                      )}

                      {/* Available Coupons list */}
                      {availableCoupons.length > 0 && (
                        <div style={{ marginBottom: '20px', background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <h4 style={{ color: 'var(--gold)', fontSize: '0.9rem', marginBottom: '10px', marginTop: 0 }}>Available Coupons</h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {availableCoupons.map((c) => {
                              const rawExp = c.expires_at || c.expiryDate || c.expiry_date || c.expiresAt || c.end_date || c.exp;
                              const expFormatted = formatCouponExpiry(rawExp);
                              const desc = c.description || (c.name && c.name !== c.code ? c.name : (c.discount_percent ? `Get ${c.discount_percent}% off on your chocolate order` : ''));
                              return (
                                <div key={c.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div>
                                    <div style={{ fontWeight: 'bold', color: 'var(--cream)', fontSize: '0.9rem' }}>{c.code}</div>
                                    {desc && <div style={{ fontSize: '0.8rem', color: 'var(--beige)' }}>{desc}</div>}
                                    {expFormatted && (
                                      <div style={{ fontSize: '0.72rem', color: 'var(--gold)', marginTop: '2px' }}>
                                        Expires: {expFormatted}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleUseAvailableCoupon(c.code)}
                                    disabled={isCouponLoading}
                                    style={{ fontSize: '0.8rem', color: 'var(--gold)', background: 'none', border: '1px solid var(--gold)', borderRadius: '4px', padding: '3px 10px', cursor: 'pointer', fontWeight: 600 }}
                                  >
                                    Use
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Rewards Panel */}
                {wallet && wallet.coin_balance > 0 ? (() => {
                  const coinsPerRupeeVal = wallet.settings?.coins_per_rupee || 10;
                  const maxRedemptionPct = wallet.settings?.max_redemption_percentage || 20;
                  const eligibleSubtotal = Math.max(0, subtotal - discountAmount);
                  const maxDiscountAllowed = eligibleSubtotal * (maxRedemptionPct / 100);
                  const maxUsableForOrder = Math.min(wallet.coin_balance, Math.floor(maxDiscountAllowed * coinsPerRupeeVal));
                  const availableRupeeVal = (wallet.coin_balance / coinsPerRupeeVal).toFixed(2);
                  const currentCoinDiscount = coinsToUse > 0 ? (coinsToUse / coinsPerRupeeVal) : 0;

                  return (
                    <div
                      style={{
                        padding: '18px 20px',
                        background: 'rgba(212, 175, 55, 0.08)',
                        border: '1px solid var(--gold)',
                        borderRadius: '6px',
                        marginBottom: '25px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Coins size={24} style={{ color: 'var(--gold)' }} />
                          <div>
                            <h4 style={{ color: 'var(--cream)', margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>
                              Chovique Reward Coins
                            </h4>
                            <p style={{ color: 'var(--beige)', fontSize: '0.82rem', margin: '2px 0 0 0' }}>
                              Available: <strong style={{ color: 'var(--gold)' }}>{wallet.coin_balance} Coins</strong> (₹{availableRupeeVal} discount value)
                            </p>
                          </div>
                        </div>
                      </div>

                      <div style={{ paddingTop: '12px', borderTop: '1px dashed rgba(212, 175, 55, 0.3)' }}>
                        <label style={{ display: 'block', color: 'var(--cream)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                          Redeem Coins
                        </label>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(201, 168, 76, 0.4)', borderRadius: '6px', overflow: 'hidden' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = Math.max(0, coinsToUse - 1);
                                setCoinsToUse(nextVal);
                              }}
                              disabled={coinsToUse <= 0}
                              style={{
                                width: '36px',
                                height: '36px',
                                background: 'transparent',
                                border: 'none',
                                color: coinsToUse <= 0 ? 'rgba(255,255,255,0.2)' : 'var(--gold)',
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                cursor: coinsToUse <= 0 ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Decrease coins"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={maxUsableForOrder}
                              value={coinsToUse === 0 ? '0' : coinsToUse}
                              onChange={(e) => {
                                const raw = e.target.value;
                                if (raw === '') {
                                  setCoinsToUse(0);
                                  return;
                                }
                                const parsed = parseInt(raw, 10);
                                if (isNaN(parsed) || parsed < 0) {
                                  setCoinsToUse(0);
                                } else if (parsed > maxUsableForOrder) {
                                  setCoinsToUse(maxUsableForOrder);
                                } else {
                                  setCoinsToUse(parsed);
                                }
                              }}
                              style={{
                                width: '60px',
                                height: '36px',
                                background: 'transparent',
                                border: 'none',
                                textAlign: 'center',
                                color: 'var(--cream)',
                                fontSize: '0.95rem',
                                fontWeight: 700,
                                outline: 'none',
                                MozAppearance: 'textfield',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const nextVal = Math.min(maxUsableForOrder, coinsToUse + 1);
                                setCoinsToUse(nextVal);
                              }}
                              disabled={coinsToUse >= maxUsableForOrder}
                              style={{
                                width: '36px',
                                height: '36px',
                                background: 'transparent',
                                border: 'none',
                                color: coinsToUse >= maxUsableForOrder ? 'rgba(255,255,255,0.2)' : 'var(--gold)',
                                fontSize: '1.2rem',
                                fontWeight: 700,
                                cursor: coinsToUse >= maxUsableForOrder ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Increase coins"
                            >
                              +
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => setCoinsToUse(maxUsableForOrder)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              background: 'rgba(201, 168, 76, 0.15)',
                              border: '1px solid rgba(201, 168, 76, 0.35)',
                              color: 'var(--gold)',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: 600,
                            }}
                          >
                            Use Max ({maxUsableForOrder})
                          </button>

                          {coinsToUse > 0 && (
                            <button
                              type="button"
                              onClick={() => setCoinsToUse(0)}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                background: 'transparent',
                                border: '1px solid rgba(255, 255, 255, 0.2)',
                                color: 'var(--beige)',
                                borderRadius: '4px',
                                cursor: 'pointer',
                              }}
                            >
                              Clear
                            </button>
                          )}
                        </div>

                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.82rem' }}>
                          <div style={{ color: 'var(--beige)' }}>
                            Maximum usable: <strong style={{ color: 'var(--cream)' }}>{maxUsableForOrder} Coins</strong>
                          </div>

                          {coinsToUse > 0 && (
                            <div style={{ color: '#2ecc71', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                              <span>Discount from coins: ₹{currentCoinDiscount.toFixed(2)}</span>
                            </div>
                          )}

                          {coinPreview.message && coinPreview.message !== 'Reward coins cannot be applied to this order.' && (
                            <div style={{ color: coinPreview.allowed_coins > 0 ? 'var(--gold)' : '#e74c3c', fontSize: '0.8rem', marginTop: '2px' }}>
                              {coinPreview.message}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })() : (
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

                {/* Step 1 Pricing totals */}
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

                  {coinsToUse > 0 && coinDiscountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71', fontSize: '0.9rem', fontWeight: 600 }}>
                      <span>Coins Discount ({coinsToUse} coins):</span>
                      <span>-₹{coinDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--beige)', fontSize: '0.9rem' }}>
                    <span>Delivery Charges:</span>
                    <span>{shippingFee === 0 ? `Free (Order over ₹${freeShippingMin.toLocaleString()})` : `₹${shippingFee}`}</span>
                  </div>

                  {taxAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--beige)', fontSize: '0.9rem' }}>
                      <span>Tax (GST):</span>
                      <span>₹{taxAmount.toLocaleString()}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cream)', fontSize: '1.25rem', fontWeight: 700, marginTop: '8px', paddingTop: '10px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span>Total:</span>
                    <span style={{ color: 'var(--gold)' }}>₹{total.toLocaleString()}</span>
                  </div>
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
                    onChange={(e) => {
                      setShippingForm({ ...shippingForm, name: e.target.value });
                      if (shippingErrors.name) setShippingErrors({ ...shippingErrors, name: undefined });
                    }}
                    error={shippingErrors.name}
                    required
                    autoComplete="name"
                  />
                  <Input
                    label="Street Address"
                    value={shippingForm.street}
                    onChange={(e) => {
                      setShippingForm({ ...shippingForm, street: e.target.value });
                      if (shippingErrors.street) setShippingErrors({ ...shippingErrors, street: undefined });
                    }}
                    error={shippingErrors.street}
                    required
                    autoComplete="street-address"
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Input
                      label="City"
                      value={shippingForm.city}
                      onChange={(e) => {
                        setShippingForm({ ...shippingForm, city: e.target.value });
                        if (shippingErrors.city) setShippingErrors({ ...shippingErrors, city: undefined });
                      }}
                      error={shippingErrors.city}
                      required
                      autoComplete="address-level2"
                    />
                    <Input
                      label="State"
                      value={shippingForm.state}
                      onChange={(e) => {
                        setShippingForm({ ...shippingForm, state: e.target.value });
                        if (shippingErrors.state) setShippingErrors({ ...shippingErrors, state: undefined });
                      }}
                      error={shippingErrors.state}
                      required
                      autoComplete="address-level1"
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <Input
                      label="ZIP Code"
                      value={shippingForm.zip}
                      onChange={(e) => {
                        setShippingForm({ ...shippingForm, zip: e.target.value });
                        if (shippingErrors.zip) setShippingErrors({ ...shippingErrors, zip: undefined });
                      }}
                      error={shippingErrors.zip}
                      required
                      autoComplete="postal-code"
                    />
                    <Input
                      label="Phone Number"
                      type="tel"
                      value={shippingForm.phone}
                      onChange={(e) => {
                        setShippingForm({ ...shippingForm, phone: e.target.value });
                        if (shippingErrors.phone) setShippingErrors({ ...shippingErrors, phone: undefined });
                      }}
                      error={shippingErrors.phone}
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
                {paymentError && (
                  <p style={{ color: '#e74c3c', fontSize: '0.85rem', marginBottom: '15px' }}>{paymentError}</p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                  {['Credit Card', 'UPI / Google Pay', 'Net Banking', 'Cash on Delivery'].map((method) => (
                    <div
                      key={method}
                      onClick={() => {
                        setPaymentMethod(method);
                        if (paymentError) setPaymentError('');
                      }}
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

            {/* STEP 4: READ-ONLY ORDER PREVIEW & PLACE ORDER */}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
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
                      <strong>Delivery Charge:</strong> {shippingFee === 0 ? 'Free Standard Delivery' : `Standard Delivery (₹${shippingFee})`}
                    </p>
                  </div>
                </div>

                {/* READ-ONLY Pricing summary displaying Step 1 choices */}
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

                  {coinsToUse > 0 && coinDiscountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71', fontSize: '0.9rem', fontWeight: 600 }}>
                      <span>Coins Discount ({coinsToUse} coins):</span>
                      <span>-₹{coinDiscountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--beige)', fontSize: '0.9rem' }}>
                    <span>Delivery Charges:</span>
                    <span>{shippingFee === 0 ? `Free (Order over ₹${freeShippingMin.toLocaleString()})` : `₹${shippingFee}`}</span>
                  </div>

                  {taxAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--beige)', fontSize: '0.9rem' }}>
                      <span>Tax (GST):</span>
                      <span>₹{taxAmount.toLocaleString()}</span>
                    </div>
                  )}

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
                    {(createdOrder.coupon_discount || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71' }}>
                        <span>Coupon Discount:</span>
                        <span>-₹{createdOrder.coupon_discount?.toLocaleString()}</span>
                      </div>
                    )}
                    {(createdOrder.coin_discount || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71' }}>
                        <span>Coin Discount:</span>
                        <span>-₹{createdOrder.coin_discount?.toLocaleString()}</span>
                      </div>
                    )}
                    {(createdOrder.discount > 0 && !createdOrder.coupon_discount && !createdOrder.coin_discount) && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71' }}>
                        <span>Promo Discount:</span>
                        <span>-₹{createdOrder.discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--beige)' }}>Shipping:</span>
                      <span>{createdOrder.shipping === 0 ? 'Free' : `₹${createdOrder.shipping}`}</span>
                    </div>
                    {(createdOrder.tax || 0) > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--beige)' }}>Tax (GST):</span>
                        <span>₹{createdOrder.tax.toLocaleString()}</span>
                      </div>
                    )}
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
