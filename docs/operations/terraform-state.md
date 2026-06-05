# Terraform State

Terraform state is infrastructure metadata. It records what Terraform believes it owns and stores attributes returned by providers.

That makes state sensitive. Marking an output as `sensitive = true` hides display output; it does not remove values from state.

## Current State Policy

The first Cloudflare root starts with local state while it is read-only and used for learning.

Local state files must never be committed:

```text
*.tfstate
*.tfstate.*
*.tfplan
.terraform/
```

Before Terraform manages real resources, choose and document a remote backend. The backend decision should explain who can read state, how locking works, and how recovery works.

## Practical Rules

Do not commit state files.

Do not commit plan files.

Do not put credentials in `.tfvars`.

Do not assume `sensitive = true` makes state safe.

Do not let Terraform and Flux manage the same Kubernetes object.
