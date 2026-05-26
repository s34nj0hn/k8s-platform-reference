# Validation pipeline

Flux should not be the first system to discover broken YAML.

The planned local and CI checks are:

```sh
yamllint .
kubectl kustomize GitOps/clusters/reference
kubectl kustomize GitOps/infrastructure/reference
kubectl kustomize GitOps/apps/reference
kubectl kustomize GitOps/monitoring/reference
kubectl kustomize GitOps/policies/reference
kubeconform -summary -strict -ignore-missing-schemas <rendered files>
```

Gatekeeper tests come after the first ConstraintTemplates exist. Until then, policy examples should stay as server-side dry-run commands in the docs.
