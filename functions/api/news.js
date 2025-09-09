export const onRequestGet = async () => {
  const data = {
    ok: true,
    updatedAt: "2025-09-09",
    items: [
      { territory: "guadeloupe", flag: "🇬🇵", title: "Indice des prix — INSEE", source: "INSEE", url: "https://www.insee.fr/fr/statistiques" },
      { territory: "martinique", flag: "🇲🇶", title: "OPMR — synthèse", source: "Préfecture", url: "https://www.martinique.gouv.fr/" }
    ]
  };
  return new Response(JSON.stringify(data), { headers: { "content-type":"application/json; charset=utf-8" }});
};
