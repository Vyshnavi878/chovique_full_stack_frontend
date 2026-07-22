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
} from 'lucide-react';
import { useApp } from '../../app/providers';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Progress } from '../../components/ui/Progress';
import { pageTransition, scaleUp } from '../../lib/framer';
import { orderService } from '../../services/orderService';
import type { Order } from '../../types';

/** Coupon data passed from CartPage via sessionStorage */
interface CheckoutCouponData {
  code: string;
  discount_percent: number;
  discount_amount: number;
}

export const CheckoutPage: React.FC = () => {
  const { cart, user, placeOrderLocal } = useApp();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(1);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  // Redirect if cart is empty (only on steps 1–5, not success screen)
  useEffect(() => {
    if (cart.length === 0 && activeStep < 6) {
      navigate('/cart');
    }
  }, [cart, navigate, activeStep]);

  // Pre-fill shipping form from authenticated user's default address if available
  const [shippingForm, setShippingForm] = useState({
    name: user?.profile?.name || '',
    street: user?.profile?.address?.street || '',
    city: user?.profile?.address?.city || '',
    state: user?.profile?.address?.state || '',
    zip: user?.profile?.address?.zip || '',
    phone: user?.profile?.phone || '',
  });

  const [deliveryOption, setDeliveryOption] = useState('Standard Free Delivery');
  const [paymentMethod, setPaymentMethod] = useState('Credit Card');

  // Read coupon data from sessionStorage (set by CartPage)
  const couponData = (() => {
    try {
      const raw = sessionStorage.getItem('chovique_checkout_coupon');
      return raw ? (JSON.parse(raw) as CheckoutCouponData) : null;
    } catch {
      return null;
    }
  })();

  // Pricing calculations (display-only; backend recalculates authoritatively)
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = couponData?.discount_amount ?? 0;
  const shippingFee =
    deliveryOption === 'Same Day Delivery'
      ? 250
      : deliveryOption === 'Express Delivery'
      ? 150
      : 0;
  const total = subtotal - discountAmount + shippingFee;

  // Validate shipping form before proceeding from step 2
  const validateShipping = (): boolean => {
    const required = ['name', 'street', 'city', 'state', 'zip', 'phone'] as const;
    return required.every((field) => shippingForm[field].trim().length > 0);
  };

  const nextStep = async () => {
    if (activeStep === 2 && !validateShipping()) {
      return; // Fields are marked required; browser/custom validation handles UI
    }

    if (activeStep === 5) {
      // Place order via backend API
      setIsPlacingOrder(true);
      setOrderError('');
      setActiveStep(6); // Show processing screen immediately

      try {
        const payload = {
          items: cart.map((item) => ({
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
          ...(couponData ? { coupon_code: couponData.code } : {}),
        };

        const order = await orderService.placeOrder(payload);

        // Optimistic local state update after successful backend response
        placeOrderLocal(order);
        setCreatedOrder(order);

        // Clear coupon from sessionStorage after successful order
        sessionStorage.removeItem('chovique_checkout_coupon');

        setActiveStep(7);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'Failed to place order. Please try again.';
        setOrderError(message);
        setActiveStep(5); // Return to review step on failure
      } finally {
        setIsPlacingOrder(false);
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    setActiveStep((prev) => Math.max(1, prev - 1));
  };

  const stepsHeader = [
    { num: 1, label: 'Cart Review' },
    { num: 2, label: 'Shipping Address' },
    { num: 3, label: 'Delivery Options' },
    { num: 4, label: 'Payment Method' },
    { num: 5, label: 'Order Summary' },
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
        {/* Checkout Header steps indicator (Only for steps 1-5) */}
        {activeStep <= 5 && (
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
                  {st.num < 5 && <ChevronRight size={14} style={{ color: 'var(--grey-mid)' }} />}
                </div>
              ))}
            </div>
            <Progress value={activeStep} max={5} height={3} />
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
                  {cart.map((item) => (
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
                    Configure Delivery
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: DELIVERY OPTIONS */}
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
                  3. Select Delivery Method
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                  {[
                    { title: 'Standard Free Delivery', desc: 'Arrives in 3 - 5 business days.', price: 0 },
                    { title: 'Express Delivery', desc: 'Arrives in 1 - 2 business days. Dusted with cooler packs.', price: 150 },
                    { title: 'Same Day Delivery', desc: 'Instant local courier. Temperature regulated boxes. Orders before 2PM.', price: 250 },
                  ].map((opt) => (
                    <div
                      key={opt.title}
                      onClick={() => setDeliveryOption(opt.title)}
                      className="checkout-option-card"
                      style={{
                        background: deliveryOption === opt.title ? 'rgba(201, 168, 76, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                        border: deliveryOption === opt.title ? '1px solid var(--gold)' : '1px solid var(--glass-border)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <Truck size={20} style={{ color: deliveryOption === opt.title ? 'var(--gold)' : 'var(--beige)' }} />
                        <div>
                          <h4 style={{ color: 'var(--cream)', fontSize: '1rem', fontWeight: 600, margin: 0 }}>
                            {opt.title}
                          </h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--grey-light)' }}>{opt.desc}</span>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: 'var(--cream)', fontSize: '1rem' }}>
                        {opt.price === 0 ? 'Free' : `₹${opt.price}`}
                      </span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button variant="secondary" onClick={prevStep}>
                    Back
                  </Button>
                  <Button variant="gold" onClick={nextStep} glow>
                    Select Payment
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PAYMENT OPTIONS */}
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
                  4. Choose Payment Option
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

            {/* STEP 5: ORDER PREVIEW */}
            {activeStep === 5 && (
              <motion.div
                key="step5"
                variants={scaleUp}
                initial="initial"
                animate="animate"
                exit="initial"
                className="glass-panel"
                style={{ padding: '30px', border: '1px solid var(--glass-border)' }}
              >
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', color: 'var(--cream)', marginBottom: '20px' }}>
                  5. Review and Place Order
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
                      Preferences:
                    </h4>
                    <p style={{ color: 'var(--cream)', fontSize: '0.9rem', margin: 0, lineHeight: 1.5 }}>
                      <strong>Method:</strong> {deliveryOption}
                      <br />
                      <strong>Payment:</strong> {paymentMethod}
                    </p>
                  </div>
                </div>

                {/* Pricing totals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingBottom: '20px', borderBottom: '1px solid var(--glass-border)', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--beige)', fontSize: '0.9rem' }}>
                    <span>Items Subtotal:</span>
                    <span>₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#2ecc71', fontSize: '0.9rem' }}>
                      <span>Discount Applied:</span>
                      <span>-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--beige)', fontSize: '0.9rem' }}>
                    <span>Shipping Fee:</span>
                    <span>{shippingFee === 0 ? 'Free' : `₹${shippingFee}`}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cream)', fontSize: '1.2rem', fontWeight: 700, marginTop: '8px' }}>
                    <span>Total Amount:</span>
                    <span>₹{total.toLocaleString()}</span>
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

            {/* STEP 6: PROCESSING LOADER */}
            {activeStep === 6 && (
              <motion.div
                key="step6"
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

            {/* STEP 7: SUCCESS SCREEN */}
            {activeStep === 7 && createdOrder && (
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
                <p style={{ color: 'var(--beige)', maxWidth: '500px', margin: '0 auto 30px auto', lineHeight: 1.6 }}>
                  Thank you for ordering with Chovique. Your chocolates are being prepared by hand and packaged in cooler-packs to ensure they reach you in immaculate form.
                </p>

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
