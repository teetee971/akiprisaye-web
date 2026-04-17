/**
 * seoContentEngine.ts — Generates unique, differentiated content for SEO pages
 *
 * Each page gets a deterministic "angle" (0-4) based on a hash of its slug.
 * This ensures the same URL always renders the same content (no hydration mismatch)
 * while making pages textually different from each other.
 *
 * Angles:
 *   0: prix-bas    — focus on cheapest price
 *   1: inflation   — focus on rising costs
 *   2: comparatif  — focus on comparison between retailers
 *   3: economie    — focus on savings/budget
 *   4: guide       — educational / tips
 */

// ── Territory slug names ───────────────────────────────────────────────────────

const TERRITORY_SLUG_NAMES: Record<string, string> = {
  GP: 'guadeloupe',
  MQ: 'martinique',
  GF: 'guyane',
  RE: 'reunion',
  YT: 'mayotte',
};

const TERRITORY_DISPLAY: Record<string, string> = {
  GP: 'Guadeloupe',
  MQ: 'Martinique',
  GF: 'Guyane',
  RE: 'La Réunion',
  YT: 'Mayotte',
};

// ── Minimal product catalog by category ──────────────────────────────────────

const CATALOG_BY_CATEGORY: Record<string, string[]> = {
  boissons: [
    'coca-cola-1-5l',
    'eau-evian-1-5l',
    'jus-orange-tropicana-1l',
    'biere-heineken-33cl',
    'orangina-1-5l',
    'fanta-1-5l',
    'sprite-1-5l',
    'schweppes-1-5l',
    'eau-gazeuse-perrier-75cl',
    'redbull-25cl',
  ],
  epicerie: [
    'riz-basmati-1kg',
    'pates-panzani-500g',
    'nutella-400g',
    'huile-tournesol-1l',
    'sucre-blanc-1kg',
    'farine-ble-1kg',
    'cafe-nescafe-200g',
    'chocolat-milka-100g',
    'biscuits-lu-200g',
    'miel-500g',
  ],
  'produits-laitiers': [
    'lait-entier-1l',
    'beurre-president-250g',
    'yaourt-nature-pack8',
    'fromage-emmental-200g',
    'creme-fraiche-20cl',
    'fromage-blanc-500g',
    'lait-demi-ecreme-1l',
    'yaourt-fruits-pack4',
    'creme-dessert-4pack',
    'camembert-250g',
  ],
  viande: [
    'poulet-entier',
    'steak-hache-5pc',
    'jambon-blanc-4tr',
    'saucisses-knacki-6pc',
    'filet-poulet-500g',
    'cotes-porc-2pc',
    'boeuf-bourguignon-500g',
    'lardons-fumes-200g',
    'roti-porc-600g',
    'viande-hachee-1kg',
  ],
  'fruits-legumes': [
    'banane-kg',
    'tomate-kg',
    'ananas-piece',
    'citron-vert-500g',
    'avocat-piece',
    'mangue-piece',
    'pomme-kg',
    'carotte-kg',
    'courgette-kg',
    'igname-kg',
  ],
  hygiene: [
    'shampooing-elseve-250ml',
    'gel-douche-sanex-500ml',
    'dentifrice-colgate-75ml',
    'deodorant-narta-200ml',
    'savon-dove-100g',
    'rasoir-gillette-4pc',
    'coton-400g',
    'coton-tiges-300pc',
    'masque-hydratant-50ml',
    'creme-solaire-spf50-200ml',
  ],
  entretien: [
    'lessive-ariel-30d',
    'liquide-vaisselle-fairy-500ml',
    'nettoyant-wc-500ml',
    'essuie-tout-6rouleaux',
    'papier-toilette-12rouleaux',
    'desinfectant-surfaces-750ml',
    'eponge-lavette-5pc',
    'sac-poubelle-30l-30pc',
    'nettoyant-sol-1l',
    'assouplissant-lenor-1l',
  ],
  surgeles: [
    'glaces-magnum-pack4',
    'pizza-reine-400g',
    'frites-mc-cain-750g',
    'legumes-surgeles-1kg',
    'crevettes-surgeles-500g',
    'poissons-pannes-400g',
    'lasagnes-surgeles-400g',
    'glaces-cornets-pack6',
    'sorbet-fruits-500ml',
    'brocolis-surgeles-750g',
  ],
  bebe: [
    'couches-pampers-t3',
    'lait-infantile-800g',
    'petits-pots-bebe-200g',
    'lingettes-bebe-72pc',
    'lait-2eme-age-900g',
    'compote-bebe-4pack',
    'couches-t4-40pc',
    'couches-t5-38pc',
    'lait-croissance-900g',
    'gel-bebe-300ml',
  ],
};

