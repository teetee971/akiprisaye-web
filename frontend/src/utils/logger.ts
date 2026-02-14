export const isProduction = import.meta.env.PROD;

export function logDebug(...args: unknown[]) {
  if (!isProduction) {
    console.log(...args);
  }
}
