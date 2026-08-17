declare module '#internal/nuxt-early-404-routes' {
  export const enabled: boolean;
  export const pageCaseSensitive: boolean;
  export const pageRoutePatterns: readonly string[];
  export const serverRoutePatterns: readonly string[];
  export const exclude: readonly string[];
  export const apiPrefixes: readonly string[];
  export const cacheMaxAge: number;
}
