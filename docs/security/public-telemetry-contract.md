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
  "cpu_usage_pct": 8.2,
  "memory_usage_pct": 31.4,
  "pvc_bound": 3,
  "flux_ready": true,
  "gatekeeper_constraints": 4,
  "gatekeeper_violations": 0,
  "last_reconcile_age_seconds": 74
}
```

That proves the platform is alive without publishing the shape of the private network.

## Never expose

Do not return node names, pod names, namespace names, internal IPs, ingress hosts, storage class names, PVC names, raw labels, raw annotations, Grafana datasource UIDs, Prometheus queries, logs, trace IDs, or service account names.

The Worker must not accept arbitrary PromQL, datasource IDs, dashboard IDs, panel IDs, or query bodies from the browser. If a visitor can change the query, the design is wrong.

## Service account posture

The Grafana service account should be viewer-only. The token belongs in Cloudflare secrets, not the frontend, not the repo, and not a build log.

The Worker should cache briefly so the portfolio cannot become a public query hammer against Grafana.
