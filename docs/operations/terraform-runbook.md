# Terraform Runbook

Terraform is used for platform primitives around the reference cluster. Flux is used for Kubernetes desired state inside the cluster.

Run Terraform from a specific root directory:

```sh
cd Terraform/cloudflare-edge
```

The normal local loop is:

```sh
terraform init
terraform fmt -check
terraform validate
terraform plan
```

`terraform init` prepares the root and downloads provider plugins.

`terraform fmt -check` verifies standard HCL formatting.

`terraform validate` checks whether the configuration is structurally valid.

`terraform plan` compares configuration, state, and provider reality.

Do not run `terraform apply` until the plan has been reviewed and the intended owner of each resource is clear.

## Boundary Check Before Apply

Before applying any Terraform change, answer:

- Is this object outside the Kubernetes resources Flux owns?
- Is the provider credential scoped tightly enough?
- Will the state file contain anything sensitive?
- Is the rollback or import path documented?

If any answer is unclear, stop at `plan`.
