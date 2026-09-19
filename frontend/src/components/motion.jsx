import { motion, AnimatePresence } from 'framer-motion';

export { motion, AnimatePresence };
export const MotionDiv = motion.div;
export const MotionSection = motion.section;
export const MotionButton = motion.button;
export const MotionSpan = motion.span;

export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.28, ease: 'easeOut' },
};

export const staggerParent = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } },
};

export const staggerChild = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' } },
};

export const popIn = {
  initial: { opacity: 0, scale: 0.98 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.22, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.98, transition: { duration: 0.16 } },
};
