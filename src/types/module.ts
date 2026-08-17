export interface Early404ModuleOptions {
  enabled: boolean;
  apiPrefixes: string[];
  exclude: string[];
  cacheMaxAge: number;
}

export interface Early404PageRoute {
  path: string;
  alias?: string | string[];
  children?: Early404PageRoute[];
}

export interface Early404RouteSource {
  middleware?: boolean;
  route?: string;
}

export interface Early404Manifest {
  enabled: boolean;
  pageCaseSensitive: boolean;
  pageRoutePatterns: string[];
  serverRoutePatterns: string[];
  exclude: string[];
  apiPrefixes: string[];
  cacheMaxAge: number;
}

export interface Early404ResponseOptions {
  apiPrefixes: readonly string[];
  cacheMaxAge: number;
}