const ALL_PRODUCTS_FLAT = Object.values(CATALOG_BY_CATEGORY).flat();

// ── Hash function for determinism ─────────────────────────────────────────────

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  return hash;
}

// ── Public API ─────────────────────────────────────────────────────────────────

/**
 * Returns a deterministic angle (0-4) for a given slug.
 * Same slug always returns same angle — no randomness.
 */
export function getPageAngle(slug: string): 0 | 1 | 2 | 3 | 4 {
  return (djb2Hash(slug) % 5) as 0 | 1 | 2 | 3 | 4;
}

/**
 * Generates a 2-3 sentence introduction unique to the angle.
 */
export function generatePageIntro(productName: string, territory: string, angle: number): string {
  const tName = TERRITORY_DISPLAY[territory] ?? territory;
  const intros: string[] = [
    // 0: prix-bas
    `En ${tName}, trouver ${productName} au meilleur prix peut faire une vraie différence sur votre budget mensuel. ` +
      `Notre comparateur analyse quotidiennement les tarifs dans toutes les grandes enseignes locales. ` +
      `Ci-dessous, vous trouverez le prix le plus bas du moment ainsi que le classement complet des supermarchés.`,

    // 1: inflation
    `Le prix de ${productName} en ${tName} a évolué de manière significative ces derniers mois, sous l'effet de l'inflation et des coûts logistiques. ` +
      `Comme dans l'ensemble des territoires d'outre-mer, les consommateurs font face à des prix structurellement plus élevés qu'en métropole. ` +
      `Notre comparateur vous aide à trouver l'enseigne la moins touchée par ces hausses.`,

    // 2: comparatif
    `Comparer le prix de ${productName} entre les différentes enseignes en ${tName} est essentiel pour faire des économies. ` +
      `Selon notre analyse, l'écart de prix entre l'enseigne la moins chère et la plus chère peut dépasser 30% pour ce produit. ` +
      `Découvrez ci-dessous le comparatif détaillé par supermarché.`,

    // 3: economie
    `Économiser sur ${productName} en ${tName} est possible si l'on sait où chercher. ` +
      `Les ménages des DOM consacrent en moyenne 25 à 35% de leur revenu à l'alimentation — bien plus qu'en métropole. ` +
      `Notre outil de comparaison vous permet d'identifier immédiatement l'offre la plus avantageuse.`,

    // 4: guide
    `Tout ce que vous devez savoir sur le prix de ${productName} en ${tName} : où l'acheter, à quel prix, et comment éviter les mauvaises surprises. ` +
      `Ce guide pratique compare les principaux supermarchés et vous donne des conseils concrets pour optimiser votre budget courses. ` +
      `Les données sont mises à jour régulièrement pour refléter les prix actuels du marché.`,
  ];
  return intros[angle % intros.length] ?? intros[0];
}

/**
 * Generates 1-2 sentences of price tips for the given angle.
 */
