export function isStaticPreviewEnv(): boolean {
  if (typeof window === 'undefined') return false;
  return /github\.io/i.test(window.location.hostname);
}

export function getAdminDegradedModeReason(): string {
  if (!isStaticPreviewEnv()) return '';
  return 'Mode dégradé preview statique: les appels API admin sont désactivés sur cet environnement.';
}
