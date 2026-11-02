/*
  Flavor Find API client — talks to the consumer backend only.
  Base URL: NEXT_PUBLIC_API_URL (falls back to https://consumer.flavorfind.co.ke)

  Auth:
    - Access token: in memory only, never persisted.
    - Refresh token: localStorage("ff_refresh"), rotates on every use.
    - On any 401 the client auto-refreshes once then retries.
    - Anonymous requests work for search, resolve, ingredients, dishes, stories, regions.
*/

const BASE = (
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL
    : undefined
) ?? "https://consumer.flavorfind.co.ke";

// ── Token store ────────────────────────────────────────────────────────────────

const REFRESH_KEY = "ff_refresh";
let _access: string | null = null;
let _refresh: string | null = null;
let _refreshing: Promise<string> | null = null;

export const tokens = {
  set(access: string, refresh: string) {
    _access = access;
    _refresh = refresh;
    if (typeof window !== "undefined") localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    _access = null;
    _refresh = null;
    _refreshing = null;
    if (typeof window !== "undefined") localStorage.removeItem(REFRESH_KEY);
  },
  getAccess: () => _access,
  getRefresh: () => _refresh ?? (typeof window !== "undefined" ? localStorage.getItem(REFRESH_KEY) : null),
  isAuthenticated: () => _access !== null,
};

