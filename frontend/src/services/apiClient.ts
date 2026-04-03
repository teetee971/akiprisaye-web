const baseURL = 'https://api.akiprisaye.workers.dev';
const defaultHeaders = {
  'Content-Type': 'application/json',
};

type ApiRequestConfig = RequestInit & {
  url?: string;
  params?: Record<string, string | number | boolean | null | undefined>;
  data?: unknown;
};

const buildUrl = (
  path: string,
  params?: Record<string, string | number | boolean | null | undefined>
) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${baseURL}${normalizedPath}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
};

const request = async (path: string, config: ApiRequestConfig = {}) => {
  const { params, data, headers, ...init } = config;
  const response = await fetch(buildUrl(path, params), {
    ...init,
    headers: {
      ...defaultHeaders,
      ...(headers || {}),
    },
    body:
      data !== undefined && data !== null && typeof data !== 'string'
        ? JSON.stringify(data)
        : (data as BodyInit | null | undefined),
  });

  if (!response.ok) {
    const error = new Error(`Request failed with status ${response.status}`);
    console.error('API Error:', response.status, error.message);
    throw error;
  }

  return response;
};

const apiClient = {
  request: (config: ApiRequestConfig) => {
    if (!config.url) {
      throw new Error('apiClient.request requires a url');
    }

    return request(config.url, config);
  },
  get: (url: string, config: ApiRequestConfig = {}) =>
    request(url, { ...config, method: 'GET' }),
  delete: (url: string, config: ApiRequestConfig = {}) =>
    request(url, { ...config, method: 'DELETE' }),
  post: (url: string, data?: unknown, config: ApiRequestConfig = {}) =>
    request(url, { ...config, method: 'POST', data }),
  put: (url: string, data?: unknown, config: ApiRequestConfig = {}) =>
    request(url, { ...config, method: 'PUT', data }),
  patch: (url: string, data?: unknown, config: ApiRequestConfig = {}) =>
    request(url, { ...config, method: 'PATCH', data }),
};
export default apiClient;
