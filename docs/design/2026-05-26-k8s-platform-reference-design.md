# k8s-platform-reference Design Spec

## Purpose

`k8s-platform-reference` is a separate, real Kubernetes reference environment built for public review.

It exists because the personal homelab has become real infrastructure. That makes it useful, but it also makes it noisy. The public artifact should not ask a recruiter, hiring manager, or platform engineer to separate Kubernetes platform proof from personal workloads like media automation, bookmarks, audiobooks, home services, and historical migration notes.

The new environment should prove platform engineering taste in a clean way: GitOps, admission control, secure ingress, encrypted secrets, network policy, observability, automated dependency updates, validation, and public-safe telemetry.

The point is not to pretend this is enterprise production. The point is to show a small, operated platform with visible tradeoffs and enough discipline that another engineer can understand it quickly.

## Name

Repository name:

```text
k8s-platform-reference
```

Public title:

```text
Kubernetes Platform Reference
```

Website phrasing:

```text
Live telemetry from my Kubernetes platform reference environment.
```

Avoid “showcase” because it sounds performative. Avoid “POC” because it sounds temporary and undercuts the operated-platform signal.

## Scope

This is a real separate cluster, not a namespace inside the personal homelab and not a paper-only example.

It should have its own Kubernetes API, kubeconfig, Flux bootstrap, GitHub repository, Grafana service account, and Cloudflare Worker telemetry path. It may reuse the same physical LAN, hardware pool, DNS provider, Cloudflare account, and general operating knowledge, but it should be operationally distinct from `/Users/s34nj0hn/lab`.

The personal lab remains the workshop. `k8s-platform-reference` becomes the public reference implementation.

## Non-goals

This project should not include personal workloads. No Sonarr, Radarr, Sabnzbd, Calibre-Web, Audiobookshelf, Linkding, n8n, Jellyfin, or home-specific automation.

It should not try to become a giant platform demo on day one. No multi-cluster federation, Backstage, service mesh, Argo Rollouts, custom developer portal, full SIEM pipeline, or Cilium migration in v1 unless one of those becomes the explicit next phase.

It should not expose raw Grafana, raw Prometheus, node names, pod names, namespace names, internal IPs, ingress host inventory, labels, logs, annotations, dashboard JSON, or arbitrary PromQL to the public internet.

It should not hide the fact that it is a small reference environment. The honest story is stronger than pretending a small cluster is a Fortune 500 platform.

## Target reader

The repo is for a technical reviewer with ten minutes.

They should be able to answer:

- What does this platform prove?
- How is the cluster reconciled?
- What guardrails are enforced?
- How are secrets handled?
- What traffic is allowed?
- What telemetry is public, and what is deliberately withheld?
- How do I know this is live?

The README should give that path directly instead of burying it in generic architecture prose.

## Cluster boundary

The cluster should be a separate K3s cluster with a small node footprint. A single-node K3s cluster is acceptable for v1 if that gets the artifact shipped, but the preferred shape is one control-plane node and at least one worker so the environment can show scheduling, node health, and realistic platform operations.

The cluster should be disposable. If rebuilding it from Git is too scary, the reference environment is already drifting into pet infrastructure.

Cluster identity should be public-safe from the start. Use neutral names and avoid personal or LAN-revealing node names in any data that might flow into screenshots, docs, logs, or telemetry.

## Repository shape

The new repo should be simpler than the personal lab repo:

```text
k8s-platform-reference/
├── README.md
├── GitOps/
│   ├── clusters/reference/        # Flux entry point
│   ├── infrastructure/            # ingress, load balancing, secrets, policy, telemetry bridge
│   ├── apps/                      # demo workloads only
│   ├── policies/                  # OPA Gatekeeper templates and constraints
│   └── monitoring/                # kube-prometheus-stack and public-safe metric config
├── docs/
│   ├── architecture.md
│   ├── security/
│   │   ├── policy-as-code.md
│   │   ├── network-policy-model.md
│   │   ├── secret-management.md
│   │   └── public-telemetry-contract.md
│   ├── operations/
│   │   ├── validation-pipeline.md
│   │   ├── bootstrap-runbook.md
│   │   └── rollback-runbook.md
│   └── case-studies/
│       └── 01-reference-platform-boundary.md
├── tests/
│   ├── gatekeeper/
│   └── manifests/
└── renovate.json
```

