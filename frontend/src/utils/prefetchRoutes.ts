const prefetchedRoutes = new Set<string>();

type RouteImportFn = () => Promise<unknown>;

const routeImports: Record<string, RouteImportFn> = {
  '/comparateur': () => import('../pages/Comparateur'),
  '/comparateurs': () => import('../pages/Comparateurs'),
  '/carte-itineraires': () => import('../pages/Carte'),
  '/scanner': () => import('../pages/ScannerHub'),
  '/scan-ean': () => import('../pages/ScanEAN'),
  '/assistant-ia': () => import('../pages/IaConseiller'),
  '/observatoire': () => import('../pages/Observatoire'),
  '/alertes': () => import('../pages/Alertes'),
  '/mon-compte': () => import('../pages/MonCompte'),
  '/parametres': () => import('../pages/Settings'),
};

function shouldPrefetch(): boolean {
  if (typeof window === 'undefined') return false;

  if (window.matchMedia && !window.matchMedia('(pointer: fine)').matches) {
    return false;
  }

  const connection =
    (navigator as any).connection ??
    (navigator as any).mozConnection ??
    (navigator as any).webkitConnection;
  if (connection?.saveData) return false;
  if (connection?.effectiveType && ['2g', 'slow-2g'].includes(connection.effectiveType as string)) {
    return false;
  }

  return true;
}

function prefetchDocument(path: string): void {
  if (document.querySelector(`link[rel="prefetch"][href="${path}"]`)) return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'document';
  link.href = path;
  document.head.appendChild(link);
}

/**
 * Prefetch a route's JS chunk and add a document prefetch link.
 * Respects data-saver mode, slow connections, and touch-only devices.
 */
export function prefetchRoute(path: string): void {
  const loader = routeImports[path];
  if (!loader || prefetchedRoutes.has(path) || !shouldPrefetch()) return;

  prefetchedRoutes.add(path);
  prefetchDocument(path);

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => void loader());
  } else {
    setTimeout(() => void loader(), 150);
  }
}