async function refreshAccess(): Promise<string> {
  if (_refreshing) return _refreshing;
  _refreshing = (async () => {
    const r = tokens.getRefresh();
    if (!r) throw new ApiError(401, "no_refresh", "Not authenticated");
    _refresh = r;
    const res = await fetch(`${BASE}/v1/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: r }),
    });
    if (!res.ok) { tokens.clear(); throw new ApiError(401, "refresh_failed", "Session expired"); }
    const data = await res.json();
    tokens.set(data.access, data.refresh);
    return data.access as string;
  })().finally(() => { _refreshing = null; });
  return _refreshing;
}

// ── ApiError ───────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public detail?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ── Core fetch ─────────────────────────────────────────────────────────────────

interface Opts {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  skipAuth?: boolean;
}

async function request<T>(path: string, opts: Opts = {}): Promise<T> {
  const { method = "GET", body, params, signal, skipAuth = false } = opts;

  const url = new URL(path.startsWith("http") ? path : `${BASE}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v != null) url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (!skipAuth && _access) headers["Authorization"] = `Bearer ${_access}`;

  const init: RequestInit = {
    method,
    headers,
    signal,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  let res = await fetch(url.toString(), init);

  // Auto-refresh on 401
  if (res.status === 401 && !skipAuth && tokens.getRefresh()) {
    try {
      const newAccess = await refreshAccess();
      headers["Authorization"] = `Bearer ${newAccess}`;
      res = await fetch(url.toString(), { ...init, headers });
    } catch {
      tokens.clear();
      throw new ApiError(401, "session_expired", "Session expired. Please sign in again.");
    }
  }

  if (res.status === 204) return undefined as T;

  let json: unknown;
  try { json = await res.json(); }
  catch { throw new ApiError(res.status, "parse_error", `Server returned ${res.status}`); }

  if (!res.ok) {
    const d = json as Record<string, unknown>;
    const env = d?.error as Record<string, unknown> | undefined;
    const message =
      typeof env?.message === "string" ? env.message :
      typeof d?.detail === "string" ? d.detail :
      `Request failed (${res.status})`;
    const code =
      typeof env?.code === "string" ? env.code :
      String(d?.code ?? res.status);
    throw new ApiError(res.status, code, message, json);
  }

  return json as T;
}

export const api = {
  get: <T>(path: string, opts?: Omit<Opts, "method" | "body">) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: Omit<Opts, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts?: Omit<Opts, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  delete: <T = void>(path: string, opts?: Omit<Opts, "method" | "body">) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SearchDish {
  dish_id: string;
  slug: string;
  name_en: string;
  name_sw: string;
  tier: "exact" | "can_make" | "almost";
  score: number;
  matched: Array<{ slug: string; name_en: string; name_sw: string }>;
  missing: Array<{ slug: string; name_en: string; name_sw: string }>;
  assumed_staples: Array<{ slug: string; name_en: string }>;
  quality_level: string;
}

export interface SearchResponse {
  dataset_version: string;
  mode: string;
  total_results: number;
  results: {
    exact: SearchDish[];
    can_make: SearchDish[];
    almost: SearchDish[];
  };
  allergen_disclaimer: string;
  personalised: boolean;
  engine_status?: string;
}

export interface ResolveToken {
  token: string;
  normalised: string;
  status: "matched" | "ambiguous" | "unmatched";
  ingredient_id: string | null;
  method: string;
  confidence: number;
  options: Array<{ ingredient_id: string; name: string; confidence: number }>;
}

export interface ResolveResponse {
  results: ResolveToken[];
  matched_count: number;
  ambiguous_count: number;
  unmatched_count: number;
}

export interface IngredientResult {
  slug: string;
  name_en: string;
  name_sw: string;
  kind: string;
  is_staple: boolean;
  category: string;
}

export interface IngredientsResponse {
  count: number;
  results: IngredientResult[];
}

export interface Story {
  id: string;
  slug: string;
  title_en: string;
  title_sw: string;
  body_en: string;
  body_sw: string;
  region_slug_list: string[];
  author: string;
  published_at: string | null;
}

export interface Region {
  id: string;
  slug: string;
  name: string;
  type: "county" | "coast" | "cuisine";
  parent_slug: string | null;
  description?: string;
}

export interface DishPairing {
  id: string;
  pairing_type: "side" | "drink" | "dessert" | "starter" | "flavour";
  strength: number;               // 1–5
  paired_dish_slug: string | null;
  paired_dish_name: string | null;
  paired_label: string;           // free-text when no dish slug (e.g. "chai")
  note: string;
}

export interface DishPairingsResponse {
  dish_id: string;
  dish_slug: string;
  count: number;
  pairings: DishPairing[];
}

export interface DishDetail {
  slug: string;
  name_en: string;
  name_sw: string;
  description: string;
  meal_type: string;
  course: string;
  spice_level: string | null;
  difficulty: string | null;
  prep_min: number | null;
  cook_min: number | null;
  servings: number | null;
  quality_level: string;
  ingredients: Array<{
    slug: string;
    name_en: string;
    name_sw: string;
    role: string;
    preparation_note?: string;
  }>;
  steps: Array<{ step: number; instruction: string }>;
  regions: string[];
  dietary_tags: Array<{ slug: string; name: string; source: string }>;
  pairings: DishPairing[];
  cost_estimate_kes?: number | null;
  nutrition_per_serving?: Record<string, number> | null;
}

export interface User {
  id: string;
  email: string;
  username: string;
  language: string;
  status: string;
  email_verified: boolean;
}

export interface TokenResponse {
  access: string;
  refresh: string;
  user: User;
}

// ── Endpoint functions ─────────────────────────────────────────────────────────

/** POST /v1/search/ — works for guests and authenticated users */
export function searchDishes(
  ingredients: string[],
  mode: "strict" | "explore" = "strict",
  limit = 20,
  signal?: AbortSignal,
): Promise<SearchResponse> {
  return api.post<SearchResponse>("/v1/search/", { ingredients, mode, limit }, { signal });
}

/** POST /v1/resolve/ — resolve free-text tokens to engine IDs */
export function resolveIngredients(
  tokens_: string[],
  lang: "en" | "sw" = "en",
  signal?: AbortSignal,
): Promise<ResolveResponse> {
  return api.post<ResolveResponse>("/v1/resolve/", { tokens: tokens_, lang }, { signal });
}

/** GET /v1/ingredients/?q= — autocomplete */
export function autocomplete(
  q: string,
  lang: "en" | "sw" = "en",
  limit = 50,
  signal?: AbortSignal,
): Promise<IngredientsResponse> {
  return api.get<IngredientsResponse>("/v1/ingredients/", { params: { q, lang, limit }, signal });
}

/** GET /v1/stories/ — editorial stories */
export function fetchStories(): Promise<Story[]> {
  return api.get<Story[]>("/v1/stories/");
}

/** GET /v1/stories/<slug>/ */
export function fetchStory(slug: string): Promise<Story> {
  return api.get<Story>(`/v1/stories/${slug}/`);
}

/** GET /v1/regions/ */
export function fetchRegions(): Promise<{ count: number; results: Region[] }> {
  return api.get<{ count: number; results: Region[] }>("/v1/regions/");
}

/** GET /v1/dishes/<slug>/ */
export function fetchDish(slug: string): Promise<DishDetail> {
  return api.get<DishDetail>(`/v1/dishes/${slug}/`);
}

/**
 * GET /v1/dishes/<slug>/  — extract pairings from the inline dish detail response.
 *
 * The consumer backend proxies the engine's dish detail endpoint which now
 * includes pairings inline. Optional type and minStrength filters are applied
 * client-side from the already-returned pairings array.
 */
export async function fetchDishPairings(
  slug: string,
  type?: string,
  minStrength = 1,
): Promise<DishPairingsResponse> {
  const dish = await fetchDish(slug);
  let pairings = dish.pairings ?? [];
  if (type) pairings = pairings.filter((p) => p.pairing_type === type);
  if (minStrength > 1) pairings = pairings.filter((p) => p.strength >= minStrength);
  return {
    dish_id: slug,
    dish_slug: slug,
    count: pairings.length,
    pairings,
  };
}

/** POST /v1/auth/login/ */
export function login(email: string, password: string): Promise<TokenResponse> {
  return api.post<TokenResponse>(
    "/v1/auth/login/",
    { email, password },
    { skipAuth: true },
  ).then((res) => { tokens.set(res.access, res.refresh); return res; });
}

/** POST /v1/auth/register/ */
export function register(
  email: string,
  username: string,
  password: string,
): Promise<TokenResponse> {
  return api.post<TokenResponse>(
    "/v1/auth/register/",
    { email, username, password, language: "en", terms_version: "2026-10" },
    { skipAuth: true },
  ).then((res) => { tokens.set(res.access, res.refresh); return res; });
}

/** POST /v1/auth/logout/ */
export function logout(): Promise<void> {
  const refresh = tokens.getRefresh();
  return (refresh ? api.post("/v1/auth/logout/", { refresh }) : Promise.resolve())
    .finally(() => tokens.clear()) as Promise<void>;
}

/** POST /v1/auth/verify-email/ — token comes from ?token= in the email link */
export function verifyEmail(token: string): Promise<User> {
  return api.post<User>("/v1/auth/verify-email/", { token }, { skipAuth: true });
}

/** POST /v1/auth/resend-verification/ — sends a new verification email */
export function resendVerification(email: string): Promise<{ detail: string }> {
  return api.post<{ detail: string }>(
    "/v1/auth/resend-verification/",
    { email },
    { skipAuth: true },
  );
}

/** GET /v1/me/ */
export function getMe(): Promise<User> {
  return api.get<User>("/v1/me/");
}
