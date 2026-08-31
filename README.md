# Kubernetes Platform Reference

I build infrastructure that should still make sense when you come back to it six months later.

This repository is a small, live Kubernetes platform built as a portfolio artifact for platform and security engineering roles. It shows how I think about GitOps, Kubernetes guardrails, observability, network boundaries, and public-safe telemetry.

It is not a giant enterprise platform. It is not a diagram pretending to be a system. It is a real K3s cluster reconciled from Git with Flux, protected by a few concrete policies, and documented so a reviewer can understand the choices quickly.

## Why a recruiter might care

Most resumes say things like "Kubernetes," "GitOps," and "security." This repo gives those words something reviewable.

In a few minutes, you can see that I can:

- turn infrastructure into versioned, reviewable code
- explain security controls in plain English
- separate public proof from private infrastructure
- keep a platform small enough to operate and honest enough to trust
- document not only what works, but what is intentionally not finished yet

That last part matters. I would rather show a small set of working controls than a long list of imaginary ones.

## What this platform demonstrates

- **GitOps.** Flux reconciles the cluster from `GitOps/clusters/reference/`.
- **Readable structure.** Kustomize keeps cluster, infrastructure, apps, monitoring, and policies separated.
- **Admission control.** OPA Gatekeeper blocks unlabeled application namespaces and privileged application pods.
- **Network boundaries.** The demo app starts from default-deny NetworkPolicies and only opens the traffic it needs.
- **Observability.** kube-prometheus-stack provides internal metrics and Grafana.
- **Infrastructure as code boundary.** Flux owns in-cluster Kubernetes resources. Terraform owns edge primitives around the cluster, and currently owns none, because the one record it adopted turned out to belong to Cloudflare Workers and was released. The reasoning is in `docs/case-studies/02-terraform-gitops-boundary.md`.
- **Safe public signal.** A Cloudflare Worker publishes sanitized aggregate cluster health without exposing raw cluster details, behind a response cache and a per-IP rate limit.
- **Operational honesty.** The docs call out real limits and planned improvements instead of pretending this is complete.

## What is running

The live reference cluster is a single-node K3s cluster named `reference-01`. It runs inside a `k8s-reference-01` KVM/libvirt VM on a private host. I administer it through a local SSH tunnel to the Kubernetes API.

Current pieces:

- K3s `v1.34.3+k3s1`
- Flux reconciling this repo into the cluster
- OPA Gatekeeper installed by Helm
- Two enforced Gatekeeper constraints with zero current violations
- App-level NetworkPolicies for `demo-app`
- kube-prometheus-stack installed by Helm, 7 day retention, scrape targets tuned to fit the node
- Cloudflare Tunnel for private Grafana access
- Cloudflare Worker at `https://api.s34nj0hn.dev/cluster/heartbeat`, rate limited per client IP
- A deliberately boring `demo-app` workload using unprivileged nginx with resource requests, limits, and a restricted container security context

The demo app is boring on purpose. It is there so the platform has something safe to admit, monitor, and restrict. The platform is the point.

The VM has 3.9Gi of RAM, which is a real constraint rather than a footnote. On single-node K3s the kubelet and the apiserver are one process, so the kubelet scrape target re-exposes the entire apiserver and etcd registry and kube-prometheus-stack stores every histogram bucket twice. Dropping the duplicates from the kubelet target cut active series from 104,285 to 75,209 and gave the node back about 200Mi. Prometheus also runs with a memory limit now, so it cannot take the node down on its own.

## Live proof

Public heartbeat:

```text
https://api.s34nj0hn.dev/cluster/heartbeat
```

That endpoint returns aggregate health signals like node count, pod counts, CPU and memory percentages, PVC count, Flux readiness, Gatekeeper constraint count, violation count, and reconcile freshness.

It does not return node names, pod names, namespace names, internal IPs, labels, annotations, Grafana datasource IDs, raw Prometheus queries, logs, or traces.

The boundary is intentionally narrow:

