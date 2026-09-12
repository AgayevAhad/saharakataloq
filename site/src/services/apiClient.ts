/**
 * Sahara Electronics — Centralized Robust API & Network Client
 * Provides idempotent request retry with exponential backoff & jitter, timeout handling,
 * caller abort support, Retry-After compliance, and strict mutation non-retry protection.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown,
    public headers?: Headers
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class TimeoutError extends Error {
  constructor(message = 'Sorğu vaxtı bitdi (Timeout)') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export class NetworkError extends Error {
  constructor(message = 'Şəbəkə bağlantısı uğursuz oldu') {
    super(message);
    this.name = 'NetworkError';
  }
}

export interface RequestOptions extends RequestInit {
  timeoutMs?: number;
  maxAttempts?: number;
  maxRetries?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  retryOnStatusCodes?: number[];
  signal?: AbortSignal;
}

const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD']);
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

function calculateBackoffWithJitter(attempt: number, initialDelay: number, factor: number): number {
  const baseDelay = initialDelay * Math.pow(factor, attempt);
  const jitter = baseDelay * 0.2 * (Math.random() * 2 - 1); // +/- 20%
  return Math.max(50, Math.floor(baseDelay + jitter));
}

function parseRetryAfter(response: Response): number | null {
  const header = response.headers.get('Retry-After');
  if (!header) return null;

  const seconds = Number(header);
  if (!Number.isNaN(seconds) && seconds > 0) {
    return seconds * 1000;
  }

  const date = Date.parse(header);
  if (!Number.isNaN(date)) {
    const delay = date - Date.now();
    return delay > 0 ? delay : 0;
  }

  return null;
}

export async function request<T = unknown>(url: string, options: RequestOptions = {}): Promise<T> {
  const {
    method = 'GET',
    timeoutMs = 8000,
    maxAttempts,
    maxRetries,
    initialDelayMs = 300,
    backoffFactor = 2,
    retryOnStatusCodes = Array.from(RETRYABLE_STATUS_CODES),
    signal: callerSignal,
    headers: customHeaders,
    ...rest
  } = options;

  const isIdempotent = IDEMPOTENT_METHODS.has(method.toUpperCase());
  // Total attempts: exactly 3 (1 initial attempt + 2 retries), or strictly 1 for non-idempotent mutations
  const effectiveMaxAttempts = isIdempotent
    ? (maxAttempts ?? (maxRetries !== undefined ? maxRetries + 1 : 3))
    : 1;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= effectiveMaxAttempts; attempt++) {
    if (callerSignal?.aborted) {
      throw new DOMException('User aborted request', 'AbortError');
    }

    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    const onCallerAbort = () => abortController.abort();
    if (callerSignal) {
      callerSignal.addEventListener('abort', onCallerAbort, { once: true });
    }

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        abortController.abort();
      }, timeoutMs);
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...customHeaders,
        },
        signal: abortController.signal,
        ...rest,
      });

      if (timeoutId) clearTimeout(timeoutId);
      if (callerSignal) callerSignal.removeEventListener('abort', onCallerAbort);

      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text().catch(() => null);
        }

        const isRetryableStatus = retryOnStatusCodes.includes(response.status);
        if (isIdempotent && isRetryableStatus && attempt < effectiveMaxAttempts) {
          const retryAfterMs = parseRetryAfter(response);
          const delay =
            retryAfterMs !== null
              ? retryAfterMs
              : calculateBackoffWithJitter(attempt - 1, initialDelayMs, backoffFactor);

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText || 'Sorğu uğursuz oldu'}`,
          response.status,
          errorData,
          response.headers
        );
      }

      // 204 No Content
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        return (await response.json()) as T;
      }
      return (await response.text()) as unknown as T;
    } catch (err: unknown) {
      if (timeoutId) clearTimeout(timeoutId);
      if (callerSignal) callerSignal.removeEventListener('abort', onCallerAbort);

      if (callerSignal?.aborted) {
        throw new DOMException('User aborted request', 'AbortError');
      }

      if (err instanceof DOMException && err.name === 'AbortError') {
        lastError = new TimeoutError(`Sorğu ${timeoutMs}ms ərzində cavab vermədi`);
      } else if (err instanceof ApiError) {
        lastError = err;
      } else if (err instanceof TypeError || (err as Error)?.name === 'FetchError') {
        lastError = new NetworkError((err as Error).message || 'Şəbəkə bağlantı xətası');
      } else {
        lastError = err as Error;
      }

      const isNetworkOrTimeout =
        lastError instanceof NetworkError || lastError instanceof TimeoutError;
      if (isIdempotent && isNetworkOrTimeout && attempt < effectiveMaxAttempts) {
        const delay = calculateBackoffWithJitter(attempt - 1, initialDelayMs, backoffFactor);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new NetworkError('Sorğu uğursuz oldu');
}

export interface ApiResponse<T> {
  data: T;
  etag: string | null;
  headers: Headers;
  status: number;
}

export async function requestWithMeta<T = unknown>(
  url: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const {
    method = 'GET',
    timeoutMs = 8000,
    maxAttempts,
    maxRetries,
    initialDelayMs = 300,
    backoffFactor = 2,
    retryOnStatusCodes = Array.from(RETRYABLE_STATUS_CODES),
    signal: callerSignal,
    headers: customHeaders,
    ...rest
  } = options;

  const isIdempotent = IDEMPOTENT_METHODS.has(method.toUpperCase());
  const effectiveMaxAttempts = isIdempotent
    ? (maxAttempts ?? (maxRetries !== undefined ? maxRetries + 1 : 3))
    : 1;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= effectiveMaxAttempts; attempt++) {
    if (callerSignal?.aborted) {
      throw new DOMException('User aborted request', 'AbortError');
    }

    const abortController = new AbortController();
    let timeoutId: NodeJS.Timeout | null = null;

    const onCallerAbort = () => abortController.abort();
    if (callerSignal) {
      callerSignal.addEventListener('abort', onCallerAbort, { once: true });
    }

    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        abortController.abort();
      }, timeoutMs);
    }

    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: 'application/json',
          ...customHeaders,
        },
        signal: abortController.signal,
        ...rest,
      });

      if (timeoutId) clearTimeout(timeoutId);
      if (callerSignal) callerSignal.removeEventListener('abort', onCallerAbort);

      if (!response.ok) {
        let errorData: unknown;
        try {
          errorData = await response.json();
        } catch {
          errorData = await response.text().catch(() => null);
        }

        const isRetryableStatus = retryOnStatusCodes.includes(response.status);
        if (isIdempotent && isRetryableStatus && attempt < effectiveMaxAttempts) {
          const retryAfterMs = parseRetryAfter(response);
          const delay =
            retryAfterMs !== null
              ? retryAfterMs
              : calculateBackoffWithJitter(attempt - 1, initialDelayMs, backoffFactor);

          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw new ApiError(
          `HTTP ${response.status}: ${response.statusText || 'Sorğu uğursuz oldu'}`,
          response.status,
          errorData,
          response.headers
        );
      }

      let data: T;
      if (response.status === 204) {
        data = undefined as unknown as T;
      } else {
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          data = (await response.json()) as T;
        } else {
          data = (await response.text()) as unknown as T;
        }
      }

      return {
        data,
        etag: response.headers.get('etag'),
        headers: response.headers,
        status: response.status,
      };
    } catch (err: unknown) {
      if (timeoutId) clearTimeout(timeoutId);
      if (callerSignal) callerSignal.removeEventListener('abort', onCallerAbort);

      if (callerSignal?.aborted) {
        throw new DOMException('User aborted request', 'AbortError');
      }

      if (err instanceof DOMException && err.name === 'AbortError') {
        lastError = new TimeoutError(`Sorğu ${timeoutMs}ms ərzində cavab vermədi`);
      } else if (err instanceof ApiError) {
        lastError = err;
      } else if (err instanceof TypeError || (err as Error)?.name === 'FetchError') {
        lastError = new NetworkError((err as Error).message || 'Şəbəkə bağlantı xətası');
      } else {
        lastError = err as Error;
      }

      const isNetworkOrTimeout =
        lastError instanceof NetworkError || lastError instanceof TimeoutError;
      if (isIdempotent && isNetworkOrTimeout && attempt < effectiveMaxAttempts) {
        const delay = calculateBackoffWithJitter(attempt - 1, initialDelayMs, backoffFactor);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new NetworkError('Sorğu uğursuz oldu');
}

export const apiClient = {
  get: <T>(url: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(url, { ...options, method: 'GET' }),
  getWithMeta: <T>(url: string, options?: Omit<RequestOptions, 'method'>) =>
    requestWithMeta<T>(url, { ...options, method: 'GET' }),
  head: (url: string, options?: Omit<RequestOptions, 'method'>) =>
    request<void>(url, { ...options, method: 'HEAD' }),
  post: <T>(url: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  postWithMeta: <T>(
    url: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ) =>
    requestWithMeta<T>(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T>(url: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  putWithMeta: <T>(
    url: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>
  ) =>
    requestWithMeta<T>(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(url: string, options?: Omit<RequestOptions, 'method'>) =>
    request<T>(url, { ...options, method: 'DELETE' }),
};
