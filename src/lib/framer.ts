export const pageTransition = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
} as const;

export const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }
} as const;

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.5 }
} as const;

export const slideInLeft = {
  initial: { opacity: 0, x: -50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
} as const;

export const slideInRight = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }
} as const;

export const scaleUp = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }
} as const;

export const hoverLift = {
  whileHover: { y: -8, transition: { duration: 0.3, ease: 'easeOut' as const } }
} as const;

export const hoverGlow = {
  whileHover: {
    boxShadow: '0 0 20px rgba(201, 168, 76, 0.5)',
    borderColor: 'var(--gold)',
    scale: 1.02,
    transition: { duration: 0.3 }
  }
} as const;

export const buttonHover = {
  whileHover: { scale: 1.05, transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 }
} as const;
