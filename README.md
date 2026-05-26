# Kubernetes Platform Reference

I build secure Kubernetes platforms that teams can understand, operate, and trust.

This repository is a reference implementation of that work: a small K3s platform managed through GitOps, guarded by admission policy, instrumented with Prometheus and Grafana, and designed with public-safe telemetry from the start.

The point is not to collect tools. The point is to show the operating model behind the tools. Git is the source of truth. Secrets are encrypted before they reach the repository. Workloads declare their resource needs and network paths. Policy checks happen at admission, not after someone remembers to review a checklist. Metrics are useful internally, but only sanitized aggregates leave the cluster.

That is the platform engineering story I care about: secure defaults, visible tradeoffs, and enough documentation that another engineer can tell what is supposed to happen.

## What this demonstrates

The first version focuses on a narrow platform slice that is easy to review and hard to fake.

Flux reconciles the cluster from this repository. Kustomize keeps the environment layout explicit. SOPS and age protect Kubernetes secrets. OPA Gatekeeper blocks selected unsafe Kubernetes objects before they land. NetworkPolicies describe which workloads can talk to each other. kube-prometheus-stack provides the internal observability layer. A Cloudflare Worker publishes only safe aggregate telemetry to `s34nj0hn.dev`.

The demo workload is deliberately small. A reference platform should make the platform visible, not bury it under an impressive-looking app.

## What I am guarding against

A lot of platform work fails in boring ways. Someone adds a namespace without Pod Security labels. A workload ships without CPU or memory boundaries. An image tag points at `latest`, so the running code can change without a Git diff. A demo service gets broad network access because nobody wrote the deny rule first.

This repo treats those as design problems, not cleanup tasks.

The admission policies and network rules are not here to look strict. They are here because GitOps only works if the repo describes the real operating contract.

## Public telemetry

The portfolio telemetry for this platform is designed to prove the cluster is alive without exposing the cluster.

The public path is intentionally narrow:

```text
Grafana service account -> Cloudflare Worker -> sanitized JSON -> s34nj0hn.dev
```

The website should be able to show health, pod counts, resource usage, Flux status, and Gatekeeper policy status. It should not expose node names, pod names, namespace names, internal IPs, ingress inventory, labels, logs, Grafana datasource IDs, or raw Prometheus queries.

That boundary is documented in `docs/security/public-telemetry-contract.md`.

## Reviewer path

If you have ten minutes, start with `docs/architecture.md`, then read `docs/security/public-telemetry-contract.md` and `docs/security/policy-as-code.md`. After that, look at the GitOps entry point under `GitOps/clusters/reference/`.

Once the cluster is live, this README will link to the public telemetry view and the GitOps evidence behind it.

## Repository layout

```text
├── GitOps/
│   ├── clusters/reference/        # Flux entry point
│   ├── infrastructure/reference/  # ingress, load balancing, secrets, policy, telemetry bridge
│   ├── apps/reference/            # demo workloads only
│   ├── monitoring/reference/      # kube-prometheus-stack and metric config
│   └── policies/reference/        # OPA Gatekeeper templates and constraints
├── docs/
│   ├── architecture.md
│   ├── design/
│   ├── security/
│   ├── operations/
│   └── case-studies/
└── tests/
    ├── gatekeeper/
    └── manifests/
```

## Status

Phase 0: repository scaffold and design docs.

The next milestone is a real K3s cluster bootstrapped from this repository with Flux reconciliation working end to end.
