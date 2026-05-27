# Kubernetes Platform Reference

I build secure Kubernetes platforms that teams can understand, operate, and trust.

This repository is the public reference implementation for that work: a small, real K3s platform reconciled by Flux, guarded by OPA Gatekeeper, instrumented with kube-prometheus-stack, and connected to a public-safe telemetry endpoint.

The point is not to pretend this is enterprise production. The point is to show platform engineering discipline in a reviewable shape: Git as the operating contract, narrow admission controls, documented security boundaries, boring demo workloads, and telemetry that proves the cluster is alive without exposing the cluster.

## Current reality

This is no longer just a scaffold.

The reference cluster is live as a single-node K3s cluster named `reference-01` running inside the `k8s-reference-01` KVM/libvirt VM on Gaia. Local administration reaches the Kubernetes API through an SSH tunnel from the workstation to Gaia, then to the VM on the libvirt network.

Flux is reconciling this repository into the cluster. The current Flux Kustomizations are:

- `flux-system`
- `infrastructure`
- `policies`
- `monitoring`
- `apps`

The live platform currently includes:

- K3s `v1.34.3+k3s1`
- Flux + Kustomize reconciliation from `GitOps/clusters/reference/`
- OPA Gatekeeper installed by Helm
- Two enforced Gatekeeper constraints with zero current violations
- kube-prometheus-stack installed by Helm
- Cloudflare Tunnel deployed in-cluster for private Grafana access
- A Cloudflare Worker at `https://api.s34nj0hn.dev/cluster/heartbeat`
- A small `demo-app` workload using an unprivileged nginx image with resource requests, limits, and restricted container security context

The public telemetry endpoint currently returns sanitized aggregate JSON: node count, pod counts, CPU and memory percentages, PVC count, Flux readiness, Gatekeeper constraint count, violation count, and reconcile freshness. It does not return node names, pod names, namespace names, internal IPs, labels, annotations, Grafana datasource IDs, raw Prometheus queries, logs, or traces.

## What this demonstrates

This repo demonstrates a small platform slice that is easy to inspect and hard to fake.

Flux owns steady-state cluster reconciliation. Kustomize keeps the environment layout visible. Gatekeeper turns selected design rules into API-server behavior. kube-prometheus-stack provides internal observability. The Worker publishes only hand-selected aggregate telemetry to the public internet.

The demo app is deliberately boring. It exists to make the platform visible, not to distract from it.

## What is intentionally not claimed yet

This repo should stay honest.

SOPS + age is the intended GitOps secret pattern, but the current Cloudflare tunnel token is still created out-of-band and is not committed to Git. That is safer than committing plaintext, but it is not the final encrypted-secret workflow.

App-level NetworkPolicies are implemented for `demo-app`: the namespace starts from default-deny, allows DNS egress to CoreDNS, and allows HTTP ingress only from the demo namespace and observability namespace.

This repo also does not claim full Kubernetes security coverage. Gatekeeper currently enforces a narrow v1 policy set: required namespace ownership/purpose labels and no privileged app pods. It does not replace Pod Security Admission, RBAC review, image scanning, runtime detection, host hardening, backup testing, or incident response.

That honesty is part of the artifact. A small set of real controls is better than a large fake security catalog.

## Public telemetry boundary

The public path is intentionally narrow:

```text
Grafana service account -> Cloudflare Tunnel -> Cloudflare Worker -> sanitized JSON -> s34nj0hn.dev
```

Public endpoint:

```text
https://api.s34nj0hn.dev/cluster/heartbeat
```

The Worker only accepts `GET /cluster/heartbeat` and uses fixed server-side Grafana queries. Browser input cannot choose PromQL, datasource IDs, dashboard IDs, panel IDs, or raw query bodies.

The contract is documented in `docs/security/public-telemetry-contract.md`. The operational cutover and rollback path are documented in `docs/operations/public-telemetry-worker-runbook.md`.

## Reviewer path

If you have ten minutes, read in this order:

1. `docs/architecture.md` — cluster shape and operating boundary.
2. `docs/security/policy-as-code.md` — what Gatekeeper enforces and why.
3. `docs/security/public-telemetry-contract.md` — what public telemetry may and may not expose.
4. `docs/operations/public-telemetry-worker-runbook.md` — how the Worker reaches private Grafana safely.
5. `GitOps/clusters/reference/` — the Flux entry point.

Then check the public heartbeat endpoint to confirm that the cluster is live without exposing sensitive internals.

## Repository layout

```text
├── GitOps/
│   ├── clusters/reference/        # Flux bootstrap and cluster entry point
│   ├── infrastructure/            # cloudflared and edge plumbing
│   ├── apps/                      # demo workloads only
│   ├── monitoring/                # kube-prometheus-stack and ServiceMonitors
│   └── policies/                  # Gatekeeper install, templates, and constraints
├── docs/
│   ├── architecture.md
│   ├── design/
│   ├── security/
│   ├── operations/
│   └── case-studies/
├── tests/
│   ├── gatekeeper/                # rejected policy fixtures
│   └── manifests/
├── workers/
│   └── public-telemetry/          # Cloudflare Worker for sanitized telemetry
└── renovate.json                  # dependency and image update rules
```

## Local validation

Render the GitOps entry points before trusting Flux to reconcile them:

```sh
kubectl kustomize GitOps/clusters/reference
kubectl kustomize GitOps/infrastructure/reference
kubectl kustomize GitOps/apps/reference
kubectl kustomize GitOps/monitoring/reference
kubectl kustomize GitOps/policies/reference
```

Validate the public telemetry Worker locally:

```sh
npm --prefix workers/public-telemetry test
npm --prefix workers/public-telemetry run typecheck
```

Check the live cluster, assuming the local tunnel is open:

```sh
kubectl --context k8s-platform-reference get nodes
kubectl --context k8s-platform-reference get kustomizations -A
kubectl --context k8s-platform-reference get helmreleases -A
kubectl --context k8s-platform-reference get constrainttemplates,constraints -A
```

## Status

Live baseline as of this README update:

- One K3s node: `reference-01`
- Flux Kustomizations: 5 ready
- Helm releases: Gatekeeper and kube-prometheus-stack ready
- Gatekeeper constraints: 2 enforced, 0 violations
- Public telemetry: online at `https://api.s34nj0hn.dev/cluster/heartbeat`

Next useful improvements are SOPS/age-managed encrypted secrets, stronger manifest validation in CI, and an expanded but still explainable Gatekeeper policy set.
