import { motion } from "framer-motion";
import { ReactNode } from "react";

interface RankingAnimationsProps {
  children: ReactNode;
  index: number;
  delay?: number;
}

export function StoreCardAnimation({ children, index, delay = 0 }: RankingAnimationsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: delay + (index * 0.1),
        ease: [0.4, 0, 0.2, 1]
      }}
      whileHover={{ 
        scale: 1.02,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </motion.div>
  );
}

export function PodiumAnimation({ children, rank }: { children: ReactNode; rank: number }) {
  const getAnimationProps = (position: number) => {
    const baseDelay = 0.2;
    const heightVariations = {
      1: { y: -10, scale: 1.05 }, // Winner gets more prominence
      2: { y: -5, scale: 1.02 },
      3: { y: -5, scale: 1.02 }
    };
    
    return {
      initial: { opacity: 0, y: 50, scale: 0.8 },
      animate: { 
        opacity: 1, 
        y: heightVariations[position as keyof typeof heightVariations]?.y || 0,
        scale: heightVariations[position as keyof typeof heightVariations]?.scale || 1
      },
      transition: {
        duration: 0.6,
        delay: baseDelay + (position === 1 ? 0.3 : position === 2 ? 0.1 : 0),
        ease: [0.4, 0, 0.2, 1]
      }
    };
  };

  if (rank <= 3) {
    return (
      <motion.div {...getAnimationProps(rank)}>
        {children}
      </motion.div>
    );
  }

  return <>{children}</>;
}

export function ScoreCountAnimation({ 
  value, 
  duration = 1000 
}: { 
  value: number; 
  duration?: number; 
}) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.span
        initial={{ scale: 1.2, color: "#0ea5e9" }}
        animate={{ scale: 1, color: "inherit" }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {value.toFixed(0)}
      </motion.span>
    </motion.span>
  );
}

export function ChartAnimation({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {children}
    </motion.div>
  );
}

export function FilterAnimation({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }}
    >
      {children}
    </motion.div>
  );
}