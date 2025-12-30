import fs from "fs";

const pages = [
  "",
  "comparateur.html",
  "scanner.html",
  "carte.html",
  "actualites.html",
  "modules.html",
  "mentions.html"
];

let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

pages.forEach(p => {
  sitemap += `  <url><loc>https://akiprisaye-web.pages.dev/${p}</loc></url>\n`;
});

sitemap += "</urlset>";

fs.writeFileSync("sitemap.xml", sitemap);
fs.writeFileSync("robots.txt", "Sitemap: https://akiprisaye-web.pages.dev/sitemap.xml");

console.log("✔ sitemap.xml + robots.txt générés");
