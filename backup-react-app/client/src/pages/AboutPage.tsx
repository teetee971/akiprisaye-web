import { MapPin, Users, TrendingUp, Shield, Mail, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AboutPage() {
  const features = [
    {
      icon: TrendingUp,
      title: "Suivi des prix en temps réel",
      description: "Nous surveillons les prix de milliers de produits dans tous les territoires d'outre-mer pour vous offrir les données les plus récentes."
    },
    {
      icon: MapPin,
      title: "Couverture territoriale complète",
      description: "Guadeloupe, Martinique, Guyane, La Réunion, Mayotte, Nouvelle-Calédonie, Polynésie française et plus encore."
    },
    {
      icon: Users,
      title: "Comparaison intelligente",
      description: "Comparez jusqu'à 4 produits simultanément et trouvez les meilleures offres selon vos critères."
    },
    {
      icon: Shield,
      title: "Données fiables",
      description: "Nos données sont collectées et vérifiées régulièrement pour garantir leur exactitude et leur pertinence."
    }
  ];

  const territories = [
    "Guadeloupe", "Martinique", "Guyane française", "La Réunion", 
    "Mayotte", "Nouvelle-Calédonie", "Polynésie française", 
    "Saint-Pierre-et-Miquelon", "Saint-Martin", "Saint-Barthélemy"
  ];

  const stats = [
    { label: "Territoires couverts", value: "10+" },
    { label: "Produits suivis", value: "25,000+" },
    { label: "Enseignes partenaires", value: "50+" },
    { label: "Utilisateurs actifs", value: "5,000+" }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4" data-testid="text-about-title">
          À propos d'A KI PRI SA YÉ
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
          La première plateforme de comparaison de prix dédiée aux Territoires d'Outre-Mer français. 
          Notre mission est de vous aider à économiser et à mieux consommer.
        </p>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          Version 1.0 - 2025
        </Badge>
      </div>

      {/* Mission */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-2xl font-heading">Notre mission</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground leading-relaxed">
            "A KI PRI SA YÉ" (créole pour "À quel prix c'est ça ?") né de la constatation que les habitants 
            des Territoires d'Outre-Mer font face à des prix souvent plus élevés et à une offre parfois limitée. 
            Notre plateforme permet de comparer les prix en temps réel, de suivre l'évolution des coûts et 
            d'identifier les meilleures opportunités d'achat dans chaque territoire.
          </p>
        </CardContent>
      </Card>

      {/* Features */}
      <div className="mb-12">
        <h2 className="text-3xl font-heading font-semibold text-center mb-8">
          Nos fonctionnalités
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} data-testid={`card-feature-${index}`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="text-center">A KI PRI SA YÉ en chiffres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center" data-testid={`stat-${index}`}>
                <div className="text-3xl font-bold text-primary mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Territories Coverage */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Territoires couverts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {territories.map((territory, index) => (
              <Badge key={index} variant="outline" className="justify-center py-2" data-testid={`badge-territory-${index}`}>
                {territory}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact & Support */}
      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Contact & Support
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Une question, un problème, ou une suggestion ? Notre équipe est là pour vous aider.
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Email:</strong> contact@akiprisaye.fr
              </div>
              <div>
                <strong>Support:</strong> support@akiprisaye.fr
              </div>
            </div>
            <Button className="w-full" data-testid="button-contact">
              <Mail className="h-4 w-4 mr-2" />
              Nous contacter
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Ressources utiles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Découvrez nos ressources et guides pour mieux utiliser la plateforme.
            </p>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" data-testid="button-guide">
                Guide d'utilisation
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-faq">
                FAQ
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-privacy">
                Politique de confidentialité
              </Button>
              <Button variant="outline" className="w-full justify-start" data-testid="button-terms">
                Conditions d'utilisation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <Card className="text-center bg-primary/5">
        <CardContent className="p-8">
          <h3 className="text-2xl font-heading font-semibold mb-4">
            Prêt à économiser ?
          </h3>
          <p className="text-muted-foreground mb-6">
            Commencez dès maintenant à comparer les prix et trouvez les meilleures offres dans votre territoire.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" data-testid="button-start-comparing">
              Commencer à comparer
            </Button>
            <Button variant="outline" size="lg" data-testid="button-explore-catalog">
              Explorer le catalogue
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}