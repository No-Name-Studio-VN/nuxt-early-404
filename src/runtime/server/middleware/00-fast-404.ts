import { defineEventHandler, getHeader } from 'h3';
import { useRuntimeConfig } from 'nitropack/runtime';
import {
  apiPrefixes,
  cacheMaxAge,
  enabled,
  exclude,
  pageCaseSensitive,
  pageRoutePatterns,
  serverRoutePatterns,
} from '#internal/nuxt-early-404-routes';
import { createEarly404RouteMatcher, normalizeEarly404RequestPath } from '../../matcher';
import { createEarly404Response } from '../../response';

const routeMatcher = createEarly404RouteMatcher(
  pageRoutePatterns,
  serverRoutePatterns,
  pageCaseSensitive,
  exclude,
);

export default defineEventHandler((event) => {
  if (!enabled || !routeMatcher.ready) return;

  const path = normalizeEarly404RequestPath(event.path, useRuntimeConfig(event).app.baseURL);
  if (routeMatcher.matches(path)) return;

  return createEarly404Response(path, event.method, getHeader(event, 'accept'), {
    apiPrefixes,
    cacheMaxAge,
  });
});
