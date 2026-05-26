import { describe, expect, it, vi } from "vitest"
import worker from "../src/index"
import type { Env } from "../src/metrics"

const cache = {
  match: vi.fn<Cache["match"]>().mockResolvedValue(undefined),
  put: vi.fn<Cache["put"]>().mockResolvedValue(undefined),
}

vi.stubGlobal("caches", { default: cache })

const env: Env = {
  METRICS_BACKEND_URL: "https://grafana.example.test/api/ds/query?ignored=true",
  GRAFANA_TOKEN: "test-token",
  CACHE_TTL_SECONDS: "30",
}

function executionContext(): ExecutionContext {
  return {
    passThroughOnException: vi.fn(),
    waitUntil: vi.fn(),
    props: {},
  }
}

describe("public telemetry worker", () => {
  it("rejects non-GET methods", async () => {
    const response = await worker.fetch(new Request("https://api.s34nj0hn.dev/cluster/heartbeat", { method: "POST" }), env, executionContext())

    expect(response.status).toBe(405)
    expect(response.headers.get("allow")).toBe("GET")
    expect(response.headers.get("access-control-allow-origin")).toBe("https://s34nj0hn.dev")
  })

  it("handles browser CORS preflight", async () => {
    const response = await worker.fetch(new Request("https://api.s34nj0hn.dev/cluster/heartbeat", { method: "OPTIONS" }), env, executionContext())

    expect(response.status).toBe(204)
    expect(response.headers.get("access-control-allow-origin")).toBe("https://s34nj0hn.dev")
    expect(response.headers.get("access-control-allow-methods")).toContain("GET")
  })

  it("returns not found for other paths", async () => {
    const response = await worker.fetch(new Request("https://api.s34nj0hn.dev/metrics"), env, executionContext())

    expect(response.status).toBe(404)
  })

  it("ignores visitor query params and returns only public fields", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response(JSON.stringify({
      results: Object.fromEntries([
        ["node_count", 1],
        ["running_pods", 17],
        ["total_pods", 18],
        ["succeeded_pods", 1],
        ["cluster_uptime_seconds", 3600],
        ["cpu_usage_pct", 8.24],
        ["memory_usage_pct", 31.44],
        ["pvc_bound", 0],
        ["flux_ready", 1],
        ["gatekeeper_constraints", 2],
        ["gatekeeper_violations", 0],
        ["last_reconcile_age_seconds", 74],
      ].map(([name, value]) => [name, { frames: [{ data: { values: [[1700000000], [value]] } }] }])),
    }), { status: 200 }))

    const response = await worker.fetch(new Request("https://api.s34nj0hn.dev/cluster/heartbeat?query=up"), env, executionContext())
    const body = await response.json<Record<string, unknown>>()

    expect(response.status).toBe(200)
    expect(response.headers.get("access-control-allow-origin")).toBe("https://s34nj0hn.dev")
    expect(Object.keys(body).sort()).toEqual([
      "cluster_uptime_seconds",
      "cpu_usage_pct",
      "flux_ready",
      "gatekeeper_constraints",
      "gatekeeper_violations",
      "last_reconcile_age_seconds",
      "memory_usage_pct",
      "node_count",
      "pvc_bound",
      "running_pods",
      "status",
      "succeeded_pods",
      "total_pods",
    ].sort())
    expect(body.status).toBe("online")
    expect(body.node_count).toBe(1)
    expect(body.flux_ready).toBe(true)

    const backendRequest = fetchMock.mock.calls[0]?.[0] as string
    const backendInit = fetchMock.mock.calls[0]?.[1] as RequestInit
    expect(backendRequest).toBe("https://grafana.example.test/api/ds/query")
    expect(backendInit.body?.toString()).not.toContain("query=up")

    fetchMock.mockRestore()
  })

  it("returns a bounded error when the backend fails", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("backend failed", { status: 500 }))

    const response = await worker.fetch(new Request("https://api.s34nj0hn.dev/cluster/heartbeat"), env, executionContext())

    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toEqual({ status: "error", code: 502 })

    fetchMock.mockRestore()
  })
})
