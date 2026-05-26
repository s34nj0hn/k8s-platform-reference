export type PublicTelemetryResponse = {
  status: "online" | "error"
  node_count: number
  running_pods: number
  total_pods: number
  succeeded_pods: number
  cluster_uptime_seconds: number
  cpu_usage_pct: number
  memory_usage_pct: number
  pvc_bound: number
  flux_ready: boolean
  gatekeeper_constraints: number
  gatekeeper_violations: number
  last_reconcile_age_seconds: number
}

export type ErrorResponse = {
  status: "error"
  code: 502
}

export function jsonResponse(body: PublicTelemetryResponse | ErrorResponse, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers)
  headers.set("content-type", "application/json; charset=utf-8")

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  })
}

export function boundedErrorResponse(): Response {
  return jsonResponse({ status: "error", code: 502 }, { status: 502 })
}
