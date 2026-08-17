import { describe, expect, it } from 'vitest';
import { createEarly404Response } from '../src/runtime/response';

const options = { apiPrefixes: ['/api'], cacheMaxAge: 60 };

describe('fast 404 responses', () => {
  it('returns a small cacheable HTML response for browser navigation', async () => {
    const response = createEarly404Response('/missing', 'GET', 'text/html', options);

    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('public, max-age=60');
    expect(response.headers.get('content-type')).toBe('text/html; charset=utf-8');
    expect((await response.text()).length).toBeLessThan(300);
  });

  it('keeps unknown API responses JSON even when HTML is accepted', async () => {
    const response = createEarly404Response('/api/missing', 'POST', 'text/html', options);

    expect(response.headers.get('content-type')).toBe('application/json; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('no-store');
    await expect(response.json()).resolves.toEqual({ statusCode: 404, statusMessage: 'Not Found' });
  });

  it('does not send a body for HEAD requests', async () => {
    const response = createEarly404Response('/missing', 'HEAD', 'text/html', options);

    expect(await response.text()).toBe('');
  });

  it('disables caching when cacheMaxAge is zero', () => {
    const response = createEarly404Response('/missing', 'GET', 'text/html', {
      apiPrefixes: ['/api'],
      cacheMaxAge: 0,
    });

    expect(response.headers.get('cache-control')).toBe('no-store');
  });
});
