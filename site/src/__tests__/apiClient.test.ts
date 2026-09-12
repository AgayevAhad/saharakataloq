import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiError, TimeoutError } from '../services/apiClient';

describe('ApiClient Centralized Network Utility Suite', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] });
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('successfully completes a GET request and parses JSON data', async () => {
    const mockData = { id: 'ardo-1', title: 'ARDO Fırın' };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: async () => mockData,
    });

    const resultPromise = apiClient.get('/api/catalog');
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it('retries idempotent GET request on 503 error with exponential backoff and succeeds', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount < 3) {
        return {
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers(),
          text: async () => 'Unavailable',
        };
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ status: 'ok' }),
      };
    });

    const resultPromise = apiClient.get('/api/health', { initialDelayMs: 100 });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual({ status: 'ok' });
    expect(callCount).toBe(3); // Exactly 3 attempts (1 initial + 2 retries)
  });

  it('stops retrying after exactly 3 attempts by default when server constantly fails', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers(),
        text: async () => 'Unavailable',
      };
    });

    const resultPromise = apiClient.get('/api/always-fails', { initialDelayMs: 50 });
    const assertion = expect(resultPromise).rejects.toThrow(ApiError);
    await vi.runAllTimersAsync();
    await assertion;

    expect(callCount).toBe(3); // Default max 3 total HTTP attempts
  });

  it('NEVER retries non-idempotent POST requests on error', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      return {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        headers: new Headers(),
        text: async () => 'Server error',
      };
    });

    const resultPromise = apiClient.post('/api/products', { name: 'New Item' }, { maxRetries: 3 });
    const assertion = expect(resultPromise).rejects.toThrow(ApiError);
    await vi.runAllTimersAsync();
    await assertion;

    expect(callCount).toBe(1); // Strict: Mutation not retried
  });

  it('times out and throws TimeoutError when request exceeds timeoutMs', async () => {
    global.fetch = vi.fn().mockImplementation((_url, { signal }: { signal: AbortSignal }) => {
      return new Promise((_resolve, reject) => {
        signal.addEventListener('abort', () => {
          reject(new DOMException('The operation was aborted', 'AbortError'));
        });
      });
    });

    const resultPromise = apiClient.get('/api/slow', { timeoutMs: 1000, maxRetries: 0 });
    const assertion = expect(resultPromise).rejects.toThrow(TimeoutError);
    await vi.runAllTimersAsync();
    await assertion;
  });

  it('handles Retry-After header correctly on 429 Too Many Requests', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({ 'Retry-After': '2' }), // 2 seconds
          text: async () => 'Rate limit',
        };
      }
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ rateLimitPassed: true }),
      };
    });

    const resultPromise = apiClient.get('/api/rate-limited', { maxRetries: 2 });
    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual({ rateLimitPassed: true });
    expect(callCount).toBe(2);
  });
});
