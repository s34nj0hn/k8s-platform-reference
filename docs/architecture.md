# Architecture

This is a separate Kubernetes reference cluster, not a cleaned-up corner of older infrastructure.

The v1 shape is small: a single-node K3s cluster inside the `k8s-reference-01` KVM/libvirt VM on Gaia, with Flux, a few platform controllers, one or two demo workloads, and public-safe telemetry. The cluster should have its own Kubernetes API, kubeconfig, Flux bootstrap, Grafana service account, and Cloudflare Worker path.

Local administration reaches the API through an SSH tunnel from the workstation to Gaia, then to the VM on the libvirt network: `127.0.0.1:16443 -> gaia -> 192.168.122.50:6443`.

It can share the same physical network and the same operating lessons as earlier systems. It should not share the same story. This cluster should be easy to review, rebuild, and explain.

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
