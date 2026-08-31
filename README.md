# Kubernetes Platform Reference

I build infrastructure that still makes sense when you come back to it six months later.

This is a small, live Kubernetes platform I run as a portfolio artifact. It is a real K3s cluster reconciled from Git, with a few controls that enforce rather than warn, documented well enough that you can check my work instead of taking my word for it.

It is deliberately small. One node, one boring demo app. The platform is the subject, and the app is just something for it to hold.

## What it looks like when it works

Most repositories that say "GitOps" and "policy-as-code" ask you to believe them. Here is the evidence instead.

The Gatekeeper constraint does not warn, it denies. This is from my cluster, since the API is not public:

```console
$ kubectl --context k8s-platform-reference apply --dry-run=server -f tests/gatekeeper/privileged-pod.yaml
Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request:
[disallow-privileged-containers] privileged container "privileged-app" is not allowed in namespace "demo-app"
```

The heartbeat you can check yourself, right now:

```console
$ curl -s https://api.s34nj0hn.dev/cluster/heartbeat
{"status":"online","node_count":1,"running_pods":19,"flux_ready":true,
 "gatekeeper_constraints":2,"gatekeeper_violations":0,"last_reconcile_age_seconds":296}
```

`last_reconcile_age_seconds` is the field that would give me away. If Flux stops, that number climbs and anyone watching can see it.

## How it is built

Flux reconciles the cluster from `GitOps/clusters/reference/` across five Kustomizations, split into infrastructure, apps, monitoring, and policy. Nothing reaches the cluster except through Git.

OPA Gatekeeper enforces two constraints in deny mode. One blocks privileged containers, excluding `kube-system`, `flux-system`, `gatekeeper-system`, and `local-path-storage` by name, because a constraint that takes down kube-system teaches you nothing. The other requires labels on namespaces.

The demo app starts from a default-deny NetworkPolicy and opens two paths, DNS egress and the single port it serves. It runs `nginx-unprivileged` with privilege escalation disabled and every Linux capability dropped.

kube-prometheus-stack provides metrics and Grafana inside the cluster. A Cloudflare Tunnel gives me private access to Grafana without exposing it.

A Cloudflare Worker publishes the sanitized heartbeat above. Terraform owns edge primitives around the cluster, and Flux owns everything inside it.

## The Terraform boundary, including where I got it wrong

Terraform currently manages zero resources. That is the result of a mistake I made and then undid.

In May I had Terraform adopt the `api.s34nj0hn.dev` DNS record. That was a mistake. `wrangler.toml` declares the same hostname as a Worker custom domain, which makes Cloudflare Workers create and manage the underlying record. Two systems held a claim on one object. Wrangler recreated the record on a later deploy, the ID in Terraform state went stale, and `terraform plan` started proposing to create a record that already existed.

I released it with `terraform state rm` rather than `terraform destroy`, so the live record was never touched. The ownership check in the runbook now asks about Wrangler as well as Flux.

`caa.tf` and `zone-settings.tf` are written and **not applied**. `dig CAA s34nj0hn.dev` returns nothing and the endpoint sends no HSTS header. They are in the repo so the intent is reviewable, not because the zone carries them.

## Running a monitoring stack on a small node

The VM has 3.9Gi of RAM. Fitting a monitoring stack inside that turned up a problem specific to single-node K3s.

On single-node K3s the kubelet and the apiserver are the same process, so the kubelet metrics endpoint re-exposes the entire apiserver and etcd registry. kube-prometheus-stack scrapes both targets and stored every apiserver histogram bucket twice. Dropping the duplicates from the kubelet target took active series from 104,285 to 75,209 and returned roughly 200Mi to the node. Prometheus now runs with a memory limit, so it can no longer take the node down by itself.

One result is unresolved. The kubelet job fell from 57,599 series to 16,057 as designed, but the apiserver job rose from 36,721 to 49,202, which it should not have. I measured that minutes after a Prometheus restart, so it may be churn that has not aged out of the head block. I am rechecking rather than writing it up as a clean win.

## What this does not claim

This is a reference platform, not a production Kubernetes program. It does not have:

- continuous integration, since this repo has no CI and every check above is run by hand
- Terraform-managed edge resources, since that root manages none today
- a track record of automated dependency updates, since Renovate was only pointed here on 2026-08-31
- alert routing, since Alertmanager runs with the chart's default `null` receiver and delivers nothing anywhere
- runtime detection, image scanning, or a proven backup and restore path
- host hardening coverage
- SOPS-encrypted secrets for every secret yet

I would rather list seven real gaps than imply none exist. `docs/roadmap.md` tracks what I intend to do about them and what I am deliberately leaving alone.

## Where to read next

1. `docs/architecture.md`, the cluster shape and operating boundary.
2. `docs/security/policy-as-code.md`, what Gatekeeper enforces and why.
3. `docs/security/network-policy-model.md`, how demo app traffic is constrained.
4. `docs/security/public-telemetry-contract.md`, what the heartbeat may and may not expose.
5. `docs/case-studies/02-terraform-gitops-boundary.md`, the ownership mistake above in full.
6. `docs/roadmap.md`, planned work and intentional non-goals.
7. `docs/operations/validation-pipeline.md`, the checks I run by hand before pushing.

## What the heartbeat will not tell you

The endpoint returns node count, pod counts, CPU and memory percentages, PVC count, Flux readiness, constraint and violation counts, and reconcile age.

It returns no node names, pod names, namespace names, internal IPs, ingress hosts, labels, annotations, Grafana datasource IDs, Prometheus queries, logs, or trace IDs. The Worker accepts only `GET /cluster/heartbeat` and runs fixed server-side queries, so a caller cannot supply PromQL or pick a datasource.

Two controls bound load. A 30 second response cache handles normal traffic, and a per-IP rate limiter runs before the cache is consulted so one caller cannot drive volume regardless of cache state. The limiter fails open. A missing binding serves traffic rather than refusing it, because the fixed queries are what bound what a caller can reach, and a missing binding should not take the endpoint down.

Errors carry a status and a code and nothing else. An error is not an opportunity to leak what a success would not.

## Repository map

```text
├── GitOps/
│   ├── clusters/reference/     # Flux bootstrap and entry point
│   ├── infrastructure/         # cloudflared and edge plumbing
│   ├── apps/                   # demo workload only
│   ├── monitoring/             # kube-prometheus-stack and ServiceMonitors
│   └── policies/               # Gatekeeper install, templates, constraints
├── Terraform/
│   └── cloudflare-edge/        # Cloudflare zone root, state in HCP Terraform
├── docs/                       # architecture, security, operations, case studies
├── tests/gatekeeper/           # fixtures the admission webhook must reject
├── workers/public-telemetry/   # Cloudflare Worker for the sanitized heartbeat
└── renovate.json               # dependency update rules
```

## Current status

Verified against the live cluster on 2026-08-31.

| Thing | State |
| --- | --- |
| Node | one, `reference-01`, K3s v1.34.3+k3s1, 3.9Gi RAM |
| Flux Kustomizations | 5 of 5 Ready |
| Helm releases | Gatekeeper 3.23.1 and kube-prometheus-stack, both Ready |
| Gatekeeper | 2 constraints enforcing, 0 violations, fixture rejected by the webhook |
| Prometheus | 7 day retention, 900Mi limit, 75,209 active series |
| Public heartbeat | online, cached, rate limited |
| Terraform | state in HCP Terraform, 0 managed resources |
| CI | none |

Maintainer: Sean
