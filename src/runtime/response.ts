import type { Early404ResponseOptions } from '../types/module';

const HTML_NOT_FOUND =
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow"><meta name="viewport" content="width=device-width"><title>404 Not Found</title></head><body><main><h1>404</h1><p>Not Found</p></main></body></html>';
const JSON_NOT_FOUND = JSON.stringify({ statusCode: 404, statusMessage: 'Not Found' });

function isApiPath(path: string, apiPrefixes: readonly string[]): boolean {
  return apiPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export function createEarly404Response(
  path: string,
  method: string,
  accept: string | undefined,
  options: Early404ResponseOptions,
): Response {
  const wantsHtml = !isApiPath(path, options.apiPrefixes) && Boolean(accept?.includes('text/html'));
  const cacheableMethod = method === 'GET' || method === 'HEAD';
  const cacheControl =
    cacheableMethod && options.cacheMaxAge > 0
      ? `public, max-age=${options.cacheMaxAge}`
      : 'no-store';
  const body = method === 'HEAD' ? null : wantsHtml ? HTML_NOT_FOUND : JSON_NOT_FOUND;
  const headers = new Headers({
    'cache-control': cacheControl,
    'content-type': wantsHtml ? 'text/html; charset=utf-8' : 'application/json; charset=utf-8',
    'referrer-policy': 'no-referrer',
    vary: 'Accept',
    'x-content-type-options': 'nosniff',
    'x-robots-tag': 'noindex, nofollow',
  });

  if (wantsHtml) {
    headers.set(
      'content-security-policy',
      "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
    );
  }

  return new Response(body, { status: 404, statusText: 'Not Found', headers });
}
