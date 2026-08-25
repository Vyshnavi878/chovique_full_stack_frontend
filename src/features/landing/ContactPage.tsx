import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Package,
  Truck,
  RotateCcw,
  Gift,
  Gem,
  Headphones,
  Phone,
  MessageSquare,
  Mail,
  Clock,
  ShieldCheck,
  Sprout,
  Heart,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Footer } from '../../components/Footer';
import { slideInLeft, slideInRight } from '../../lib/framer';
import { apiPost } from '../../lib/api';

import { adminService } from '../../services/adminService';

export const ContactPage: React.FC = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    reason: '',
    orderNumber: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '');
      const el = document.getElementById(id);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.hash]);

  const [contactInfo, setContactInfo] = useState({
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    email: 'support@chovique.com',
    support_hours: 'Mon - Sat: 10:00 AM - 8:00 PM | Sunday: 11:00 AM - 6:00 PM',
  });

  useEffect(() => {
    adminService.getContactInfo()
      .then((res) => {
        if (res) {
          setContactInfo({
            phone: res.phone || '+91 98765 43210',
            whatsapp: res.whatsapp || res.phone || '+91 98765 43210',
            email: res.email || 'support@chovique.com',
            support_hours: res.support_hours || 'Mon - Sat: 10:00 AM - 8:00 PM | Sunday: 11:00 AM - 6:00 PM',
          });
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');

    try {
      await apiPost<{ message: string }>('/contact', {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        subject: formData.reason || 'General Support',
        message: `${formData.orderNumber ? `[Order #${formData.orderNumber}] ` : ''}${formData.message}`,
      });

      setSubmitted(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        reason: '',
        orderNumber: '',
        message: '',
      });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send message. Please try again.';
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const reasonOptions = [
    { value: '', label: 'Select a reason' },
    { value: 'Order Inquiry', label: 'Order Inquiry' },
    { value: 'Shipping & Delivery', label: 'Shipping & Delivery' },
    { value: 'Returns & Refunds', label: 'Returns & Refunds' },
    { value: 'Corporate & Bulk Gifting', label: 'Corporate & Bulk Gifting' },
    { value: 'Product Information', label: 'Product Information' },
    { value: 'Feedback / Other', label: 'Feedback / Other' },
  ];

  const helpCards = [
    {
      icon: Package,
      title: 'Track Your Order',
      desc: 'Check your order status',
    },
    {
      icon: Truck,
      title: 'Shipping Info',
      desc: 'Delivery timelines & locations',
    },
    {
      icon: RotateCcw,
      title: 'Returns & Refunds',
      desc: 'Easy returns & refund policy',
    },
    {
      icon: Gift,
      title: 'Corporate Gifting',
      desc: 'Bulk orders for businesses',
    },
    {
      icon: Gem,
      title: 'Product Enquiry',
      desc: 'Questions about our chocolates',
    },
    {
      icon: Headphones,
      title: 'General Support',
      desc: 'Any other assistance',
    },
  ];

  return (
    <div style={{ background: 'var(--black)', color: 'var(--cream)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* HERO SECTION */}
      <section
        style={{
          position: 'relative',
          padding: '95px 0 36px 0',
          background: 'linear-gradient(to bottom, rgba(20, 10, 5, 0.95), rgba(10, 10, 10, 1))',
        }}
      >
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '40px',
              alignItems: 'center',
            }}
          >
            {/* Left Content */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  letterSpacing: '3px',
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '12px',
                }}
              >
                CONTACT US
              </span>
              <h1
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                  color: 'var(--cream)',
                  margin: '0 0 16px 0',
                  lineHeight: 1.15,
                  fontWeight: 700,
                }}
              >
                We're Here to Help!
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)', marginBottom: '20px' }}>
                <Heart size={16} fill="currentColor" />
              </div>
              <p
                style={{
                  color: 'var(--beige)',
                  fontSize: '1.1rem',
                  lineHeight: 1.6,
                  maxWidth: '540px',
                  marginBottom: '35px',
                }}
              >
                Have questions about your order, our products, or gifting? Our team is here to make your chocolate
                experience smooth and delightful.
              </p>

              {/* 3 Pill Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    borderRadius: '50px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.88rem',
                    color: 'var(--cream)',
                  }}
                >
                  <Clock size={16} style={{ color: 'var(--gold)' }} />
                  <span>Replies within 24 Hours</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    borderRadius: '50px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.88rem',
                    color: 'var(--cream)',
                  }}
                >
                  <Headphones size={16} style={{ color: 'var(--gold)' }} />
                  <span>Dedicated Support</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 18px',
                    borderRadius: '50px',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--glass-border)',
                    fontSize: '0.88rem',
                    color: 'var(--cream)',
                  }}
                >
                  <ShieldCheck size={16} style={{ color: 'var(--gold)' }} />
                  <span>Reliable & Quick Assistance</span>
                </div>
              </div>
            </motion.div>

            {/* Right Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7 }}
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: 'var(--glass-shadow)',
                border: '1px solid var(--glass-border)',
                height: '380px',
                position: 'relative',
              }}
            >
              <img
                src="/assets/contact-hero.png"
                alt="Chovique Luxury Chocolates Gift Box"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/popular-bg.jpg';
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW CAN WE HELP YOU GRID */}
      <section style={{ padding: '36px 0', background: 'var(--black)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span
              style={{
                fontSize: '0.85rem',
                letterSpacing: '3px',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              HOW CAN WE HELP YOU?
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '20px',
            }}
          >
            {helpCards.map((card, idx) => {
              const IconComp = card.icon;
              return (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(201, 168, 76, 0.2)',
                    borderRadius: '10px',
                    padding: '24px 18px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                  }}
                  className="glass-panel-hover"
                >
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '8px',
                      background: 'rgba(201, 168, 76, 0.1)',
                      color: 'var(--gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 16px auto',
                    }}
                  >
                    <IconComp size={22} />
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--cream)', margin: '0 0 6px 0' }}>
                    {card.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--beige)', margin: 0, lineHeight: 1.4 }}>{card.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* MAIN 2-COLUMN SPLIT: FORM & SUPPORT CHANNELS */}
      <section id="send-us-a-message" style={{ padding: '36px 0 50px 0', background: 'var(--black)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '40px',
              alignItems: 'start',
            }}
          >
            {/* LEFT COLUMN: SEND US A MESSAGE FORM */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={slideInLeft}
              style={{
                background: 'rgba(20, 10, 5, 0.6)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '36px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  letterSpacing: '1px',
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  margin: '0 0 24px 0',
                }}
              >
                SEND US A MESSAGE
              </h3>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Input
                    label="First Name *"
                    placeholder="First Name *"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                  <Input
                    label="Last Name *"
                    placeholder="Last Name *"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Input
                    label="Email Address *"
                    type="email"
                    placeholder="Email Address *"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                  <Input
                    label="Phone Number (Optional)"
                    type="tel"
                    placeholder="Phone Number (Optional)"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <Select
                  label="Reason for Contact *"
                  options={reasonOptions}
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                />

                <Input
                  label="Order Number (Optional)"
                  placeholder="Order Number (Optional)"
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                />

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    marginBottom: '24px',
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  <label
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--beige)',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      fontWeight: 500,
                    }}
                  >
                    Your Message *
                  </label>
                  <textarea
                    placeholder="Your Message *"
                    required
                    rows={5}
                    maxLength={1000}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '4px',
                      color: 'var(--cream)',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'none',
                    }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--grey-light)', textAlign: 'right' }}>
                    {formData.message.length}/1000
                  </span>
                </div>

                {submitError && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      background: 'rgba(231, 76, 60, 0.15)',
                      border: '1px solid rgba(231, 76, 60, 0.4)',
                      borderRadius: '4px',
                      color: '#e74c3c',
                      padding: '12px 14px',
                      marginBottom: '16px',
                      fontSize: '0.88rem',
                    }}
                  >
                    <AlertCircle size={16} />
                    <span>{submitError}</span>
                  </div>
                )}

                {submitted ? (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      background: 'rgba(46, 204, 113, 0.2)',
                      border: '1px solid #2ecc71',
                      borderRadius: '4px',
                      color: '#2ecc71',
                      padding: '14px',
                      fontWeight: 600,
                    }}
                  >
                    <CheckCircle size={20} />
                    <span>Message Sent Successfully!</span>
                  </div>
                ) : (
                  <Button variant="gold" fullWidth type="submit" disabled={submitting} glow>
                    {submitting ? 'Sending...' : 'SEND MESSAGE'} <ArrowRight size={16} style={{ marginLeft: '6px' }} />
                  </Button>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    color: 'var(--beige)',
                    marginTop: '16px',
                  }}
                >
                  <Lock size={12} />
                  <span>Your information is safe with us. We never share your details.</span>
                </div>
              </form>
            </motion.div>

            {/* RIGHT COLUMN: CUSTOMER SUPPORT CHANNELS */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={slideInRight}
              style={{
                background: 'rgba(20, 10, 5, 0.6)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '36px',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.4rem',
                  letterSpacing: '1px',
                  color: 'var(--gold)',
                  textTransform: 'uppercase',
                  margin: '0 0 6px 0',
                }}
              >
                CUSTOMER SUPPORT
              </h3>
              <p style={{ color: 'var(--beige)', fontSize: '0.9rem', marginBottom: '30px' }}>
                We're available to help you on the channels below.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Call Us */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'rgba(201, 168, 76, 0.15)',
                      color: 'var(--gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Phone size={20} />
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--cream)', fontSize: '1rem', fontWeight: 600, margin: '0 0 2px 0' }}>
                      Call Us
                    </h5>
                    <p style={{ color: 'var(--gold)', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 2px 0' }}>
                      {contactInfo.phone}
                    </p>
                    <p style={{ color: 'var(--grey-light)', fontSize: '0.8rem', margin: 0 }}>
                      {contactInfo.support_hours}
                    </p>
                  </div>
                </div>

                {/* WhatsApp Us */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'rgba(46, 204, 113, 0.15)',
                      color: '#2ecc71',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MessageSquare size={20} />
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--cream)', fontSize: '1rem', fontWeight: 600, margin: '0 0 2px 0' }}>
                      WhatsApp Us
                    </h5>
                    <p style={{ color: '#2ecc71', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 2px 0' }}>
                      {contactInfo.whatsapp}
                    </p>
                    <p style={{ color: 'var(--grey-light)', fontSize: '0.8rem', margin: 0 }}>
                      {contactInfo.support_hours}
                    </p>
                  </div>
                </div>

                {/* Email Us */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'rgba(201, 168, 76, 0.15)',
                      color: 'var(--gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={20} />
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--cream)', fontSize: '1rem', fontWeight: 600, margin: '0 0 2px 0' }}>
                      Email Us
                    </h5>
                    <p style={{ color: 'var(--gold)', fontSize: '0.95rem', fontWeight: 600, margin: '0 0 2px 0' }}>
                      {contactInfo.email}
                    </p>
                    <p style={{ color: 'var(--grey-light)', fontSize: '0.8rem', margin: 0 }}>Replies within 24 hours</p>
                  </div>
                </div>

                {/* Support Hours */}
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'rgba(201, 168, 76, 0.15)',
                      color: 'var(--gold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Clock size={20} />
                  </div>
                  <div>
                    <h5 style={{ color: 'var(--cream)', fontSize: '1rem', fontWeight: 600, margin: '0 0 2px 0' }}>
                      Support Hours
                    </h5>
                    <p style={{ color: 'var(--beige)', fontSize: '0.85rem', margin: '0 0 2px 0' }}>
                      {contactInfo.support_hours}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