The repo should stay boring. Boring is good here. The platform is the artifact, not the demo app.

## Platform components for v1

The v1 platform should include Flux and Kustomize for GitOps reconciliation. This is the source-of-truth story.

It should include SOPS with age for encrypted secrets. Even if v1 has few secrets, the point is to show that secret handling was designed in from the beginning.

It should include Traefik for ingress, because that matches the existing personal lab experience and is easy to explain. If Gateway API becomes the chosen path later, it can be a v2 improvement, not a v1 blocker.

It should include MetalLB if the cluster is bare metal and needs LoadBalancer semantics. If the reference cluster uses a different edge path, the docs should say why.

It should include kube-prometheus-stack for Prometheus, Grafana, Alertmanager, and the metrics source used by the public telemetry Worker.

It should include OPA Gatekeeper for admission control. The first policies should be small and explainable: required resource requests/limits, no mutable `latest` image tags, required Pod Security labels on namespaces, and no privileged app pods.

It should include NetworkPolicies from the start. Demo workloads should not land with open traffic simply because they are demos.

It should include Renovate so dependency/image updates become reviewable pull requests instead of manual drift.

## Demo workloads

V1 needs only one or two demo workloads.

The first workload should be a small HTTP service that makes the ingress, Service, Deployment, resource limits, probes, NetworkPolicy, and telemetry path easy to understand.

A second workload can be added only if it teaches segmentation, such as an internal-only backend service reachable from the frontend but not from ingress.

Avoid clever apps. A boring echo service or tiny static app is better than a feature-rich demo that distracts from the platform.

## Public telemetry design

The website should stop pointing public telemetry at the personal cluster and point it at `k8s-platform-reference` instead.

The existing pattern is the right one: Cloudflare Worker calls Grafana using a service account and returns a hand-built sanitized JSON response to the portfolio frontend.

The Worker must not expose raw Grafana responses. It must not accept arbitrary PromQL, arbitrary datasource IDs, panel IDs, dashboard IDs, or query bodies from browser input. The browser should only call a fixed endpoint that returns fixed aggregate fields.

Recommended endpoint:

```text
https://api.s34nj0hn.dev/cluster/heartbeat
```

or:

```text
https://s34nj0hn.dev/api/cluster/heartbeat
```

Avoid exposing a raw `workers.dev` hostname in the portfolio network calls if a first-party route is easy to configure.

The public response can include:

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

The public response must not include:

```text
node names
pod names
namespace names
internal IPs
ingress hosts
storage class names
PVC names
raw labels
raw annotations
Grafana datasource UIDs
Prometheus query strings
logs
trace IDs
service account names
```

The telemetry contract should be documented in `docs/security/public-telemetry-contract.md` and linked from the README.

## Security model

The security story should be layered but not inflated.

Cloudflare protects the public edge and provides the Worker layer. Traefik handles cluster ingress. NetworkPolicies define workload traffic intent. SOPS protects secrets in Git. OPA Gatekeeper rejects selected unsafe Kubernetes objects before they land. kube-prometheus-stack provides the internal metrics source, while the Worker publishes only sanitized aggregates.

The docs should say what this does not solve. It does not replace runtime detection, image vulnerability scanning, RBAC review, host hardening, supply-chain signing, or real incident response. It is a small but disciplined reference platform.

That honesty is part of the signal.

## Gatekeeper policy set for v1

Start with dry-run for every policy. Enforce only after current manifests and demo tests prove there are no surprises.

The first policy set should guard against:

