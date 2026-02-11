const emittedDiagnostics = new Set<string>();

/**
 * Emit a runtime diagnostic once per unique key to avoid console spam.
 */
export function logRuntimeIssueOnce(key: string, message: string, details?: unknown): void {
  if (!import.meta.env.DEV) {
    return;
  }

  if (emittedDiagnostics.has(key)) {
    return;
  }

  emittedDiagnostics.add(key);
  if (typeof details === 'undefined') {
    console.warn(`[RuntimeDiagnostic:${key}] ${message}`);
    return;
  }

  console.warn(`[RuntimeDiagnostic:${key}] ${message}`, details);
}
