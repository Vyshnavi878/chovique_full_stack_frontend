import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertCircle, HelpCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { pageTransition } from '../../lib/framer';

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        height: '100vh',
        width: '100vw',
        background: 'var(--gradient-hero)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '20px',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div
        className="glass-panel"
        style={{
          padding: '50px 40px',
          maxWidth: '500px',
          border: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <motion.div
          animate={{
            y: [0, -12, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'rgba(201, 168, 76, 0.05)',
            border: '1px solid var(--gold)',
            color: 'var(--gold)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '30px',
          }}
        >
          <HelpCircle size={40} />
        </motion.div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '3rem',
            fontWeight: 700,
            color: 'var(--cream)',
            margin: '0 0 10px 0',
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--gold)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '15px',
          }}
        >
          Creation Not Found
        </h2>
        <p style={{ color: 'var(--beige)', lineHeight: 1.6, marginBottom: '35px', fontSize: '0.95rem' }}>
          It seems the flavor combination or cabinet drawer you're seeking does not exist. Let's return you to our primary artisan collection.
        </p>

        <Button variant="gold" size="lg" onClick={() => navigate('/')} glow>
          Return to Boutique
        </Button>
      </div>
    </motion.div>
  );
};
export default NotFoundPage;