```text
Grafana service account -> Cloudflare Tunnel -> Cloudflare Worker -> sanitized JSON -> s34nj0hn.dev
```

The Worker accepts only `GET /cluster/heartbeat` and uses fixed server-side Grafana queries. A visitor cannot send arbitrary PromQL or choose Grafana datasource IDs, dashboard IDs, panel IDs, or raw query bodies.

Two separate controls bound load. A 30 second response cache handles normal traffic, and a rate limiter bounds requests per client IP before the cache is consulted, so one caller cannot drive volume regardless of cache state. The limiter fails open. A missing binding serves traffic rather than refusing it, because the fixed queries are what bound what a caller can reach, and a missing binding should not take the endpoint down.

Errors return the same narrow shape as successes, carrying a status and a code and nothing else. An error is not an opportunity to leak what a success would not.

The full telemetry contract is in `docs/security/public-telemetry-contract.md`.

## How to review it

If you have ten minutes, read these in order:

1. `docs/architecture.md`, the cluster shape and operating boundary.
2. `docs/security/policy-as-code.md`, what Gatekeeper enforces and why.
3. `docs/security/network-policy-model.md`, how demo app traffic is constrained.
4. `docs/security/public-telemetry-contract.md`, what the public heartbeat may expose.
5. `docs/operations/public-telemetry-worker-runbook.md`, how the Worker reaches private Grafana.
6. `docs/case-studies/02-terraform-gitops-boundary.md`, what Terraform owns and what Flux owns.
7. `GitOps/clusters/reference/`, the Flux entry point.
8. `docs/roadmap.md`, planned improvements and intentional non-goals.

Then hit the heartbeat endpoint. The goal is to prove the platform is live without giving the public internet a map of the private cluster.

## What this does not claim

This is a reference platform, not a full enterprise Kubernetes program.

It does not claim:

- full Kubernetes security coverage
- a complete production incident-response process
- runtime detection
- image scanning
- backup and disaster-recovery proof
- host-hardening coverage
- encrypted GitOps secrets for every secret yet
- continuous integration, since this repo has no CI and the checks under Local validation are run by hand
- Terraform-managed edge resources, since that root currently manages none
- a track record of automated dependency updates, since Renovate was only pointed at this repo on 2026-08-31

Those are real areas of work. They are tracked in `docs/roadmap.md` so the README can stay focused on what exists today.

## Repository map

```text
├── GitOps/
│   ├── clusters/reference/        # Flux bootstrap and cluster entry point
│   ├── infrastructure/            # cloudflared and edge plumbing
│   ├── apps/                      # demo workloads only
│   ├── monitoring/                # kube-prometheus-stack and ServiceMonitors
│   └── policies/                  # Gatekeeper install, templates, and constraints
├── Terraform/
│   └── cloudflare-edge/           # Cloudflare zone edge root, state in HCP Terraform
├── docs/
│   ├── architecture.md
│   ├── roadmap.md
│   ├── security/
│   ├── operations/
│   ├── design/
│   └── case-studies/
├── tests/
│   └── gatekeeper/                # rejected policy fixtures
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

Validate the public telemetry Worker:

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

## Current status

- One K3s node: `reference-01`
- Flux Kustomizations: 5 ready
- Helm releases: Gatekeeper and kube-prometheus-stack ready
- Gatekeeper constraints: 2 enforced, 0 violations, and `tests/gatekeeper/privileged-pod.yaml` is rejected by the admission webhook rather than merely warned about
- Public telemetry: online at `https://api.s34nj0hn.dev/cluster/heartbeat`, cached and rate limited
- Terraform: state in HCP Terraform, zero managed resources

Verified against the live cluster on 2026-08-31.

One thing is open rather than finished. After the scrape-target change, the kubelet job fell from 57,599 series to 16,057 as designed, but the apiserver job rose from 36,721 to 49,202, which it should not have. That was measured minutes after a Prometheus restart, so it may be churn that has not aged out of the head block. It is being rechecked. I would rather leave that here than round it up into a clean number.

Maintainer: Sean

