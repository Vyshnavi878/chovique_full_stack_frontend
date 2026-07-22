import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, CheckCircle, Clock } from 'lucide-react';
import { Input, Select } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { slideInLeft, slideInRight } from '../../lib/framer';

export const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    // Simulate submission
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
      setTimeout(() => setSubmitted(false), 4000);
    }, 1800);
  };

  const subjectOptions = [
    { value: '', label: 'Select a subject' },
    { value: 'order', label: 'Order Inquiry' },
    { value: 'custom', label: 'Custom / Bulk Orders' },
    { value: 'corporate', label: 'Corporate Gifting' },
    { value: 'feedback', label: 'Feedback' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <div style={{ background: 'var(--black)', color: 'var(--cream)', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Hero Header */}
      <section
        style={{
          position: 'relative',
          padding: '160px 0 100px 0',
          background: 'linear-gradient(rgba(var(--dark-chocolate-rgb), 0.75), rgba(10, 10, 10, 1)), url("https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=1600&q=80")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          textAlign: 'center',
        }}
      >
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="section-label" style={{ justifySelf: 'center', justifyContent: 'center' }}>Connect With Us</span>
            <h1 className="section-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', marginBottom: '16px' }}>
              Contact <span className="gold">Chovique</span>
            </h1>
            <p style={{ fontFamily: 'var(--font-elegant)', fontSize: '1.4rem', color: 'var(--beige)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
              Reach out to our chocolate ateliers for custom collections, inquiries, or support.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Content & Map */}
      <section style={{ padding: '80px 0', background: 'var(--gradient-section-7)' }}>
        <div className="container">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '60px',
              alignItems: 'start',
            }}
          >
            {/* Left Column: Contact Form */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={slideInLeft}
              className="glass-panel"
              style={{
                padding: '40px',
                border: '1px solid var(--glass-border)',
                background: 'rgba(var(--dark-chocolate-rgb), 0.45)',
                borderRadius: '12px',
                boxShadow: 'var(--glass-shadow)',
              }}
            >
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.8rem',
                  color: 'var(--cream)',
                  marginBottom: '8px',
                }}
              >
                Send Us a Message
              </h3>
              <p style={{ color: 'var(--grey-light)', fontSize: '0.95rem', marginBottom: '30px' }}>
                Fill out the form below and one of our dedicated chocolatiers will get back to you within 24 hours.
              </p>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <Input
                    label="First Name"
                    placeholder="First name"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  />
                  <Input
                    label="Last Name"
                    placeholder="Last name"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  />
                </div>

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />

                <Input
                  label="Phone Number"
                  type="tel"
                  placeholder="+91 XXXXX XXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />

                <Select
                  label="Subject"
                  options={subjectOptions}
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
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
                    Your Message
                  </label>
                  <textarea
                    placeholder="Describe your request..."
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(var(--dark-chocolate-rgb), 0.4)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '4px',
                      color: 'var(--cream)',
                      fontFamily: 'inherit',
                      fontSize: '0.95rem',
                      outline: 'none',
                      resize: 'none',
                      transition: 'border-color 0.3s ease',
                    }}
                  />
                </div>

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
                    {submitting ? 'Sending...' : 'Send Message'}
                  </Button>
                )}
              </form>
            </motion.div>

            {/* Right Column: Address Details & Map */}
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={slideInRight}
              style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}
            >
              <div
                className="glass-panel"
                style={{
                  padding: '40px',
                  border: '1px solid var(--glass-border)',
                  background: 'rgba(var(--dark-chocolate-rgb), 0.3)',
                  borderRadius: '12px',
                }}
              >
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.6rem',
                    color: 'var(--cream)',
                    marginBottom: '24px',
                  }}
                >
                  Visit Our Atelier
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--gold)', marginTop: '4px' }}>
                      <MapPin size={22} />
                    </div>
                    <div>
                      <h5 style={{ color: 'var(--cream)', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 6px 0' }}>
                        Chovique Chocolate Atelier
                      </h5>
                      <p style={{ color: 'var(--grey-light)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                        42, MG Road, Indiranagar
                        <br />
                        Bangalore, Karnataka 560038
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--gold)', marginTop: '4px' }}>
                      <Clock size={22} />
                    </div>
                    <div>
                      <h5 style={{ color: 'var(--cream)', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 6px 0' }}>
                        Atelier Hours
                      </h5>
                      <p style={{ color: 'var(--grey-light)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                        Monday - Saturday: 10:00 AM - 08:00 PM
                        <br />
                        Sunday: 11:00 AM - 06:00 PM
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                    <div style={{ color: 'var(--gold)', marginTop: '4px' }}>
                      <Phone size={22} />
                    </div>
                    <div>
                      <h5 style={{ color: 'var(--cream)', fontSize: '1.05rem', fontWeight: 600, margin: '0 0 6px 0' }}>
                        Direct Contact
                      </h5>
                      <p style={{ color: 'var(--grey-light)', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>
                        Phone: +91 98765 43210
                        <br />
                        Email: hello@chovique.com
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Map container */}
              <div
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--glass-border)',
                  boxShadow: 'var(--glass-shadow)',
                  height: '350px',
                  width: '100%',
                  background: 'rgba(var(--dark-chocolate-rgb), 0.2)',
                }}
              >
                <iframe
                  title="Chovique Atelier Location Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.9254397732297!2d77.63692837593685!3d12.976593914761405!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae16a6bb455555%3A0x6b86cdcb6e0c036f!2sIndiranagar%20Double%20Road%2C%20Bangalore!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
