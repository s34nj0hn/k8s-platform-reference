# Terraform Layer

Terraform manages platform primitives around the reference cluster. Flux manages Kubernetes resources inside the cluster. This boundary is intentional: Terraform handles infrastructure ownership and state; Flux handles continuous reconciliation of cluster desired state.

## Current Roots

```text
cloudflare-edge/  # read/adopt public edge resources for s34nj0hn.dev
```

## Ownership Boundary

Terraform may manage or adopt DNS, Cloudflare edge routing, repository governance, remote state, and later host/VM scaffolding.

Terraform must not manage Flux-owned Kubernetes resources under `GitOps/`. If both Terraform and Flux think they own the same live object, the platform has two controllers fighting over one resource.

## Local Workflow

Run Terraform from a root directory, not from this top-level folder:

```sh
cd Terraform/cloudflare-edge
terraform init
terraform fmt -check
terraform validate
terraform plan
```

Provider credentials come from environment variables. Never commit API tokens, `.tfvars` files with secrets, plan files, or state files.
