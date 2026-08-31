# Terraform Layer

Terraform manages platform primitives around the reference cluster. Flux manages Kubernetes resources inside the cluster. This boundary is intentional: Terraform handles infrastructure ownership and state; Flux handles continuous reconciliation of cluster desired state.

## Current Roots

```text
cloudflare-edge/  # edge controls for s34nj0hn.dev
```

State lives in HCP Terraform, not on disk. See `docs/operations/terraform-state.md`.

## Ownership Boundary

Terraform may manage repository governance, remote state, edge security posture such as zone TLS settings and CAA records, and later host/VM scaffolding.

Terraform must not manage Flux-owned Kubernetes resources under `GitOps/`. If both Terraform and Flux think they own the same live object, the platform has two controllers fighting over one resource.

Flux is not the only other claimant. Anything that provisions on its own owns what it creates:

- **Wrangler** creates and manages the DNS record for any Worker route declared with `custom_domain = true`. That is why `api.s34nj0hn.dev` is not a Terraform resource.
- **`cloudflared tunnel route dns`** creates the DNS record for a tunnel hostname.
- **Controllers that write back to their own resources** own what they write.

The test is not "can Terraform manage this?" It is "does something else already create this?" A record that appears in the Cloudflare dashboard looks adoptable whether or not another system owns it.

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
