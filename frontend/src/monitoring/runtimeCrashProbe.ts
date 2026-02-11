const toText = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value instanceof Error) return value.message;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

export function installRuntimeCrashProbe(): void {
  const sha = window.__BUILD_SHA__ ?? 'unknown';
  const logProbe = (...args: unknown[]) => {
    console.error('[CrashProbe]', ...args);
  };

  window.addEventListener('error', (event) => {
    const err = event.error;
    logProbe('sha=', sha);
    logProbe('url=', window.location.href);
    logProbe('message=', event.message || toText(err));
    if (err?.stack) {
      logProbe('stack=', err.stack);
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    logProbe('sha=', sha);
    logProbe('url=', window.location.href);
    logProbe('unhandledrejection=', toText(reason));
    if (reason instanceof Error && reason.stack) {
      logProbe('stack=', reason.stack);
    }
  });
}
