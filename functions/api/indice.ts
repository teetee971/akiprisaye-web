export interface Env {}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      const url = new URL(request.url);
      const territory = url.searchParams.get("territory") || "GP";

      if (territory !== "GP") {
        return jsonResponse(
          { error: "Territoire non supporté pour le moment" },
          400
        );
      }

      /* === MÉGA DATASET INTÉGRÉ === */
      const data = {
        meta: {
          project: {
            name: "A KI PRI SA YÉ",
            type: "comparateur citoyen",
            mission:
              "Informer les consommateurs sur le coût réel de la vie avec transparence, neutralité et données vérifiables",
          },
          dataset: {
            id: "mega-panier-anti-crise",
            label: "Méga dataset – paniers essentiels & comparaisons",
            version: "2.0.0",
            status: "stable",
          },
          territory: {
            code: "GP",
            label: "Guadeloupe",
            country: "FR",
            regionType: "DOM",
          },
          currency: {
            code: "EUR",
            symbol: "€",
          },
          timestamps: {
            createdAt: "2026-01-01T00:00:00Z",
            lastUpdated: "2026-01-06T11:30:00Z",
          },
          disclaimer:
            "Données indicatives. A KI PRI SA YÉ n’est pas un vendeur. Aucune affiliation commerciale.",
        },

        products: [
          { id: "riz-1kg", label: "Riz blanc 1kg", unit: "kg", essential: true },
          { id: "lait-1l", label: "Lait UHT demi-écrémé 1L", unit: "l", essential: true },
          { id: "huile-1l", label: "Huile végétale 1L", unit: "l", essential: true },
          { id: "pates-500g", label: "Pâtes alimentaires 500g", unit: "g", essential: true },
          { id: "sucre-1kg", label: "Sucre blanc 1kg", unit: "kg", essential: true },
        ],

        stores: [
          {
            id: "carrefour-abymes",
            name: "Carrefour Abymes",
            type: "hypermarché",
            location: "Les Abymes",
            prices: {
              "riz-1kg": 2.45,
              "lait-1l": 1.1,
              "huile-1l": 3.2,
              "pates-500g": 1.35,
              "sucre-1kg": 1.6,
            },
          },
          {
            id: "super-u-basse-terre",
            name: "Super U Basse-Terre",
            type: "supermarché",
            location: "Basse-Terre",
            prices: {
              "riz-1kg": 2.6,
              "lait-1l": 1.15,
              "huile-1l": 3.1,
              "pates-500g": 1.4,
              "sucre-1kg": 1.55,
            },
          },
          {
            id: "leclerc-jarry",
            name: "E.Leclerc Jarry",
            type: "hypermarché",
            location: "Jarry",
            prices: {
              "riz-1kg": 2.5,
              "lait-1l": 1.05,
              "huile-1l": 3.3,
              "pates-500g": 1.3,
              "sucre-1kg": 1.65,
            },
          },
        ],
      };

      /* === CALCUL AUTOMATIQUE DES TOTAUX === */
      const basketProducts = data.products.map((p) => p.id);

      const totals = data.stores.map((store) => {
        const total = basketProducts.reduce(
          (sum, pid) => sum + (store.prices[pid] || 0),
          0
        );
        return { storeId: store.id, storeName: store.name, total };
      });

      totals.sort((a, b) => a.total - b.total);

      const response = {
        ...data,
        basket: {
          id: "anti-crise-officiel",
          products: basketProducts,
          totals,
          recommendedStore: totals[0],
          priceRange: {
            min: totals[0].total,
            max: totals[totals.length - 1].total,
            delta:
              totals[totals.length - 1].total - totals[0].total,
          },
        },
      };

      return jsonResponse(response, 200);
    } catch (e) {
      return jsonResponse(
        { error: "Erreur interne API", details: String(e) },
        500
      );
    }
  },
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=300",
    },
  });
}