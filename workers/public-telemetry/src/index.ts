import { fetchMetrics, type Env } from "./metrics"
import { boundedErrorResponse, corsResponse, jsonResponse, rateLimitedResponse } from "./response"

const DEFAULT_CACHE_TTL_SECONDS = 30

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === "OPTIONS") {
      return corsResponse({ status: 204 })
    }

    if (request.method !== "GET") {
      return corsResponse({
        status: 405,
        headers: { allow: "GET" },
      })
    }

    const url = new URL(request.url)
    if (url.pathname !== "/cluster/heartbeat") {
      return corsResponse({ status: 404 })
    }

    if (await isRateLimited(request, env)) {
      return rateLimitedResponse()
    }

    const cacheTtl = cacheTtlSeconds(env.CACHE_TTL_SECONDS)
    const cacheKey = new Request(`${url.origin}${url.pathname}`, { method: "GET" })
    const cache = caches.default
    const cached = await cache.match(cacheKey)

    if (cached) {
      return cached
    }

    try {
      const response = jsonResponse(await fetchMetrics(env), {
        headers: {
          "cache-control": `public, max-age=${cacheTtl}`,
        },
      })
      ctx.waitUntil(cache.put(cacheKey, response.clone()))
      return response
    } catch {
      return boundedErrorResponse()
    }
  },
}

// Rate limiting runs before the cache lookup so abuse is rejected cheaply and
// on every request, not only on cache misses.
//
// This fails open. If the binding is absent, requests are served rather than
// refused. The limiter guards against volume, not against unauthorized access,
// and the fixed server-side queries are what actually bound what a caller can
// reach. Refusing all traffic because a binding is missing would trade a real
// outage for a theoretical one.
async function isRateLimited(request: Request, env: Env): Promise<boolean> {
  if (!env.RATE_LIMITER) {
    return false
  }

  const key = request.headers.get("cf-connecting-ip") ?? "unknown"
  const { success } = await env.RATE_LIMITER.limit({ key })

  return !success
}

function cacheTtlSeconds(rawValue: string | undefined): number {
  const parsed = Number(rawValue)
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 300) {
    return parsed
  }
  return DEFAULT_CACHE_TTL_SECONDS
}
