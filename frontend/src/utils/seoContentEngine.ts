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
    'coca-cola-1-5l', 'eau-evian-1-5l', 'jus-orange-tropicana-1l',
    'biere-heineken-33cl', 'orangina-1-5l', 'fanta-1-5l', 'sprite-1-5l',
    'schweppes-1-5l', 'eau-gazeuse-perrier-75cl', 'redbull-25cl',
  ],
  epicerie: [
    'riz-basmati-1kg', 'pates-panzani-500g', 'nutella-400g',
    'huile-tournesol-1l', 'sucre-blanc-1kg', 'farine-ble-1kg',
    'cafe-nescafe-200g', 'chocolat-milka-100g', 'biscuits-lu-200g', 'miel-500g',
  ],
  'produits-laitiers': [
    'lait-entier-1l', 'beurre-president-250g', 'yaourt-nature-pack8',
    'fromage-emmental-200g', 'creme-fraiche-20cl', 'fromage-blanc-500g',
    'lait-demi-ecreme-1l', 'yaourt-fruits-pack4', 'creme-dessert-4pack', 'camembert-250g',
  ],
  viande: [
    'poulet-entier', 'steak-hache-5pc', 'jambon-blanc-4tr',
    'saucisses-knacki-6pc', 'filet-poulet-500g', 'cotes-porc-2pc',
    'boeuf-bourguignon-500g', 'lardons-fumes-200g', 'roti-porc-600g', 'viande-hachee-1kg',
  ],
  'fruits-legumes': [
    'banane-kg', 'tomate-kg', 'ananas-piece',
    'citron-vert-500g', 'avocat-piece', 'mangue-piece',
    'pomme-kg', 'carotte-kg', 'courgette-kg', 'igname-kg',
  ],
  hygiene: [
    'shampooing-elseve-250ml', 'gel-douche-sanex-500ml', 'dentifrice-colgate-75ml',
    'deodorant-narta-200ml', 'savon-dove-100g', 'rasoir-gillette-4pc',
    'coton-400g', 'coton-tiges-300pc', 'masque-hydratant-50ml', 'creme-solaire-spf50-200ml',
  ],
  entretien: [
    'lessive-ariel-30d', 'liquide-vaisselle-fairy-500ml', 'nettoyant-wc-500ml',
    'essuie-tout-6rouleaux', 'papier-toilette-12rouleaux', 'desinfectant-surfaces-750ml',
    'eponge-lavette-5pc', 'sac-poubelle-30l-30pc', 'nettoyant-sol-1l', 'assouplissant-lenor-1l',
  ],
  surgeles: [
    'glaces-magnum-pack4', 'pizza-reine-400g',
    'frites-mc-cain-750g', 'legumes-surgeles-1kg',
    'crevettes-surgeles-500g', 'poissons-pannes-400g',
    'lasagnes-surgeles-400g', 'glaces-cornets-pack6', 'sorbet-fruits-500ml', 'brocolis-surgeles-750g',
  ],
  bebe: [
    'couches-pampers-t3', 'lait-infantile-800g',
    'petits-pots-bebe-200g', 'lingettes-bebe-72pc',
    'lait-2eme-age-900g', 'compote-bebe-4pack', 'couches-t4-40pc', 'couches-t5-38pc', 'lait-croissance-900g', 'gel-bebe-300ml',
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
export function generatePageIntro(
  productName: string,
  territory: string,
  angle: number,
): string {
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
export function generatePriceTip(
  productName: string,
  territory: string,
  angle: number,
): string {
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
  angle: number,
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
  territory: string,
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
          ...ALL_PRODUCTS_FLAT.filter(
            (p) => p !== productSlug && !candidates.includes(p),
          ),
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
