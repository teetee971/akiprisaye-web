import { motion } from 'framer-motion';
import { Package, Store, MapPin, TrendingUp } from 'lucide-react';
import { useProducts } from '@/context/ProductsContext';
import AnimatedCounter from './AnimatedCounter';
import { Card, CardContent } from '@/components/ui/card';

const statIcons = {
  products: Package,
  stores: Store,
  territories: MapPin,
  comparisons: TrendingUp,
};

interface StatItem {
  key: keyof typeof statIcons;
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
}

export default function HeroStats() {
  const { products, stores, territories, loading } = useProducts();

  // Calculate real stats from context
  const stats: StatItem[] = [
    {
      key: 'products',
      label: 'Produits suivis',
      value: products.length,
    },
    {
      key: 'stores',
      label: 'Enseignes',
      value: stores.length,
    },
    {
      key: 'territories',
      label: 'Territoires',
      value: territories.length,
    },
    {
      key: 'comparisons',
      label: 'Prix comparés',
      value: products.length * 3, // Approximation based on price history
      suffix: '+',
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-3 md:p-4 text-center">
              <div className="h-6 w-6 bg-muted rounded mx-auto mb-2" />
              <div className="h-6 bg-muted rounded mb-1" />
              <div className="h-4 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <motion.div
      className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      {stats.map((stat, index) => {
        const Icon = statIcons[stat.key];
        
        return (
          <motion.div
            key={stat.key}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 * index }}
          >
            <Card className="hover-elevate transition-all duration-300">
              <CardContent className="p-3 md:p-4 text-center">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Icon 
                    className="h-6 w-6 mx-auto mb-2 text-primary" 
                    data-testid={`icon-stat-${stat.key}`}
                  />
                </motion.div>
                
                <div className="text-xl md:text-2xl font-bold text-primary mb-1">
                  <AnimatedCounter
                    value={stat.value}
                    duration={1.5 + index * 0.2}
                    suffix={stat.suffix}
                    prefix={stat.prefix}
                    testId={`counter-${stat.key}`}
                  />
                </div>
                
                <div className="text-xs md:text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </motion.div>
  );
}