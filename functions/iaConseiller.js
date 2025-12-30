/**
 * Backend Function: IA Conseiller Budget
 * Cloudflare Pages Function: /functions/iaConseiller.js
 * 
 * Analyzes user shopping basket and provides AI-powered budget recommendations
 * Suggests savings opportunities and alternative products
 * 
 * @param {Array} panier - Array of products in basket
 * @returns {Object} Suggestions and potential savings
 */

/**
 * Calculate potential savings by comparing with cheaper alternatives
 * @param {Array} panier - Shopping basket items
 * @returns {Object} Analysis results
 */
function analyzeBasket(panier) {
  if (!Array.isArray(panier) || panier.length === 0) {
    return {
      totalCost: 0,
      potentialSavings: 0,
      suggestions: [],
      categories: {},
    };
  }
  
  let totalCost = 0;
  let potentialSavings = 0;
  const suggestions = [];
  const categories = {};
  
  // Analyze each product
  panier.forEach(item => {
    const price = parseFloat(item.price) || 0;
    const category = item.category || 'Autres';
    
    totalCost += price;
    
    // Track spending by category
    if (!categories[category]) {
      categories[category] = {
        count: 0,
        total: 0,
      };
    }
    categories[category].count += 1;
    categories[category].total += price;
    
    // TODO: PRODUCTION IMPLEMENTATION
    // Query Firestore for cheaper alternatives:
    // 1. Find products in same category
    // 2. Filter by same territory
    // 3. Compare prices
    // 4. Calculate potential savings
    // 5. Consider quality/brand equivalence
    
    // Mock suggestion generation
    if (price > 5.0) {
      const mockSavings = price * 0.15; // 15% potential savings
      potentialSavings += mockSavings;
      
      suggestions.push({
        productName: item.name || 'Produit',
        currentPrice: price,
        betterPrice: price - mockSavings,
        savings: mockSavings,
        alternativeStore: 'Magasin Alternative',
        reason: 'Prix plus bas trouvé dans un autre magasin',
        confidence: 0.85,
      });
    }
  });
  
  return {
    totalCost: Math.round(totalCost * 100) / 100,
    potentialSavings: Math.round(potentialSavings * 100) / 100,
    savingsPercent: totalCost > 0 ? Math.round((potentialSavings / totalCost) * 100) : 0,
    suggestions: suggestions.slice(0, 5), // Top 5 suggestions
    categories,
    itemCount: panier.length,
  };
}

/**
 * Generate AI-powered tips based on shopping patterns
 * @param {Object} analysis - Basket analysis results
 * @returns {Array} Personalized tips
 */
function generateTips(analysis) {
  const tips = [];
  
  // Tip based on potential savings
  if (analysis.savingsPercent > 10) {
    tips.push({
      type: 'savings',
      icon: '💰',
      title: 'Économies importantes possibles',
      description: `Vous pourriez économiser ${analysis.savingsPercent}% (${analysis.potentialSavings}€) en changeant de magasin pour certains produits.`,
      priority: 'high',
    });
  }
  
  // Tip based on category analysis
  const categoryEntries = Object.entries(analysis.categories);
  if (categoryEntries.length > 0) {
    const topCategory = categoryEntries.reduce((max, curr) => 
      curr[1].total > max[1].total ? curr : max,
    );
    
    tips.push({
      type: 'category',
      icon: '📊',
      title: `Budget ${topCategory[0]}`,
      description: `Vous dépensez ${topCategory[1].total.toFixed(2)}€ en ${topCategory[0]} (${topCategory[1].count} produits). Comparez les prix pour cette catégorie.`,
      priority: 'medium',
    });
  }
  
  // Generic tips
  if (analysis.itemCount > 10) {
    tips.push({
      type: 'bulk',
      icon: '🛒',
      title: 'Achat en gros',
      description: 'Pour vos achats fréquents, pensez aux formats familiaux qui sont souvent plus économiques au kilo.',
      priority: 'low',
    });
  }
  
  tips.push({
    type: 'seasonal',
    icon: '🌱',
    title: 'Produits de saison',
    description: 'Privilégiez les fruits et légumes de saison locaux, ils sont moins chers et plus frais.',
    priority: 'low',
  });
  
  tips.push({
    type: 'promo',
    icon: '🏷️',
    title: 'Surveillez les promotions',
    description: 'Activez les alertes pour être notifié des promotions sur vos produits favoris.',
    priority: 'low',
  });
  
  return tips;
}

/**
 * Main handler for POST /api/ia-conseiller
 */
export async function onRequestPost(context) {
  try {
    const { request } = context;
    
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({
        error: 'Invalid JSON',
        message: 'Request body must be valid JSON',
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    const { panier, territoire } = body;
    
    if (!panier || !Array.isArray(panier)) {
      return new Response(JSON.stringify({
        error: 'Invalid basket',
        message: 'Field "panier" must be an array of products',
      }), {
        status: 400,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
    
    // Analyze the basket
    const analysis = analyzeBasket(panier);
    
    // Generate personalized tips
    const tips = generateTips(analysis);
    
    // TODO: PRODUCTION ENHANCEMENTS
    // 1. Integrate with machine learning model for better predictions
    // 2. Use historical user data for personalized recommendations
    // 3. Consider local promotions and seasonal variations
    // 4. Track user acceptance of suggestions to improve recommendations
    // 5. Generate budget planning advice based on spending patterns
    // 6. Suggest meal planning based on product combinations
    
    const response = {
      success: true,
      analysis: {
        totalCost: analysis.totalCost,
        potentialSavings: analysis.potentialSavings,
        savingsPercent: analysis.savingsPercent,
        itemCount: analysis.itemCount,
      },
      suggestions: analysis.suggestions,
      tips: tips,
      territoire: territoire || 'non spécifié',
      message: 'Analyse du panier terminée avec succès',
    };
    
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store', // Don't cache personalized recommendations
        'Access-Control-Allow-Origin': '*',
      },
    });
    
  } catch (error) {
    console.error('Error in /api/ia-conseiller:', error);
    
    return new Response(JSON.stringify({
      error: 'Analysis failed',
      message: error.message,
    }), {
      status: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}

/**
 * CORS preflight handler
 */
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
