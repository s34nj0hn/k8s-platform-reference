# Validation pipeline

Flux should not be the first system to discover broken YAML.

Everything here runs by hand. This repo has no CI, so nothing below is enforced on a push or a pull request. That is a real gap, tracked in `docs/roadmap.md`.

## What runs today

Render every Flux entry point. If a Kustomization does not build locally, Flux will fail on it in the cluster:

```sh
for p in clusters infrastructure apps monitoring policies; do
  kubectl kustomize "GitOps/$p/reference" > /dev/null && echo "$p ok"
done
```

Test and typecheck the public telemetry Worker:

```sh
npm --prefix workers/public-telemetry test        # 8 passing
npm --prefix workers/public-telemetry run typecheck
```

Check the Cloudflare Terraform root:

```sh
terraform -chdir=Terraform/cloudflare-edge fmt -check
terraform -chdir=Terraform/cloudflare-edge validate
```

## Does the policy actually deny?

A ConstraintTemplate that renders is not a control. It becomes one when the admission webhook refuses a bad object.

`tests/gatekeeper/privileged-pod.yaml` is a fixture that must be rejected. Run it against the cluster with a server-side dry run:

```sh
kubectl --context k8s-platform-reference apply --dry-run=server -f tests/gatekeeper/privileged-pod.yaml
```

Expected:

```text
Error from server (Forbidden): admission webhook "validation.gatekeeper.sh" denied the request:
[disallow-privileged-containers] privileged container "privileged-app" is not allowed in namespace "demo-app"
[disallow-privileged-containers] privileged container "privileged-init" is not allowed in namespace "demo-app"
```

A success here is a failure. If that command creates the pod, the constraint has stopped enforcing.

This one needs cluster access through the local tunnel, so it is the only check that cannot run from a fresh clone.

## What is missing

`yamllint` and `kubeconform` were listed here as part of the pipeline. Neither is installed and no `.yamllint` config exists in this repo, so neither has ever run against it. They are worth adding, and until they do run they should not be described as checks.

`kubeconform` needs its flags chosen deliberately. Run with `-ignore-missing-schemas` it skips every CRD without warning, which is where HelmRelease, Kustomization, ConstraintTemplate, and Constraint mistakes live. Point `-schema-location` at a CRD catalog instead, or the summary line will report success while validating almost nothing.

The order of work is CI first, then `kubeconform` with real schemas, then `yamllint`. A check nobody runs is not a check.