export function generatePriceTip(productName: string, territory: string, angle: number): string {
  const tName = TERRITORY_DISPLAY[territory] ?? territory;
  const tips: string[] = [
    // 0: prix-bas
    `💡 Astuce : le prix de ${productName} est souvent moins élevé en début de semaine lors des réassorts. Comparez aussi les marques distributeur, parfois 20 à 40% moins chères.`,
    // 1: inflation
    `📈 Impact inflation : en ${tName}, le coût du transport maritime représente jusqu'à 15% du prix final de ${productName}. Acheter en gros ou profiter des promotions permet de lisser ce surcoût.`,
    // 2: comparatif
    `🔍 Bon à savoir : E.Leclerc et Leader Price proposent régulièrement des prix agressifs sur ${productName} en ${tName}. Vérifiez aussi les catalogues en ligne avant de vous déplacer.`,
    // 3: economie
    `💰 Économie maximale : en achetant ${productName} chez l'enseigne la moins chère en ${tName}, vous pouvez économiser l'équivalent de plusieurs euros par mois sur ce seul produit.`,
    // 4: guide
    `📌 Conseil d'expert : privilégiez les achats de ${productName} lors des semaines promotionnelles (Semaine du Goût, Foire Alimentaire) pour bénéficier de réductions importantes en ${tName}.`,
  ];
  return tips[angle % tips.length] ?? tips[0];
}

/**
 * Generates 3 FAQ items (with q and a) deterministic per angle.
 */
