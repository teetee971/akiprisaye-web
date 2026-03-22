/**
 * Config Integrity Utility
 * Runtime validation helpers that enforce schema-first discipline.
 *
 * Use at module load time to detect enum/config drift early.
 */

/**
 * Assert that two key sets match exactly — no missing, no extra.
 * Throws at startup if the config is out of sync with the enum (or vice-versa).
 *
 * @param expectedKeys - Keys that must all be present (e.g. Object.values(PrismaEnum))
 * @param actualKeys   - Keys that are actually present (e.g. Object.keys(CONFIG))
 * @param label        - Human-readable name used in the error message
 */
export function assertConfigIntegrity(
  expectedKeys: string[],
  actualKeys: string[],
  label: string
): void {
  const missing = expectedKeys.filter((k) => !actualKeys.includes(k));
  const extra = actualKeys.filter((k) => !expectedKeys.includes(k));

  if (missing.length || extra.length) {
    throw new Error(
      `${label} mismatch. Missing: ${missing.join(', ') || 'none'}. Extra: ${extra.join(', ') || 'none'}`
    );
  }
}
