import { motion } from 'framer-motion';
import { ArrowRight, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface FeaturePreviewProps {
  title: string;
  description: string;
  icon: LucideIcon;
  imageSrc?: string;
  imageAlt?: string;
  href: string;
  ctaText: string;
  children?: React.ReactNode;
  className?: string;
  testId?: string;
}

export default function FeaturePreview({
  title,
  description,
  icon: Icon,
  imageSrc,
  imageAlt,
  href,
  ctaText,
  children,
  className = '',
  testId
}: FeaturePreviewProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(href);
  };

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6 }}
      data-testid={testId}
    >
      <Card className="h-full hover-elevate cursor-pointer group transition-all duration-300" onClick={handleClick}>
        <CardHeader className="space-y-2">
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ x: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
              <Icon className="h-5 w-5" />
            </div>
            <CardTitle className="text-lg">{title}</CardTitle>
          </motion.div>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </p>

          {/* Preview Content */}
          <div className="space-y-4">
            {imageSrc && (
              <motion.div
                className="aspect-video rounded-lg overflow-hidden bg-muted"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={imageSrc}
                  alt={imageAlt}
                  className="w-full h-full object-cover"
                  data-testid={`img-preview-${testId}`}
                />
              </motion.div>
            )}

            {/* Custom preview content */}
            {children && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {children}
              </motion.div>
            )}
          </div>

          {/* CTA Button */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300"
              variant="outline"
              data-testid={`button-cta-${testId}`}
            >
              <span>{ctaText}</span>
              <motion.div
                className="ml-2"
                animate={{ x: [0, 3, 0] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  repeatType: "reverse",
                  ease: "easeInOut"
                }}
              >
                <ArrowRight className="h-4 w-4" />
              </motion.div>
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}