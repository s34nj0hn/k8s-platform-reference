# Terraform State

Terraform state is infrastructure metadata. It records what Terraform believes it owns and stores attributes returned by providers.

That makes state sensitive. Marking an output as `sensitive = true` hides display output; it does not remove values from state.

This root demonstrated that directly. It briefly managed `cloudflare_record.api`, a proxied record whose target address sat in state in the clear, even though the variable feeding it was marked sensitive and the whole point of proxying is that the origin is not public.

That record has since been released, because Cloudflare Workers owns it. State no longer holds a sensitive attribute. The rule still stands for whatever this root manages next: treat state as a secret-bearing artifact, not as build output, and decide that before adding a resource rather than after.

## Current State Policy

State for `Terraform/cloudflare-edge` lives in HCP Terraform (formerly Terraform Cloud), in the workspace `k8s-platform-reference-cloudflare-edge`.

The backend is declared as a `cloud` block in `versions.tf`. That block cannot use variables, so the organization name is literal in the file.

This root previously used local state. That was acceptable while it only read the Cloudflare zone. It stopped being acceptable once the root adopted a live DNS record, because the local file then held a sensitive attribute for a real public resource with no access control around it.

Local state files must never be committed:

```text
*.tfstate
*.tfstate.*
*.tfplan
.terraform/
```

Those patterns stay in `.gitignore` even with a remote backend, because migration and troubleshooting can still produce local files.

## Execution Mode

The workspace runs in **local execution** mode.

HCP Terraform stores and locks state. Plans and applies still run on the operator's machine using local Cloudflare credentials.

This is deliberate. The alternative, remote execution, would require storing a Cloudflare API token in HCP Terraform so their runners could reach the provider. Local execution keeps provider credentials on one machine and limits the third party to state storage.

The trade is that there is no run history or policy enforcement in the HCP Terraform UI. For a single-operator root managing one DNS record, that is an acceptable loss.

## Who Can Read State

State is readable by members of the HCP Terraform organization with access to the workspace.

Keep the organization to a single owner. Do not add collaborators to this workspace without re-reading the sensitive-attribute note at the top of this document.

## How Locking Works

HCP Terraform locks state for the duration of a run and releases it on completion.

A crashed or interrupted run can leave a lock in place. Locks are cleared from the workspace settings in the HCP Terraform UI. Do not work around a stuck lock by reverting to local state.

## How Recovery Works

HCP Terraform retains previous state versions for the workspace. Rolling back is a rollback to a prior state version, not a restore from a file.

If state is lost entirely, this root is cheap to rebuild. It manages a single zone ruleset, and a ruleset can be recreated from configuration rather than adopted, so recovery is `terraform init` followed by `terraform apply`.

That is only true while the root stays this small. It stops being true as soon as this root manages something that must be adopted rather than recreated, which is the reason to keep state remote now rather than later.

## Practical Rules

Do not commit state files.

Do not commit plan files.

Do not put credentials in `.tfvars`.

Do not assume `sensitive = true` makes state safe.

Do not sync state through consumer file-sync tools. Backup and access control are different problems, and file sync solves only the first.

Do not let Terraform and Flux manage the same Kubernetes object.
