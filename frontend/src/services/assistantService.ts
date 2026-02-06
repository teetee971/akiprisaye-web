/**
 * Assistant Service - A KI PRI SA YÉ v1.6.0
 * Chatbot assistant lecture seule
 * Réponses basées sur: FAQ, Méthodologies, Données publiques observées
 * 
 * Contraintes:
 * - Sources toujours visibles
 * - Aucun conseil (achat, médical, financier, juridique)
 * - Pas de scoring propriétaire
 */

import { FAQ_DATA, searchFAQ, type FAQItem } from '../data/faq';

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: string[];
  relatedFAQ?: FAQItem[];
}

export interface AssistantResponse {
  message: string;
  sources: string[];
  relatedFAQ: FAQItem[];
  disclaimer?: string;
}

/**
 * Analyze user query and determine intent
 */
const analyzeIntent = (query: string): {
  category: 'faq' | 'pricing' | 'data' | 'technical' | 'institutional' | 'general';
  keywords: string[];
} => {
  const lowerQuery = query.toLowerCase();
  
  // Pricing related
  if (
    lowerQuery.includes('prix') ||
    lowerQuery.includes('tarif') ||
    lowerQuery.includes('abonnement') ||
    lowerQuery.includes('payer') ||
    lowerQuery.includes('gratuit') ||
    lowerQuery.includes('coût')
  ) {
    return { category: 'pricing', keywords: ['prix', 'tarif', 'abonnement'] };
  }
  
  // Data related
  if (
    lowerQuery.includes('données') ||
    lowerQuery.includes('source') ||
    lowerQuery.includes('export') ||
    lowerQuery.includes('télécharger') ||
    lowerQuery.includes('api')
  ) {
    return { category: 'data', keywords: ['données', 'source', 'export'] };
  }
  
  // Technical
  if (
    lowerQuery.includes('mobile') ||
    lowerQuery.includes('problème') ||
    lowerQuery.includes('bug') ||
    lowerQuery.includes('marche pas') ||
    lowerQuery.includes('fonctionne')
  ) {
    return { category: 'technical', keywords: ['technique', 'mobile', 'support'] };
  }
  
  // Institutional
  if (
    lowerQuery.includes('institution') ||
    lowerQuery.includes('collectivité') ||
    lowerQuery.includes('université') ||
    lowerQuery.includes('recherche') ||
    lowerQuery.includes('licence')
  ) {
    return { category: 'institutional', keywords: ['institution', 'licence'] };
  }
  
  return { category: 'general', keywords: [] };
};

/**
 * Generate assistant response based on query
 */
