import { motion } from 'framer-motion';
import { Search, MapPin, Trophy, TrendingUp, Star, ShoppingCart, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import heroImage from "@assets/generated_images/Tropical_islands_price_comparison_hero_c34340d8.png";

// Components
import HeroStats from '@/components/HeroStats';
import FeaturePreview from '@/components/FeaturePreview';
import CTAButton from '@/components/CTAButton';
import ProductCard from '@/components/ProductCard';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

// Context
import { useProducts } from '@/context/ProductsContext';

export default function HomePage() {
  const { products, stores, territories, loading, error } = useProducts();

  // Get sample products for preview
  const sampleProducts = products.slice(0, 3);
  
  // Get top stores by average score
  const topStores = stores
    .sort((a, b) => b.averageScore - a.averageScore)
    .slice(0, 3);

  // Calculate territory statistics
  const territoryStats = territories.map(territory => ({
    ...territory,
    productCount: products.filter(p => p.territory === territory.id).length
  })).sort((a, b) => b.productCount - a.productCount);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Hero Background */}
        <motion.div 
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
        >
          <div 
            className="h-full bg-cover bg-center"
            style={{ 
              backgroundImage: `linear-gradient(135deg, rgba(55, 65, 81, 0.7) 0%, rgba(17, 24, 39, 0.8) 100%), url(${heroImage})`
            }}
          />
          {/* Tropical gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-chart-2/20" />
        </motion.div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 pt-16 pb-20 md:pt-24 md:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            {/* Main Title */}
            <motion.h1 
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              data-testid="text-hero-title"
            >
              A KI PRI SA YÉ
            </motion.h1>

            {/* Subtitle */}
            <motion.p 
              className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Comparez les prix, trouvez les meilleures offres et économisez dans les Territoires d'Outre-Mer
            </motion.p>

            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <CTAButton
                href="/produits"
                size="lg"
                icon={Search}
                showArrow
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                testId="button-hero-main-cta"
              >
                Découvrir les prix
              </CTAButton>
              
              <CTAButton
                href="/comparateur"
                variant="outline"
                size="lg"
                className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20"
                testId="button-hero-secondary-cta"
              >
                Comparer des produits
              </CTAButton>
            </motion.div>

            {/* Hero Stats */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <HeroStats />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        {/* Section 1: Comparaison de Prix */}
        <section className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold">
                    Comparez les prix
                  </h2>
                </div>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Suivez l'évolution des prix en temps réel, comparez jusqu'à 4 produits simultanément et 
                  recevez des alertes pour ne jamais rater une bonne affaire dans les DOM-TOM.
                </p>

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-chart-2" />
                    <span className="text-sm">Historique détaillé des prix</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-chart-2" />
                    <span className="text-sm">Comparaison multi-territoires</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-chart-2" />
                    <span className="text-sm">Alertes personnalisées</span>
                  </div>
                </div>

                <CTAButton
                  href="/comparateur"
                  size="lg"
                  showArrow
                  className="mt-6"
                  testId="button-section1-cta"
                >
                  Commencer la comparaison
                </CTAButton>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              {/* Preview with sample products */}
              {!loading && sampleProducts.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg mb-4">Exemples de produits suivis</h3>
                  {sampleProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                    >
                      <ProductCard 
                        product={product} 
                        variant="compact" 
                        showActions={false}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
              
              {loading && (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </section>

        {/* Section 2: Carte Interactive */}
        <section className="mb-20">
          <FeaturePreview
            title="Explorez par territoire"
            description="Découvrez les variations de prix selon les territoires d'outre-mer. Notre carte interactive vous permet de visualiser les données par région et de comprendre les tendances locales."
            icon={MapPin}
            href="/carte"
            ctaText="Voir la carte"
            testId="feature-map"
            className="grid lg:grid-cols-2 gap-12 items-center"
          >
            <div className="space-y-4">
              <h4 className="font-semibold">Territoires couverts</h4>
              <div className="grid grid-cols-2 gap-2">
                {territoryStats.slice(0, 6).map((territory) => (
                  <motion.div
                    key={territory.id}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded-md"
                    whileHover={{ scale: 1.02 }}
                  >
                    <span className="text-sm font-medium">{territory.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {territory.productCount}
                    </Badge>
                  </motion.div>
                ))}
              </div>
            </div>
          </FeaturePreview>
        </section>

        {/* Section 3: Palmarès des Enseignes */}
        <section className="mb-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Trophy className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold">
                    Classement des enseignes
                  </h2>
                </div>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Découvrez les enseignes les mieux notées selon nos critères de prix, 
                  disponibilité et service client. Un palmarès actualisé régulièrement.
                </p>

                <CTAButton
                  href="/palmares"
                  size="lg"
                  showArrow
                  testId="button-section3-cta"
                >
                  Voir le classement complet
                </CTAButton>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="space-y-4">
                <h3 className="font-semibold text-lg mb-4">Top 3 des enseignes</h3>
                {!loading && topStores.map((store, index) => (
                  <motion.div
                    key={store.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.1 }}
                  >
                    <Card className="hover-elevate">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{store.name}</h4>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < Math.floor(store.averageScore)
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm text-muted-foreground">
                                {store.averageScore.toFixed(1)}
                              </span>
                            </div>
                            <div className="mt-2 space-y-1">
                              <div className="flex justify-between text-xs">
                                <span>Prix competitifs</span>
                                <span>{(store.stabilityScore * 20).toFixed(0)}%</span>
                              </div>
                              <Progress value={store.stabilityScore * 20} className="h-1" />
                            </div>
                          </div>
                          <Badge variant="outline">
                            {store.storeCount} magasins
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
                
                {loading && (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA Section */}
        <motion.section
          className="text-center py-16 bg-gradient-to-r from-primary/5 to-chart-2/5 rounded-2xl"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="max-w-2xl mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à économiser ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Rejoignez les milliers d'utilisateurs qui économisent chaque jour avec A KI PRI SA YÉ
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <CTAButton
                href="/produits"
                size="lg"
                icon={ShoppingCart}
                showArrow
                pulse
                testId="button-final-cta-products"
              >
                Découvrir les produits
              </CTAButton>
              
              <CTAButton
                href="/comparateur"
                variant="outline"
                size="lg"
                icon={BarChart3}
                testId="button-final-cta-compare"
              >
                Commencer à comparer
              </CTAButton>
            </div>
          </div>
        </motion.section>
      </div>

      {/* Mobile bottom padding */}
      <div className="h-20 md:hidden" />
    </div>
  );
}