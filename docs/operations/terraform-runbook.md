# Terraform Runbook

Terraform is used for platform primitives around the reference cluster. Flux is used for Kubernetes desired state inside the cluster.

Run Terraform from a specific root directory:

```sh
cd Terraform/cloudflare-edge
```

## First-Time Setup

State for this root lives in HCP Terraform. Authenticate once per machine before anything else works:

```sh
terraform login
```

That stores an API token in `~/.terraform.d/credentials.tfrc.json`. It is a credential. Do not copy it into the repo.

The workspace must exist in HCP Terraform, and the organization name in `versions.tf` must match it.

Because this workspace uses local execution, variables set in the HCP Terraform UI are not applied. This root currently takes no required variables, so nothing else has to be supplied. If that changes, variables come from `TF_VAR_` environment values or a gitignored `.tfvars` file, not from the HCP UI.

## Normal Local Loop

```sh
terraform init
terraform fmt -check
terraform validate
terraform plan
```

`terraform init` prepares the root, downloads provider plugins, and connects to the HCP Terraform workspace. It fails if `terraform login` has not been run.

`terraform fmt -check` verifies standard HCL formatting.

`terraform validate` checks whether the configuration is structurally valid.

`terraform plan` compares configuration, state, and provider reality.

Do not run `terraform apply` until the plan has been reviewed and the intended owner of each resource is clear.

## Boundary Check Before Apply

Before applying any Terraform change, answer:

- Is this object outside the Kubernetes resources Flux owns?
- Is this object outside what Wrangler creates for the Worker?
- Is the provider credential scoped tightly enough?
- Will the state file contain anything sensitive?
- Is the rollback or import path documented?

If any answer is unclear, stop at `plan`.

The Wrangler question is on this list because the boundary was crossed once. A Worker route declared with `custom_domain = true` makes Cloudflare create and manage the DNS record for that hostname. The record is visible in the DNS dashboard and looks adoptable, but it is not: Wrangler recreates it on deploy with a new record ID, which strands any Terraform state pinned to the old one.

Flux is not the only other system with a claim. Anything that provisions on its own — Wrangler, `cloudflared tunnel route dns`, a Helm chart with a controller that writes back — owns what it creates.
