export interface ApiClientConfig {
  baseUrl: string;
  token?: string;
  fetchImpl?: typeof fetch;
}

type QueryParams = Record<string, string | number | boolean | undefined | null>;

const buildUrl = (baseUrl: string, path: string, params?: QueryParams) => {
  const trimmedBase = baseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${trimmedBase}${normalizedPath}`;
  if (!params) return url;
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== '',
  );
  if (filtered.length === 0) return url;
  const search = new URLSearchParams();
  for (const [k, v] of filtered) search.append(k, String(v));
  return `${url}?${search.toString()}`;
};

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export class ApiClient {
  private baseUrl: string;
  private token?: string;
  private fetchImpl: typeof fetch;
  private connected = true;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.token = config.token;
    this.fetchImpl = config.fetchImpl ?? fetch.bind(globalThis);
  }

  setBaseUrl(url: string) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  setToken(token?: string) {
    this.token = token;
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  isConnected() {
    return this.connected;
  }

  async ping(): Promise<boolean> {
    try {
      const res = await this.fetchImpl(buildUrl(this.baseUrl, '/api/health'), {
        method: 'GET',
        headers: this.headers(),
      });
      this.connected = res.ok;
      return res.ok;
    } catch {
      this.connected = false;
      return false;
    }
  }

  private headers(extra?: Record<string, string>): Record<string, string> {
    const h: Record<string, string> = {
      Accept: 'application/json',
      ...(extra ?? {}),
    };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  }

  async get<T>(path: string, params?: QueryParams): Promise<T> {
    const url = buildUrl(this.baseUrl, path, params);
    return this.request<T>('GET', url);
  }

  async post<T>(path: string, body?: unknown, params?: QueryParams): Promise<T> {
    const url = buildUrl(this.baseUrl, path, params);
    return this.request<T>('POST', url, body);
  }

  async put<T>(path: string, body?: unknown, params?: QueryParams): Promise<T> {
    const url = buildUrl(this.baseUrl, path, params);
    return this.request<T>('PUT', url, body);
  }

  async patch<T>(path: string, body?: unknown, params?: QueryParams): Promise<T> {
    const url = buildUrl(this.baseUrl, path, params);
    return this.request<T>('PATCH', url, body);
  }

  async delete<T>(path: string, params?: QueryParams): Promise<T> {
    const url = buildUrl(this.baseUrl, path, params);
    return this.request<T>('DELETE', url);
  }

  private async request<T>(method: string, url: string, body?: unknown): Promise<T> {
    const init: RequestInit = {
      method,
      headers: this.headers(
        body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      ),
    };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
    }
    let res: Response;
    try {
      res = await this.fetchImpl(url, init);
      this.connected = true;
    } catch (err) {
      this.connected = false;
      throw new ApiError(
        `Network error contacting ${this.baseUrl}: ${(err as Error).message}`,
        0,
        null,
      );
    }
    const text = await res.text();
    let parsed: unknown = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    if (!res.ok) {
      const message =
        (parsed && typeof parsed === 'object' && 'error' in parsed
          ? String((parsed as { error: unknown }).error)
          : null) ?? `Request failed: ${res.status}`;
      throw new ApiError(message, res.status, parsed);
    }
    return parsed as T;
  }
}

let _client: ApiClient | null = null;

export const getApiClient = (): ApiClient => {
  if (!_client) {
    _client = new ApiClient({
      baseUrl: typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '',
    });
  }
  return _client;
};

export const setApiClient = (client: ApiClient) => {
  _client = client;
};