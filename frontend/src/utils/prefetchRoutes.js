const prefetchedRoutes = new Set();

const routeImports = {
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

const shouldPrefetch = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (window.matchMedia && !window.matchMedia('(pointer: fine)').matches) {
    return false;
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (connection?.saveData) {
    return false;
  }

  if (connection?.effectiveType && ['2g', 'slow-2g'].includes(connection.effectiveType)) {
    return false;
  }

  return true;
};

const prefetchDocument = (path) => {
  if (document.querySelector(`link[rel="prefetch"][href="${path}"]`)) {
    return;
  }

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.as = 'document';
  link.href = path;
  document.head.appendChild(link);
};

export const prefetchRoute = (path) => {
  const loader = routeImports[path];
  if (!loader || prefetchedRoutes.has(path) || !shouldPrefetch()) {
    return;
  }

  prefetchedRoutes.add(path);
  prefetchDocument(path);

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => loader());
  } else {
    setTimeout(() => loader(), 150);
  }
};
