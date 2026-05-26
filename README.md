# Kubernetes Platform Reference

This repo is the clean version of the platform story.

My personal homelab is where the real services live. It has history, weird edges, storage decisions, and workloads I actually use. That is useful, but it is not the best thing to hand to a recruiter and say, "start here."

`k8s-platform-reference` is different. It is a small Kubernetes cluster built to show the way I think about platform engineering: Git owns the cluster, secrets are encrypted before they touch the repo, workloads start from explicit traffic rules, and policy is enforced by the API server instead of living as a checklist in someone's head.

The cluster is not live yet. This first commit sets the boundary and the repo shape. The next work is to bootstrap a separate K3s cluster from this repo and move the public telemetry on `s34nj0hn.dev` over to it.

## What this repo is for

A reviewer should be able to read this repo in ten minutes and understand the platform. Not every historical detour. Not my personal workloads. The platform.

The first version will prove a narrow set of things:

- Flux reconciles the cluster from Git
- SOPS and age protect secrets in the repo
- OPA Gatekeeper blocks selected bad Kubernetes objects
- NetworkPolicies describe traffic intent from the first demo workload
- kube-prometheus-stack collects internal metrics
- a Cloudflare Worker publishes only safe aggregate telemetry to my portfolio site

That is enough. If the first version tries to include every platform tool I like, it will turn into another messy lab.

## What this repo will not run

No media stack. No bookmark service. No personal automation. No "this exists because I use it at home" workloads.

The demo app should be boring. Boring is good here. The platform is the thing being evaluated.

## Reviewer path

Start with `docs/architecture.md`. Then read `docs/security/public-telemetry-contract.md` to see how the public stats are kept safe. After that, look at the GitOps entry point under `GitOps/clusters/reference/` and the policy notes under `docs/security/`.

Once the cluster is live, this README will link to the portfolio telemetry view and the exact GitOps/policy evidence behind it.

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

Phase 0: repo scaffold and design docs.