export function generateFaqItems(
  productName: string,
  territory: string,
  angle: number
): Array<{ q: string; a: string }> {
  const tName = TERRITORY_DISPLAY[territory] ?? territory;
  const faqSets: Array<Array<{ q: string; a: string }>> = [
    // 0: prix-bas
    [
      {
        q: `Où acheter ${productName} moins cher en ${tName} ?`,
        a: `D'après notre comparateur, E.Leclerc et Leader Price proposent généralement les prix les plus bas pour ${productName} en ${tName}. Consultez le tableau ci-dessus pour voir le classement actualisé.`,
      },
      {
        q: `Quel est le prix normal de ${productName} en ${tName} ?`,
        a: `En ${tName}, le prix habituel de ${productName} se situe entre 1,50 € et 5,00 € selon les enseignes et les promotions en cours. Notre comparateur affiche le prix exact du jour.`,
      },
      {
        q: `Y a-t-il des promos sur ${productName} en ${tName} ?`,
        a: `Oui, les enseignes de ${tName} proposent régulièrement des promotions sur ${productName}, notamment lors des foires alimentaires et des semaines thématiques. Consultez notre comparateur pour ne rien manquer.`,
      },
    ],
    // 1: inflation
    [
      {
        q: `Pourquoi ${productName} est-il plus cher en ${tName} qu'en métropole ?`,
        a: `Le surcoût de ${productName} en ${tName} s'explique principalement par les frais de fret maritime (transport depuis la métropole ou l'international), les taxes locales et les marges des distributeurs. Ce surcoût peut représenter 15 à 30% du prix métropolitain.`,
      },
      {
        q: `Le prix de ${productName} a-t-il augmenté récemment en ${tName} ?`,
        a: `Comme dans l'ensemble des DOM, ${productName} a subi plusieurs hausses de prix entre 2023 et 2026 en ${tName}, liées à l'inflation mondiale et à l'augmentation des coûts d'importation. Notre historique de prix vous permet de suivre ces évolutions.`,
      },
      {
        q: `Comment limiter l'impact de l'inflation sur ${productName} en ${tName} ?`,
        a: `Pour réduire votre dépense sur ${productName} malgré l'inflation en ${tName} : comparez les enseignes avec notre outil, privilégiez les marques distributeur et profitez des offres promotionnelles hebdomadaires.`,
      },
    ],
    // 2: comparatif
    [
      {
        q: `Quelle enseigne vend ${productName} le moins cher en ${tName} ?`,
        a: `Notre comparaison en temps réel montre que le prix le plus bas pour ${productName} en ${tName} est généralement chez E.Leclerc ou Leader Price. Consultez le tableau pour voir le classement du jour.`,
      },
      {
        q: `Quelle est la différence de prix entre Carrefour et Leclerc pour ${productName} en ${tName} ?`,
        a: `L'écart de prix entre Carrefour et E.Leclerc pour ${productName} en ${tName} peut varier de 0,20 € à plus d'1 € selon les périodes et promotions en cours. Notre comparateur affiche l'écart actualisé quotidiennement.`,
      },
      {
        q: `Vaut-il mieux acheter ${productName} en gros ou à l'unité en ${tName} ?`,
        a: `Acheter ${productName} en formats familiaux ou en pack permet généralement de réaliser une économie de 10 à 20% par rapport au prix unitaire dans la plupart des enseignes de ${tName}.`,
      },
    ],
    // 3: economie
    [
      {
        q: `Combien peut-on économiser sur ${productName} en comparant les enseignes de ${tName} ?`,
        a: `En choisissant l'enseigne la moins chère pour ${productName} en ${tName}, un ménage peut économiser entre 2 € et 15 € par mois selon sa fréquence d'achat. Sur un an, cela représente une économie substantielle.`,
      },
      {
        q: `Existe-t-il des alternatives moins chères à ${productName} en ${tName} ?`,
        a: `Oui, les marques de distributeur (Carrefour, U, Leclerc) proposent des alternatives à ${productName} souvent 20 à 40% moins chères, avec une qualité comparable pour un usage quotidien.`,
      },
      {
        q: `Comment optimiser mon budget courses pour ${productName} en ${tName} ?`,
        a: `Pour optimiser votre budget ${productName} en ${tName} : comparez les prix avec notre outil avant chaque achat, profitez des promotions du catalogue, achetez en lot quand le prix est bas, et considérez les marques distributeur.`,
      },
    ],
    // 4: guide
    [
      {
        q: `Qu'est-ce qui détermine le prix de ${productName} en ${tName} ?`,
        a: `Le prix de ${productName} en ${tName} est déterminé par plusieurs facteurs : le coût de production ou d'importation, les frais de transport maritime, les taxes locales (octroi de mer), la marge du distributeur et la concurrence locale entre enseignes.`,
      },
      {
        q: `Comment fonctionne le comparateur de prix pour ${productName} en ${tName} ?`,
        a: `Notre comparateur collecte les prix de ${productName} dans toutes les grandes enseignes de ${tName} (Carrefour, E.Leclerc, Super U, Leader Price, Intermarché) et les affiche classés du moins cher au plus cher, mis à jour quotidiennement.`,
      },
      {
        q: `À quelle fréquence les prix de ${productName} changent-ils en ${tName} ?`,
        a: `En ${tName}, les prix de ${productName} peuvent changer plusieurs fois par semaine selon les promotions, les réassorts et les variations de coûts logistiques. Notre comparateur est mis à jour quotidiennement pour refléter les prix actuels.`,
      },
    ],
  ];
  return faqSets[angle % faqSets.length] ?? faqSets[0];
}

/**
 * Returns 5 similar product slugs in the same territory.
 * Deterministic: same input always returns same output.
 * Excludes the input slug itself.
 */
export function getSimilarProductSlugs(
  productSlug: string,
  category: string,
  territory: string
): string[] {
  const tSlug = TERRITORY_SLUG_NAMES[territory] ?? 'guadeloupe';

  // Get products from the same category, fallback to all products
  const pool = CATALOG_BY_CATEGORY[category] ?? ALL_PRODUCTS_FLAT;

  // Filter out the current product
  const candidates = pool.filter((p) => p !== productSlug);

  // If not enough in category, supplement with cross-category products
  const supplemented =
    candidates.length >= 5
      ? candidates
      : [
          ...candidates,
          ...ALL_PRODUCTS_FLAT.filter((p) => p !== productSlug && !candidates.includes(p)),
        ];

  // Deterministic selection via hash
  const hash = djb2Hash(productSlug + territory);
  const start = hash % Math.max(1, supplemented.length - 5);
  const selected = supplemented.slice(start, start + 5);

  // Pad if needed
  while (selected.length < 5 && supplemented.length > 0) {
    const next = supplemented[selected.length % supplemented.length];
    if (!selected.includes(next)) selected.push(next);
    else break;
  }

  return selected.slice(0, 5).map((slug) => `${slug}-${tSlug}`);
}

