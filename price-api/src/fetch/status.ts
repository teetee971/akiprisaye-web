export function computeFetchJobStatus(counts: { ok: number; error: number }): 'success' | 'partial' | 'failed' {
  if (counts.ok > 0 && counts.error === 0) {
    return 'success';
  }
  if (counts.ok > 0 && counts.error > 0) {
    return 'partial';
  }
  if (counts.ok === 0 && counts.error > 0) {
    return 'failed';
  }
  return 'success';
}
