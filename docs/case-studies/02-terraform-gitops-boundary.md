# Terraform and GitOps Boundary

The reference platform has two desired-state systems, and they need different jobs.

Terraform owns platform primitives around the cluster. Flux owns Kubernetes resources inside the cluster.

That boundary is the architecture.

## Control Plane Split

```text
Terraform -> platform foundation and external APIs
Flux      -> Kubernetes desired state
Worker    -> public-safe telemetry response
```

Terraform is good at provisioning and adopting external infrastructure: DNS, edge routing, repository settings, remote state, and eventually VM scaffolding.

Flux is good at continuously reconciling Kubernetes manifests: Deployments, Services, HelmReleases, Gatekeeper policies, NetworkPolicies, and monitoring resources.

The Cloudflare Worker sits at the public edge. It should expose sanitized health data, not raw platform internals.

## What Terraform Must Not Do

Terraform should not manage the same resources under `GitOps/` that Flux reconciles.

If Terraform creates a Kubernetes Deployment and Flux also manages that Deployment, the system now has two controllers trying to enforce different versions of reality. That is not sophistication. That is a bug with YAML.

## First Terraform Target

The first Terraform root is `Terraform/cloudflare-edge`. It reads the `s34nj0hn.dev` Cloudflare zone before it manages anything.

That keeps the first lesson safe:

```text
data source first, resource later
read before own
plan before apply
```

## Review Signal

A reviewer should be able to see that the platform is not just Kubernetes manifests. It has a defined lower layer, a GitOps layer, and a public telemetry layer with a narrow exposure contract.