- namespaces without Pod Security labels
- containers without CPU/memory requests and limits
- mutable `latest` image tags
- privileged app pods or host namespace use

Each policy should have one short doc section explaining the failure mode, the rule, the exception path, and a test manifest that should be rejected.

Gatekeeper policies should live in `GitOps/policies`, not mixed into app directories. Flux should reconcile policies after Gatekeeper is installed so CRDs exist before ConstraintTemplates and Constraints are applied.

## GitOps flow

Flux should own the cluster state.

Local commands can bootstrap the cluster, but steady-state changes should go through Git. Pull requests should render Kustomize output, run YAML linting, run kubeconform, and optionally run Gatekeeper policy tests if the tooling is available.

The repo should favor small changes. A policy change, telemetry change, and app change should not all be one commit unless they are genuinely one unit.

## Validation pipeline

The repo should include a CI workflow that runs:

```sh
yamllint .
kubectl kustomize GitOps/clusters/reference
kubectl kustomize GitOps/infrastructure/reference
kubectl kustomize GitOps/apps/reference
kubectl kustomize GitOps/monitoring/reference
kubectl kustomize GitOps/policies/reference
kubeconform -summary -strict -ignore-missing-schemas <rendered files>
```

If Gatekeeper local testing is added, use it for policy tests. If not, keep policy tests as documented server-side dry-run commands until v2.

## Rollout phases

Phase 0 is repo scaffolding and documentation. Create the public README, architecture doc, telemetry contract, and initial GitOps tree without pretending the cluster exists yet.

Phase 1 is cluster bootstrap. Install K3s, bootstrap Flux, reconcile empty or near-empty infrastructure, and prove the repo controls the cluster.

Phase 2 is platform baseline. Add ingress, monitoring, SOPS, NetworkPolicies, and one demo workload.

Phase 3 is policy-as-code. Add Gatekeeper, dry-run policies, test manifests, and then enforce the safe subset.

Phase 4 is public telemetry. Point the Cloudflare Worker and portfolio site at the reference cluster instead of the personal cluster.

Phase 5 is polish. Add the case study, screenshots if useful, README reviewer path, and LinkedIn-ready wording.

## Website update

The portfolio copy should change from:

```text
This portfolio is a live window into my production K3s cluster.
```

to something closer to:

```text
This portfolio includes live telemetry from my Kubernetes platform reference environment: a small GitOps-managed K3s cluster built to demonstrate secure ingress, policy-as-code, encrypted secrets, observability, and public-safe operations.
```

This avoids making the personal cluster the public artifact while keeping the live-proof signal.

## Definition of done for v1

V1 is done when the following are true:

- `s34nj0hn/k8s-platform-reference` exists and is public.
- A real separate K3s cluster is bootstrapped from the repo.
- Flux reconciles the cluster from Git.
- One demo workload is live behind controlled ingress.
- SOPS/age is used for secrets.
- NetworkPolicies are present for demo workloads.
- kube-prometheus-stack is live.
- Gatekeeper is installed with at least four documented policy intents.
- At least one safe Gatekeeper policy is enforced after dry-run validation.
- The Cloudflare Worker returns sanitized aggregate telemetry from this cluster.
- `s34nj0hn.dev` displays telemetry from this cluster, not the personal lab.
- The README gives a ten-minute reviewer path.
- The docs explain what the platform proves and what it deliberately does not claim.

## Open decisions before implementation

The hardware target needs to be chosen: single-node K3s for speed, or one control-plane plus one worker for a stronger platform signal.

The public API route should be chosen: `api.s34nj0hn.dev/cluster/heartbeat` or a same-origin route under `s34nj0hn.dev/api/cluster/heartbeat`.

The first demo app should be chosen. The default should be a tiny HTTP service unless there is a strong reason to use something else.

The first enforced Gatekeeper policy should be chosen after dry-run. The likely candidate is disallowing `latest` image tags or requiring Pod Security labels on namespaces.
