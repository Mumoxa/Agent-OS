const API_BASE = process.env.API_BASE ?? 'http://localhost:3000';

export async function api(path: string, options: RequestInit = {}): Promise<Response> {
  return fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
}

export async function apiJson(path: string, options: RequestInit = {}): Promise<any> {
  const response = await api(path, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }
  return response.json();
}

export async function waitFor(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await api('/health');
    return response.ok;
  } catch {
    return false;
  }
}
