/**
 * Cloudflare Pages Function
 * GET /news?territory=guadeloupe
 * Agrège quelques flux d'actualité par territoire et renvoie JSON { items: [...] }
 * NB: Parser RSS très light (title/link/pubDate/description)
 */
export async function onRequest({ request }) {
  const url = new URL(request.url);
  const terr = (url.searchParams.get("territory")||"guadeloupe").toLowerCase();
  const category = (url.searchParams.get("category")||"all").toLowerCase();

  // Sources par territoire (ajustables)
  const SRC = {
    "guadeloupe": [
      "https://www.guadeloupe.gouv.fr/layout/set/atom",
      "https://www.outre-mer.gouv.fr/flux-rss.xml"
    ],
    "martinique": [
      "https://www.martinique.gouv.fr/layout/set/atom",
      "https://www.outre-mer.gouv.fr/flux-rss.xml"
    ],
    "guyane": [
      "https://www.guyane.gouv.fr/layout/set/atom",
      "https://www.outre-mer.gouv.fr/flux-rss.xml"
    ],
    "reunion": [
      "https://www.reunion.gouv.fr/layout/set/atom",
      "https://www.outre-mer.gouv.fr/flux-rss.xml"
    ],
    "mayotte": [
      "https://www.mayotte.gouv.fr/layout/set/atom",
      "https://www.outre-mer.gouv.fr/flux-rss.xml"
    ],
    "saint-martin": [
      "https://www.saint-barth-saint-martin.gouv.fr/layout/set/atom",
      "https://www.outre-mer.gouv.fr/flux-rss.xml"
    ],
    "saint-barthelemy": [
      "https://www.saint-barth-saint-martin.gouv.fr/layout/set/atom",
      "https://www.outre-mer.gouv.fr/flux-rss.xml"
    ],
    "polynesie-francaise": [
      "https://www.polynesie-francaise.pref.gouv.fr/layout/set/atom",
      "https://www.outre-mer.gouv.fr/flux-rss.xml"
    ],
    "nouvelle-caledonie": [
      "https://www.nouvelle-caledonie.gouv.fr/layout/set/atom",
      "https://www.outre-mer.gouv.fr/flux-rss.xml"
    ],
    "wallis-et-futuna": [
      "https://www.wallis-et-futuna.gouv.fr/layout/set/atom",
      "https://www.outre-mer.gouv.fr/flux-rss.xml"
    ]
  };

  const FEEDS = SRC[terr] || SRC["guadeloupe"];

  // Categories avec leurs mots-clés respectifs
  const CATEGORY_KEYWORDS = {
    "vie-chere": /vie\s*ch[eè]re|inflation|pouvoir\s*d.achat|budget\s*familial|cherté/iu,
    "dom-tom": /dom[\s-]*tom|outre[\s-]*mer|territoire\s*français|collectivité|départements?\s*d.outre[\s-]*mer/iu,
    "comparatif-prix": /prix|comparatif|tarif|coût|économie|consommation|panier|produit/iu,
    "all": /vie\s*ch[eè]re|prix|inflation|consommation|pouvoir\s*d.achat|panier|territoire|dom|tom|outre[\s-]*mer/iu
  };

  const KEYWORDS = CATEGORY_KEYWORDS[category] || CATEGORY_KEYWORDS["all"];

  const take = (s,n=10)=>s.slice(0,n);

  // Fonction pour déterminer la catégorie d'un article
  function getArticleCategory(text) {
    const txt = text.toLowerCase();
    if (/vie\s*ch[eè]re|inflation|pouvoir\s*d.achat|budget\s*familial|cherté/i.test(txt)) return 'vie-chere';
    if (/comparatif|prix|tarif|coût|économie|consommation|panier/i.test(txt)) return 'comparatif-prix';
    if (/dom[\s-]*tom|outre[\s-]*mer|territoire\s*français|collectivité/i.test(txt)) return 'dom-tom';
    return 'general';
  }

  async function fetchFeed(u){
    try{
      const r = await fetch(u, { headers: { "User-Agent": "akiprisaye-bot" }});
      const xml = await r.text();
      const items = [];
      // Très simple extraction RSS/Atom
      const REG_ITEM = /<(item|entry)[\s\S]*?<\/(item|entry)>/gim;
      const REG = {
        title: /<title[^>]*>([\s\S]*?)<\/title>/i,
        link: /<link[^>]*>([\s\S]*?)<\/link>|<link[^>]*href="([^"]+)"/i,
        date: /<pubDate[^>]*>([\s\S]*?)<\/pubDate>|<updated[^>]*>([\s\S]*?)<\/updated>/i,
        desc: /<description[^>]*>([\s\S]*?)<\/description>|<summary[^>]*>([\s\S]*?)<\/summary>/i,
        source: /<title[^>]*>([\s\S]*?)<\/title>/i
      };
      const site = (xml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'source').trim();
      for(const m of xml.matchAll(REG_ITEM)){
        const block = m[0];
        const title = (block.match(REG.title)?.[1]||"").replace(/<!\[CDATA\[|\]\]>/g,'').trim();
        const linkM = block.match(REG.link);
        const link = (linkM?.[2]||linkM?.[1]||"").replace(/<!\[CDATA\[|\]\]>/g,'').trim();
        const date = (block.match(REG.date)?.[1]||block.match(REG.date)?.[2]||"").trim();
        const desc = (block.match(REG.desc)?.[1]||block.match(REG.desc)?.[2]||"").replace(/<!\[CDATA\[|\]\]>/g,'').trim();
        if(title && link){
          items.push({ 
            title, 
            link, 
            date: date || new Date().toISOString(), 
            summary: desc, 
            source: site,
            territory: terr,
            category: getArticleCategory(title + " " + desc)
          });
        }
      }
      return take(items, 15);
    }catch(e){
      return [];
    }
  }

  const all = (await Promise.all(FEEDS.map(fetchFeed))).flat();
  const filtered = all.filter(x => KEYWORDS.test((x.title+" "+(x.summary||""))));

  return new Response(JSON.stringify({
    ok:true, 
    territory: terr, 
    category: category,
    fetchedAt: new Date().toISOString(),
    items: take(filtered.sort((a,b)=> (new Date(b.date) - new Date(a.date))), 40)
  }), { headers: { "content-type":"application/json; charset=utf-8", "cache-control":"public, max-age=300" }});
}
