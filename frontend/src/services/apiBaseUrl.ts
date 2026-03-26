// frontend/src/services/apiBaseUrl.ts

const DEV_FALLBACK_API_BASE_URL = "http://localhost:8787";

function resolveProductionApiBaseUrl(): string {
  // adapte selon ton infra
  return "https://api.akiprisaye.com";
}

export function getApiBaseUrl(): string {
  if (import.meta.env.DEV) {
    return DEV_FALLBACK_API_BASE_URL;
  }

  return resolveProductionApiBaseUrl();
}