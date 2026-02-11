const emittedDiagnostics = new Set<string>();

/**
 * Emit a runtime diagnostic once per unique key to avoid console spam.
 */
export function logRuntimeIssueOnce(key: string, message: string, details?: unknown): void {
  if (emittedDiagnostics.has(key)) {
    return;
  }

  emittedDiagnostics.add(key);
  console.error(`[RuntimeDiagnostic:${key}] ${message}`, details);
}
