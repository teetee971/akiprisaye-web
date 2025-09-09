export const onRequestGet = async () => {
  const payload = {
    ok: true,
    updatedAt: "2025-09-09",
    items: [
      { territory: "guadeloupe", flag: "🇬🇵", title: "Indice des prix — Insee", source: "INSEE", url: "https://www.insee.fr/fr/statistiques" },
      { territory: "martinique", flag: "🇲🇶", title: "OPMR — synthèse", source: "Préfecture", url: "https://www.martinique.gouv.fr/" }
    ]
  };
  return new Response(JSON.stringify(payload), { headers: { "content-type": "application/json; charset=utf-8" }});
};
