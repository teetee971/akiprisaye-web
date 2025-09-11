import { motion } from 'framer-motion';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface CTAButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  icon?: LucideIcon;
  showArrow?: boolean;
  className?: string;
  testId?: string;
  pulse?: boolean;
  disabled?: boolean;
}

export default function CTAButton({
  children,
  href,
  onClick,
  variant = 'default',
  size = 'default',
  icon: Icon,
  showArrow = false,
  className = '',
  testId,
  pulse = false,
  disabled = false
}: CTAButtonProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (disabled) return;
    
    if (onClick) {
      onClick();
    } else if (href) {
      navigate(href);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      className={pulse ? 'animate-pulse' : ''}
    >
      <Button
        variant={variant}
        size={size}
        onClick={handleClick}
        className={`group relative overflow-hidden transition-all duration-300 ${className}`}
        disabled={disabled}
        data-testid={testId}
      >
        {/* Background animation */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          initial={false}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            repeatType: "loop",
            ease: "linear"
          }}
        />

        {/* Content */}
        <span className="relative flex items-center gap-2">
          {Icon && (
            <motion.div
              animate={{ rotate: [0, 10, 0] }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                repeatType: "reverse" 
              }}
            >
              <Icon className="h-4 w-4" />
            </motion.div>
          )}
          
          {children}
          
          {showArrow && (
            <motion.div
              animate={{ x: [0, 3, 0] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            >
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
            </motion.div>
          )}
        </span>
      </Button>
    </motion.div>
  );
}