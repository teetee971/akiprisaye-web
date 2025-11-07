# A KI PRI SA YÉ — Vue 3 + Vite + Tailwind

## Dev
```bash
npm install
npm run dev
```

## Build (Cloudflare Pages)
```bash
npm run build
```
Output: dist/
Node: 18+

## Routing
- API: /api/* (Pages Functions)
- Legacy pages: /comparateur.html, /upload-ticket.html kept
- SPA fallback: /* -> /index.html (see public/_redirects)

## Carousel Images
Place hero1.png hero2.png hero3.png in src/assets/ (replace with .webp if optimized).