# Public telemetry contract

The portfolio can show live cluster stats, but the public internet does not get a window into Grafana.

The path is intentionally narrow:

```text
Grafana service account -> Cloudflare Worker -> sanitized JSON -> s34nj0hn.dev
```

The browser never talks to Grafana or Prometheus. It calls one fixed endpoint. The Worker runs fixed queries and returns a small hand-built response.

## Allowed fields

The response can include aggregate health numbers:

```json
{
  "status": "online",
  "node_count": 2,
  "running_pods": 24,
  "total_pods": 25,
  "succeeded_pods": 1,
  "cluster_uptime_seconds": 86400,
  "cpu_usage_pct": 8.2,
  "memory_usage_pct": 31.4,
  "pvc_bound": 3,
  "flux_ready": true,
  "gatekeeper_constraints": 4,
  "gatekeeper_violations": 0,
  "last_reconcile_age_seconds": 74
}
```

`succeeded_pods` and `cluster_uptime_seconds` are retained for portfolio compatibility during the reference-cluster cutover. That proves the platform is alive without publishing the shape of the private network.

## Error responses

Failures return the same narrow shape, and nothing else:

```json
{ "status": "error", "code": 502 }
```

`502` means the Worker could not reach or parse the metrics backend. `429` means the caller was rate limited. Neither carries a message, a stack, an upstream status, or any hint about why the backend failed. An error is not an opportunity to leak what a success would not.

## Never expose

Do not return node names, pod names, namespace names, internal IPs, ingress hosts, storage class names, PVC names, raw labels, raw annotations, Grafana datasource UIDs, Prometheus queries, logs, trace IDs, or service account names.

The Worker must not accept arbitrary PromQL, datasource IDs, dashboard IDs, panel IDs, or query bodies from the browser. If a visitor can change the query, the design is wrong.

## Service account posture

The Grafana service account should be viewer-only. The token belongs in Cloudflare secrets, not the frontend, not the repo, and not a build log.

The Worker caches briefly so the portfolio cannot become a public query hammer against Grafana. A 30 second response cache bounds normal load.

The cache is not the whole control. A `RATE_LIMITER` binding bounds requests per client IP before the cache is consulted, so a single caller cannot drive volume regardless of cache state.

The limiter fails open: if the binding is missing, requests are served rather than refused. That is deliberate. The limiter guards against volume, not against unauthorized access, and the fixed server-side queries are what bound what any caller can reach. A missing binding should not take the endpoint down.