// ── Typed Content Engine API (PR #12) ────────────────────────────────────────

export type PageType = 'product' | 'category' | 'comparison' | 'inflation' | 'pillar';
export type PriceTrend = 'down' | 'up' | 'stable';

export interface ContentInput {
  pageType: PageType;
  productName?: string;
  categoryName?: string;
  territoryName?: string;
  retailerName?: string;
  trend?: PriceTrend;
  bestPrice?: number | null;
  averagePrice?: number | null;
  savings?: number | null;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ContentSection {
  title: string;
  body: string;
}

export interface GeneratedContent {
  intro: string;
  summary: string;
  faq: FAQItem[];
  sections: ContentSection[];
}

// ── Internal string pools ─────────────────────────────────────────────────────

const PRODUCT_INTROS = [
  (p: string, t: string, price: string) =>
    `Découvrez le meilleur prix pour ${p} en ${t}. Notre comparateur analyse en temps réel les offres des supermarchés locaux pour vous faire économiser. Prix actuel à partir de ${price}.`,
  (p: string, t: string, price: string) =>
    `Comparez le prix de ${p} dans tous les supermarchés de ${t}. Avec notre observatoire des prix, trouvez l'offre la moins chère aujourd'hui — dès ${price}.`,
  (p: string, t: string, price: string) =>
    `${p} en ${t} : qui vend le moins cher ? Notre comparateur indépendant recense les prix du marché local. Meilleur prix constaté : ${price}.`,
];

const CATEGORY_INTROS = [
  (c: string, t: string) =>
    `Suivez l'évolution des prix dans la catégorie ${c} en ${t}. Notre observatoire indépendant vous aide à identifier les meilleures offres du moment.`,
  (c: string, t: string) =>
    `Les prix de la catégorie ${c} en ${t} sont-ils en hausse ? Consultez notre baromètre mis à jour régulièrement pour comparer les enseignes locales.`,
  (c: string, t: string) =>
    `Analyse des prix ${c} en ${t} : tendances, variations et enseignes les moins chères. Données collectées auprès des supermarchés locaux.`,
];

const COMPARISON_INTROS = [
  (r1: string, r2: string, t: string) =>
    `Qui est vraiment moins cher entre ${r1} et ${r2} en ${t} ? Notre comparatif indépendant analyse des centaines de produits pour vous donner une réponse claire.`,
  (r1: string, r2: string, t: string) =>
    `${r1} vs ${r2} en ${t} : le grand comparatif de prix. Découvrez quelle enseigne remporte la bataille du pouvoir d'achat en Outre-mer.`,
  (r1: string, r2: string, t: string) =>
    `Comparer ${r1} et ${r2} en ${t} pour faire le bon choix. Notre analyse couvre l'ensemble des rayons pour un résultat objectif et actualisé.`,
];

const INFLATION_INTROS = [
  (t: string) =>
    `L'inflation alimentaire en ${t} continue d'impacter les ménages. Retrouvez ici l'analyse des tendances de prix et les produits les plus touchés.`,
  (t: string) =>
    `Évolution des prix en ${t} : notre baromètre inflation décode les hausses et baisses de prix pour vous aider à anticiper votre budget.`,
  (t: string) =>
    `Inflation en ${t} : quels produits ont le plus augmenté ? Notre observatoire suit l'évolution des prix alimentaires mois après mois.`,
];

const PILLAR_INTROS = [
  (t: string) =>
    `Guide complet des prix alimentaires en ${t} : comparaison des enseignes, tendances inflation, produits moins chers et conseils pour mieux consommer local.`,
  (t: string) =>
    `Tout savoir sur les prix alimentaires en ${t}. Ce guide regroupe analyses, comparatifs et données de terrain pour vous aider à maîtriser votre budget courses.`,
  (t: string) =>
    `${t} : le guide de référence pour comparer les prix alimentaires. Enseignes, produits, tendances — une ressource complète mise à jour régulièrement.`,
];

function pick<T>(arr: T[], idx: number): T {
  return arr[idx % arr.length];
}

function fmt(price: number | null | undefined): string {
  if (price == null) return '—';
  return price.toFixed(2) + ' €';
}

// ── generateSeoContent ────────────────────────────────────────────────────────

export function generateSeoContent(input: ContentInput): GeneratedContent {
  const variantKey =
    (input.pageType ?? '') + (input.productName ?? '') + (input.territoryName ?? '');
  const v = djb2Hash(variantKey) % 3;

  const product = input.productName ?? 'ce produit';
  const category = input.categoryName ?? 'cette catégorie';
  const territory = input.territoryName ?? 'les DOM-COM';
  const retailer1 = input.retailerName ?? 'Carrefour';
  const retailer2 = 'E.Leclerc';
  const bestPriceFmt = fmt(input.bestPrice);
  const avgPriceFmt = fmt(input.averagePrice);
  const savingsFmt = fmt(input.savings);
  const trendLabel =
    input.trend === 'down' ? 'en baisse' : input.trend === 'up' ? 'en hausse' : 'stable';

  switch (input.pageType) {
    case 'product': {
      const intro = pick(PRODUCT_INTROS, v)(product, territory, bestPriceFmt);
      return {
        intro,
        summary: `${product} est disponible en ${territory} à partir de ${bestPriceFmt} (prix moyen observé : ${avgPriceFmt}). Vous pouvez économiser jusqu'à ${savingsFmt} en choisissant l'enseigne la moins chère.`,
        faq: [
          {
            question: `Quel est le prix de ${product} en ${territory} ?`,
            answer: `Le prix de ${product} en ${territory} varie entre ${bestPriceFmt} et ${avgPriceFmt} selon les enseignes. Notre comparateur est mis à jour régulièrement.`,
          },
          {
            question: `Où trouver ${product} au meilleur prix en ${territory} ?`,
            answer: `Notre comparateur indique que le meilleur prix pour ${product} en ${territory} est actuellement de ${bestPriceFmt}. Consultez le tableau de comparaison pour voir toutes les enseignes.`,
          },
          {
            question: `Le prix de ${product} a-t-il augmenté en ${territory} ?`,
            answer: `La tendance des prix pour ${product} en ${territory} est actuellement ${trendLabel}. Suivez notre observatoire pour être alerté des variations.`,
          },
        ],
        sections: [
          {
            title: `Comparaison des prix de ${product} en ${territory}`,
            body: `Notre observatoire recense les prix pratiqués par les principales enseignes de ${territory}. Le prix le plus bas constaté est de ${bestPriceFmt}, tandis que le prix moyen du marché est de ${avgPriceFmt}. En choisissant le bon supermarché, vous pouvez économiser ${savingsFmt} sur cet article.`,
          },
          {
            title: `Pourquoi les prix varient-ils en ${territory} ?`,
            body: `Les prix en ${territory} sont influencés par plusieurs facteurs : coûts de transport maritime, taxes d'importation, politiques commerciales des enseignes et concurrence locale. Notre outil vous permet de naviguer ces variations pour toujours trouver le meilleur prix.`,
          },
        ],
      };
    }

    case 'category': {
      const intro = pick(CATEGORY_INTROS, v)(category, territory);
      return {
        intro,
        summary: `Les prix de la catégorie ${category} en ${territory} sont en moyenne de ${avgPriceFmt}. La tendance actuelle est ${trendLabel}. Comparez les enseignes pour optimiser vos achats.`,
        faq: [
          {
            question: `Quels sont les prix moyens pour ${category} en ${territory} ?`,
            answer: `Le prix moyen observé pour ${category} en ${territory} est de ${avgPriceFmt}. Les prix varient selon les enseignes et les promotions en cours.`,
          },
          {
            question: `Quelle enseigne est la moins chère pour ${category} en ${territory} ?`,
            answer: `Notre comparateur analyse les prix de toutes les grandes enseignes de ${territory} pour la catégorie ${category}. Consultez le classement mis à jour régulièrement.`,
          },
          {
            question: `L'inflation touche-t-elle les prix ${category} en ${territory} ?`,
            answer: `La tendance des prix ${category} en ${territory} est actuellement ${trendLabel}. Notre baromètre suit l'évolution mensuelle pour vous aider à anticiper vos dépenses.`,
          },
        ],
        sections: [
          {
            title: `Évolution des prix ${category} en ${territory}`,
            body: `Les prix de la catégorie ${category} en ${territory} ont connu des variations significatives ces derniers mois. Notre observatoire suit ces évolutions pour vous offrir une vision claire du marché local.`,
          },
          {
            title: `Comment économiser sur ${category} en ${territory} ?`,
            body: `Pour réduire vos dépenses en ${category} en ${territory}, comparez systématiquement les prix entre les enseignes, suivez les promotions et adaptez vos achats aux meilleures offres du moment.`,
          },
        ],
      };
    }

    case 'comparison': {
      const intro = pick(COMPARISON_INTROS, v)(retailer1, retailer2, territory);
      return {
        intro,
        summary: `Comparaison ${retailer1} vs ${retailer2} en ${territory} : découvrez quelle enseigne propose les meilleurs prix sur l'ensemble des rayons. Économie potentielle : ${savingsFmt} par mois.`,
        faq: [
          {
            question: `${retailer1} ou ${retailer2} : qui est moins cher en ${territory} ?`,
            answer: `Notre comparatif indépendant analyse les prix des deux enseignes en ${territory} sur des centaines de produits. Le résultat varie selon les rayons et les périodes de promotion.`,
          },
          {
            question: `Quelle est la différence de prix entre ${retailer1} et ${retailer2} en ${territory} ?`,
            answer: `En moyenne, l'écart de prix entre ${retailer1} et ${retailer2} en ${territory} peut représenter ${savingsFmt} sur un panier type. Consultez notre comparatif détaillé par rayon.`,
          },
          {
            question: `Y a-t-il des promotions exclusives chez ${retailer1} ou ${retailer2} en ${territory} ?`,
            answer: `Les deux enseignes proposent régulièrement des promotions spécifiques à leurs magasins en ${territory}. Notre observatoire recense les meilleures offres en temps réel.`,
          },
        ],
        sections: [
          {
            title: `${retailer1} vs ${retailer2} : analyse rayon par rayon`,
            body: `Notre comparatif détaillé de ${retailer1} et ${retailer2} en ${territory} couvre tous les rayons principaux : produits frais, épicerie, boissons, produits d'entretien et hygiène. Les écarts de prix peuvent être significatifs selon les catégories.`,
          },
          {
            title: `Quelle enseigne choisir en ${territory} ?`,
            body: `Le choix entre ${retailer1} et ${retailer2} en ${territory} dépend de vos habitudes de consommation. Pour optimiser votre budget, consultez notre guide des prix par rayon et profitez des promotions croisées.`,
          },
        ],
      };
    }

    case 'inflation': {
      const intro = pick(INFLATION_INTROS, v)(territory);
      return {
        intro,
        summary: `Suivi de l'inflation en ${territory} : les prix alimentaires sont actuellement ${trendLabel}. Notre baromètre analyse les variations mensuelles pour vous aider à adapter votre budget.`,
        faq: [
          {
            question: `Quel est le taux d'inflation alimentaire en ${territory} ?`,
            answer: `L'inflation alimentaire en ${territory} est suivie par notre observatoire indépendant. La tendance actuelle est ${trendLabel} avec un impact variable selon les catégories de produits.`,
          },
          {
            question: `Quels produits sont les plus touchés par l'inflation en ${territory} ?`,
            answer: `En ${territory}, les produits les plus sensibles à l'inflation incluent les fruits et légumes importés, les produits laitiers et certaines denrées d'épicerie. Notre analyse détaille l'évolution par catégorie.`,
          },
        ],
        sections: [
          {
            title: `Baromètre inflation alimentaire ${territory}`,
            body: `Notre baromètre suit l'évolution mensuelle des prix alimentaires en ${territory}. Les données sont collectées auprès des principales enseignes et comparées aux prix de référence nationaux.`,
          },
          {
            title: `Impact de l'inflation sur le pouvoir d'achat en ${territory}`,
            body: `L'inflation en ${territory} affecte différemment les ménages selon leur profil de consommation. Notre simulateur de budget vous permet d'estimer l'impact sur votre foyer et de trouver des stratégies d'économie adaptées.`,
          },
        ],
      };
    }

    case 'pillar': {
      const intro = pick(PILLAR_INTROS, v)(territory);
      return {
        intro,
        summary: `Ressource complète sur les prix alimentaires en ${territory} : comparaison des enseignes, suivi de l'inflation, produits les moins chers et conseils pratiques pour maîtriser votre budget courses en Outre-mer.`,
        faq: [
          {
            question: `Comment comparer les prix en ${territory} ?`,
            answer: `Notre comparateur de prix en ${territory} vous permet de comparer instantanément les tarifs des principales enseignes (Carrefour, E.Leclerc, Leader Price, Super U, Intermarché) sur des milliers de produits.`,
          },
          {
            question: `Pourquoi les prix sont-ils plus élevés en ${territory} qu'en métropole ?`,
            answer: `Les prix en ${territory} sont généralement plus élevés en raison des coûts de transport maritime, des taxes d'importation et de l'insularité. Notre observatoire quantifie ces écarts et aide les consommateurs à trouver les meilleures offres locales.`,
          },
          {
            question: `Quels sont les produits les moins chers en ${territory} ?`,
            answer: `Certains produits locaux ou fabriqués sur place sont moins chers en ${territory}. Notre outil identifie les meilleures opportunités d'achat pour optimiser votre budget courses.`,
          },
        ],
        sections: [
          {
            title: `Comparatif des grandes enseignes en ${territory}`,
            body: `En ${territory}, plusieurs grandes enseignes se disputent le marché de la grande distribution. Notre analyse comparative couvre Carrefour, E.Leclerc, Leader Price, Super U et Intermarché — avec des données actualisées sur les prix pratiqués par rayon.`,
          },
          {
            title: `Tendances des prix alimentaires en ${territory}`,
            body: `Les prix alimentaires en ${territory} évoluent sous l'effet de l'inflation, des politiques d'approvisionnement et de la concurrence locale. Notre baromètre mensuel vous tient informé des principales variations.`,
          },
          {
            title: `Conseils pour économiser sur vos courses en ${territory}`,
            body: `Pour réduire votre budget courses en ${territory} : comparez les prix avant d'acheter, profitez des promotions croisées, privilégiez les produits locaux quand c'est possible, et utilisez notre alertes de prix pour ne jamais rater une bonne affaire.`,
          },
        ],
      };
    }

    default: {
      return {
        intro: `Découvrez les meilleures offres et comparez les prix en ${territory} avec notre observatoire indépendant.`,
        summary: `Notre outil de comparaison de prix vous aide à faire les meilleurs choix en ${territory}.`,
        faq: [],
        sections: [],
      };
    }
  }
}

// ── buildFaqJsonLdFromItems ───────────────────────────────────────────────────

export function buildFaqJsonLdFromItems(items: FAQItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
