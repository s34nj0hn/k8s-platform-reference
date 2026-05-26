import { fetchMetrics, type Env } from "./metrics"
import { boundedErrorResponse, corsResponse, jsonResponse } from "./response"

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

function cacheTtlSeconds(rawValue: string | undefined): number {
  const parsed = Number(rawValue)
  if (Number.isInteger(parsed) && parsed > 0 && parsed <= 300) {
    return parsed
  }
  return DEFAULT_CACHE_TTL_SECONDS
}
