// Centralized API helpers with runtime environment checks

let warned = false;

export function getApiBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (!baseUrl && !warned) {
    console.warn(
      'VITE_API_BASE_URL is not defined. API requests will use relative paths. Set this variable in your .env file.'
    );
    warned = true;
  }
  return baseUrl || '';
}

export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path}`;
  return fetch(url, init);
}
