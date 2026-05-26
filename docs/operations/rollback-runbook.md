# Rollback runbook

Rollback should usually be a Git revert followed by Flux reconciliation.

For policy failures, fix or suspend the policy layer before touching the Gatekeeper controller. For platform-controller failures, revert the last GitOps change and reconcile the affected Kustomization.

Break-glass commands belong here only after the live cluster exists and the real resource names are known.
