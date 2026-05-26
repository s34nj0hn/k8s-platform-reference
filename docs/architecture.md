# Architecture

This is a separate Kubernetes reference cluster, not a cleaned-up corner of my personal homelab.

The intended shape is small: K3s, Flux, a few platform controllers, one or two demo workloads, and public-safe telemetry. The cluster should have its own Kubernetes API, kubeconfig, Flux bootstrap, Grafana service account, and Cloudflare Worker path.

It can share the same physical network and the same operating lessons as my lab. It should not share the same story. The personal lab is allowed to be messy because it runs real things. This cluster should be easy to review.

## Platform layers

| Layer | Intended implementation |
| --- | --- |
| Kubernetes | K3s reference cluster |
| GitOps | Flux + Kustomize |
| Secrets | SOPS + age |
| Ingress | Traefik |
| Bare-metal LoadBalancer | MetalLB, if the cluster needs LoadBalancer semantics |
| Observability | kube-prometheus-stack |
| Admission control | OPA Gatekeeper |
| Dependency updates | Renovate |
| Public telemetry | Cloudflare Worker returning sanitized aggregate JSON |

## Boundary

The reference cluster should be rebuilt from Git without drama. If rebuilding it becomes scary, it has drifted into pet infrastructure.

Public docs and telemetry should avoid names that reveal my home network, node naming scheme, internal addresses, service inventory, or storage layout.
