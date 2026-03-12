export function normalizeBase(input: string) {
  let base = (input || '/').trim();
  if (!base.startsWith('/')) base = `/${base}`;
  if (!base.endsWith('/')) base = `${base}/`;
  return base;
}

export function resolveBasePath(env: NodeJS.ProcessEnv = process.env) {
  return env.BASE_PATH ? normalizeBase(env.BASE_PATH) : '/';
}
