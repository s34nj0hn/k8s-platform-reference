# Public telemetry Worker runbook

This runbook covers the `api.s34nj0hn.dev/cluster/heartbeat` cutover from the previous homelab telemetry Worker to the reference cluster telemetry Worker in this repository.

## Public endpoint

```text
https://api.s34nj0hn.dev/cluster/heartbeat
```

The browser must only call this fixed endpoint. It must not call Grafana, Prometheus, or any backend metrics service directly.

## Source of truth

Worker source lives under:

```text
workers/public-telemetry/
```

Reference cluster monitoring source lives under:

```text
GitOps/monitoring/base/kube-prometheus-stack/
GitOps/monitoring/reference/
```

## Pre-cutover state to capture

Before replacing the live Worker, authenticate with Cloudflare and record the following values here or in a dated private ops note. Do not record secret values.

| Field | Value |
| --- | --- |
| Cloudflare account ID | `cacdc154d5d119c1645351754d79613e` |
| Existing Worker name | `throbbing-mouse-98cf` |
| Existing Worker deployment ID/version | `f9df5ab3-f676-4f14-b6a6-06f5a2150d06`, created `2026-04-15T20:33:29.584Z` |
| Existing route/custom domain | `https://throbbing-mouse-98cf.seannotpdiddyjohnson.workers.dev`; no first-party route captured by Wrangler 4.82.2 commands |
| Existing secrets names | `GRAFANA_TOKEN`, `GRAFANA_URL` |
| Previous portfolio fallback URL | `https://throbbing-mouse-98cf.seannotpdiddyjohnson.workers.dev` |

Useful commands:

```bash
wrangler login
wrangler whoami
wrangler deployments status --name throbbing-mouse-98cf
wrangler secret list --name throbbing-mouse-98cf
```

If the old Worker uses a different local config or only exists in the Cloudflare dashboard, capture the same metadata from the dashboard before changing routes. Wrangler 4.82.2 did not expose `routes list` or `domains list`; confirm any first-party route in the dashboard before replacing it.

## Backend prerequisites

The reference cluster must have kube-prometheus-stack running before the Worker is deployed.

Verify locally:

```bash
kubectl kustomize GitOps/monitoring/reference >/tmp/reference-monitoring.yaml
kubectl --context k8s-platform-reference -n monitoring get pods,svc
```

No monitoring service should have a public ingress or public LoadBalancer address by default.

## Worker secrets

Set secrets with Wrangler. Do not commit token values, backend tunnel URLs, or internal hostnames.

```bash
wrangler secret put GRAFANA_TOKEN --config workers/public-telemetry/wrangler.toml
wrangler secret put METRICS_BACKEND_URL --config workers/public-telemetry/wrangler.toml
```

Use `METRICS_BACKEND_URL` for the protected Grafana API base URL or `/api/ds/query` URL. The Worker also accepts the existing `GRAFANA_URL` secret name as a migration fallback. The Worker strips incoming browser query parameters and uses fixed server-side queries only.

## Local validation

```bash
npm --prefix workers/public-telemetry test
npm --prefix workers/public-telemetry run typecheck
wrangler deploy --dry-run --config workers/public-telemetry/wrangler.toml
```

## Deploy

Deploy only after Cloudflare metadata and rollback state are captured.

```bash
wrangler deploy --config workers/public-telemetry/wrangler.toml
```

Then verify the public response:

```bash
curl -sS https://api.s34nj0hn.dev/cluster/heartbeat | jq .
curl -i 'https://api.s34nj0hn.dev/cluster/heartbeat?query=up'
```

The response must contain only the public telemetry contract fields and the current portfolio compatibility fields. It must not include raw Prometheus responses, Grafana datasource UIDs, PromQL strings, labels, annotations, pod names, node names, namespace names, IP addresses, logs, or trace IDs.

## Portfolio cutover

Set the deployed portfolio environment variable:

```text
NEXT_PUBLIC_WORKER_URL=https://api.s34nj0hn.dev/cluster/heartbeat
```

If needed, update the portfolio fallback constant from the previous `workers.dev` URL to the first-party endpoint. Keep `succeeded_pods` and `cluster_uptime_seconds` available until the portfolio type and UI no longer require them.

## Rollback

If telemetry fails or leaks data, use the fastest safe rollback path.

1. Remove or disable the `api.s34nj0hn.dev/cluster/heartbeat` Worker route.
2. Restore the previous Worker deployment or route using the captured pre-cutover metadata.
3. Set the portfolio `NEXT_PUBLIC_WORKER_URL` back to the previous Worker URL if route rollback is slower.
4. If monitoring overloads the single-node cluster, suspend the Flux `monitoring` Kustomization or remove the monitoring HelmRelease through GitOps.
5. If public JSON contains forbidden fields, deploy an error-only Worker or remove the route until fixed.
