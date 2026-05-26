import type { PublicTelemetryResponse } from "./response"

export type Env = {
  METRICS_BACKEND_URL?: string
  GRAFANA_URL?: string
  GRAFANA_TOKEN: string
  CACHE_TTL_SECONDS?: string
}

type GrafanaFrame = {
  data?: {
    values?: unknown[][]
  }
}

type GrafanaQueryResult = {
  results?: Record<string, {
    frames?: GrafanaFrame[]
  }>
}

const FIXED_QUERIES = {
  node_count: "count(kube_node_info)",
  running_pods: "sum(kube_pod_status_phase{phase=\"Running\"})",
  total_pods: "sum(kube_pod_status_phase)",
  succeeded_pods: "sum(kube_pod_status_phase{phase=\"Succeeded\"})",
  cluster_uptime_seconds: "time() - min(kube_node_created)",
  cpu_usage_pct: "avg(100 - (avg by (instance) (rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100))",
  memory_usage_pct: "avg((1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100)",
  pvc_bound: "sum(kube_persistentvolumeclaim_status_phase{phase=\"Bound\"})",
  flux_ready: "(sum(apiserver_storage_objects{job=\"apiserver\",resource=\"kustomizations.kustomize.toolkit.fluxcd.io\"}) >= bool 5) * (sum(apiserver_storage_objects{job=\"apiserver\",resource=\"helmreleases.helm.toolkit.fluxcd.io\"}) >= bool 2)",
  gatekeeper_constraints: "sum(apiserver_storage_objects{job=\"apiserver\",resource=~\"k8srequirednamespacelabels.constraints.gatekeeper.sh|k8sdisallowprivileged.constraints.gatekeeper.sh\"})",
  gatekeeper_violations: "sum(gatekeeper_violations)",
  last_reconcile_age_seconds: "clamp_min(300 - max(rate(gotk_reconcile_duration_seconds_count[5m])) * 300, 0)",
} as const

type MetricName = keyof typeof FIXED_QUERIES

const METRIC_NAMES = Object.keys(FIXED_QUERIES) as MetricName[]

export async function fetchMetrics(env: Env): Promise<PublicTelemetryResponse> {
  const result = await queryGrafana(env)
  const values = Object.fromEntries(METRIC_NAMES.map((name) => [name, readNumber(result, name)])) as Record<MetricName, number>

  return {
    status: "online",
    node_count: whole(values.node_count),
    running_pods: whole(values.running_pods),
    total_pods: whole(values.total_pods),
    succeeded_pods: whole(values.succeeded_pods),
    cluster_uptime_seconds: whole(values.cluster_uptime_seconds),
    cpu_usage_pct: percent(values.cpu_usage_pct),
    memory_usage_pct: percent(values.memory_usage_pct),
    pvc_bound: whole(values.pvc_bound),
    flux_ready: values.flux_ready >= 1,
    gatekeeper_constraints: whole(values.gatekeeper_constraints),
    gatekeeper_violations: whole(values.gatekeeper_violations),
    last_reconcile_age_seconds: whole(values.last_reconcile_age_seconds),
  }
}

async function queryGrafana(env: Env): Promise<GrafanaQueryResult> {
  const response = await fetch(normalizeBackendUrl(backendUrl(env)), {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.GRAFANA_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: "now-5m",
      to: "now",
      queries: METRIC_NAMES.map((name, index) => ({
        refId: name,
        expr: FIXED_QUERIES[name],
        instant: true,
        range: false,
        datasource: { type: "prometheus", uid: "prometheus" },
        intervalMs: 30000,
        maxDataPoints: 1,
        queryType: "timeSeriesQuery",
        editorMode: "code",
        exemplar: false,
        requestId: `public-telemetry-${index}`,
      })),
    }),
  })

  if (!response.ok) {
    throw new Error("metrics backend failed")
  }

  return await response.json<GrafanaQueryResult>()
}

function normalizeBackendUrl(rawUrl: string): string {
  const url = new URL(rawUrl)
  if (url.pathname === "/" || url.pathname === "") {
    url.pathname = "/api/ds/query"
  }
  url.search = ""
  return url.toString()
}

function backendUrl(env: Env): string {
  const url = env.METRICS_BACKEND_URL ?? env.GRAFANA_URL
  if (!url) {
    throw new Error("missing metrics backend URL")
  }
  return url
}

function readNumber(result: GrafanaQueryResult, metric: MetricName): number {
  const values = result.results?.[metric]?.frames?.[0]?.data?.values
  const candidate = values?.at(-1)?.at(-1)

  if (typeof candidate === "number" && Number.isFinite(candidate)) {
    return candidate
  }

  if (typeof candidate === "string") {
    const parsed = Number(candidate)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return 0
}

function whole(value: number): number {
  return Math.max(0, Math.round(value))
}

function percent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10))
}
