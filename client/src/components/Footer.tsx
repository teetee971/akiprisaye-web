import { Link } from "react-router-dom";
import { MapPin, Mail, ExternalLink, Heart } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { path: "/", label: "Accueil" },
    { path: "/produits", label: "Produits" },
    { path: "/comparateur", label: "Comparateur" },
    { path: "/carte", label: "Carte" },
    { path: "/palmares", label: "Palmarès" },
    { path: "/apropos", label: "À propos" }
  ];

  const territories = [
    "Guadeloupe",
    "Martinique", 
    "Guyane française",
    "La Réunion",
    "Mayotte",
    "Nouvelle-Calédonie"
  ];

  const legalLinks = [
    { label: "Politique de confidentialité", href: "#privacy" },
    { label: "Conditions d'utilisation", href: "#terms" },
    { label: "Mentions légales", href: "#legal" },
    { label: "Contact", href: "#contact" }
  ];

  return (
    <footer className="bg-muted/50 border-t border-border mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* About Section */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <h3 className="text-lg font-heading font-semibold text-primary" data-testid="text-footer-logo">
                A KI PRI SA YÉ
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              La première plateforme de comparaison de prix dédiée aux Territoires d'Outre-Mer français.
              Comparez, économisez, consommez mieux.
            </p>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Territoires d'Outre-Mer</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Navigation</h4>
            <nav className="space-y-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid={`footer-nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Territories */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Territoires couverts</h4>
            <div className="space-y-2">
              {territories.map((territory, index) => (
                <div
                  key={index}
                  className="text-sm text-muted-foreground"
                  data-testid={`footer-territory-${index}`}
                >
                  {territory}
                </div>
              ))}
              <div className="text-xs text-muted-foreground mt-2">
                + 4 autres territoires
              </div>
            </div>
          </div>

          {/* Contact & Support */}
          <div className="space-y-4">
            <h4 className="font-medium text-foreground">Contact & Support</h4>
            <div className="space-y-3">
              <a
                href="mailto:contact@akiprisaye.fr"
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                data-testid="link-footer-email"
              >
                <Mail className="h-4 w-4" />
                <span>contact@akiprisaye.fr</span>
              </a>
              
              <div className="space-y-2">
                {legalLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid={`footer-legal-${index}`}
                  >
                    <ExternalLink className="h-3 w-3" />
                    <span>{link.label}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <span>© {currentYear} A KI PRI SA YÉ. Fait avec</span>
              <Heart className="h-4 w-4 text-red-500" />
              <span>pour les territoires d'outre-mer.</span>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Version 1.0 - Données mises à jour quotidiennement
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom padding to account for potential fixed bottom navigation */}
      <div className="h-safe-area-inset-bottom" />
    </footer>
  );
}