export const generateAssistantResponse = (query: string): AssistantResponse => {
  const intent = analyzeIntent(query);
  const relatedFAQ = searchFAQ(query).slice(0, 3); // Top 3 related FAQ
  
  // Default disclaimers for sensitive topics
  const getDisclaimer = (): string | undefined => {
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('acheter') || lowerQuery.includes('recommand')) {
      return '⚠️ A KI PRI SA YÉ ne fournit aucune recommandation d\'achat. Le service est en lecture seule.';
    }
    
    if (lowerQuery.includes('santé') || lowerQuery.includes('médical')) {
      return '⚠️ A KI PRI SA YÉ ne fournit aucun conseil médical. Consultez un professionnel de santé.';
    }
    
    if (lowerQuery.includes('juridique') || lowerQuery.includes('loi')) {
      return '⚠️ A KI PRI SA YÉ ne fournit aucun conseil juridique. Consultez un avocat.';
    }
    
    if (lowerQuery.includes('investir') || lowerQuery.includes('financier')) {
      return '⚠️ A KI PRI SA YÉ ne fournit aucun conseil financier. Consultez un conseiller agréé.';
    }
    
    return undefined;
  };
  
  // Generate response based on intent and FAQ matches
  let message = '';
  const sources: string[] = ['FAQ A KI PRI SA YÉ'];
  
  if (relatedFAQ.length > 0) {
    // Use FAQ content
    const topFAQ = relatedFAQ[0];
    message = topFAQ.answer;
    
    if (relatedFAQ.length > 1) {
      message += `\n\nVous pourriez également être intéressé par:\n`;
      relatedFAQ.slice(1).forEach((faq, idx) => {
        message += `${idx + 1}. ${faq.question}\n`;
      });
    }
  } else {
    // General fallback response
    switch (intent.category) {
      case 'pricing':
        message = `A KI PRI SA YÉ propose plusieurs niveaux d'accès:\n\n` +
          `• **Gratuit** : Comparateurs de base, lecture seule\n` +
          `• **Citoyen+** (2,99€/mois) : Alertes, historique étendu, exports basiques\n` +
          `• **Pro** (9,99€/mois) : Agrégations avancées, multi-territoires\n` +
          `• **Institution** : Licence annuelle sur convention\n\n` +
          `Le paiement n'est pas encore activé. Consultez la page Tarifs pour plus d'informations.`;
        sources.push('Grille tarifaire v1.6.1');
        break;
        
      case 'data':
        message = `Toutes les données proviennent de sources officielles publiques :\n\n` +
          `• INSEE (Institut national de la statistique)\n` +
          `• OPMR (Observatoire des prix et des marges)\n` +
          `• DGCCRF (Direction générale de la concurrence)\n` +
          `• data.gouv.fr (Plateforme ouverte des données publiques)\n\n` +
          `Les données sont observées, datées et sourcées. Aucune estimation ou simulation.`;
        sources.push('Méthodologie A KI PRI SA YÉ', 'INSEE', 'OPMR', 'DGCCRF');
        break;
        
      case 'technical':
        message = `Le service A KI PRI SA YÉ est optimisé mobile-first et fonctionne sur tous les appareils.\n\n` +
          `En cas de problème technique, contactez-nous via la page Contact. ` +
          `Un support technique dédié est disponible pour les partenaires institutionnels.`;
        sources.push('Support technique');
        break;
        
      case 'institutional':
        message = `Les licences institutionnelles sont destinées aux collectivités, universités, centres de recherche et administrations.\n\n` +
          `Elles donnent accès à:\n` +
          `• API open-data\n` +
          `• Exports normalisés (INSEE / Eurostat)\n` +
          `• Documentation technique complète\n` +
          `• Support méthodologique\n\n` +
          `Contactez-nous pour établir une convention adaptée à vos besoins.`;
        sources.push('Licences institutionnelles', 'Contact');
        break;
        
      default:
        message = `Je suis l'assistant A KI PRI SA YÉ. Je peux vous aider avec des questions sur:\n\n` +
          `• Le service et son fonctionnement\n` +
          `• Les tarifs et abonnements\n` +
          `• Les données et leur provenance\n` +
          `• Les aspects techniques\n` +
          `• Les licences institutionnelles\n\n` +
          `Consultez la FAQ complète pour plus d'informations.`;
        sources.push('FAQ complète');
    }
  }
  
  const disclaimer = getDisclaimer();
  
  return {
    message,
    sources,
    relatedFAQ,
    disclaimer
  };
};

/**
 * Create a new assistant message
 */
export const createAssistantMessage = (
  content: string,
  response: AssistantResponse
): AssistantMessage => {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: 'assistant',
    content: response.disclaimer 
      ? `${response.message}\n\n${response.disclaimer}`
      : response.message,
    timestamp: new Date(),
    sources: response.sources,
    relatedFAQ: response.relatedFAQ
  };
};

/**
 * Create a user message
 */
export const createUserMessage = (content: string): AssistantMessage => {
  return {
    id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role: 'user',
    content,
    timestamp: new Date()
  };
};

/**
 * Check if query contains prohibited content
 */
export const isProhibitedQuery = (query: string): boolean => {
  const prohibited = [
    'hack',
    'exploit',
    'crack',
    'pirate',
    'illegal',
    'fraude'
  ];
  
  const lowerQuery = query.toLowerCase();
  return prohibited.some(term => lowerQuery.includes(term));
};

export default {
  generateAssistantResponse,
  createAssistantMessage,
  createUserMessage,
  isProhibitedQuery
};
