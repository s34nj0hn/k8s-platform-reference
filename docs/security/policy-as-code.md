# Policy as code

Policy as code is how this cluster turns design intent into API-server behavior.
The point is not to make the cluster look strict on paper. The point is to stop a small set of risky objects before they become running infrastructure.

Admission control exists because GitOps only helps if the desired state is safe enough to apply. A pull request can explain intent, but the Kubernetes API still needs a guardrail for the cases people miss: an unlabeled namespace, a workload asking for privileged access, or a manifest applied directly during troubleshooting. Gatekeeper gives the cluster a final review step at admission time.

## Risk model

This v1 focuses on two risks that are easy to explain and useful to enforce early.

First, namespaces need ownership and purpose labels. That sounds administrative, but it matters operationally. When an alert fires, a quota needs tuning, or a policy violation shows up, the namespace should already say what it belongs to, who owns it, and why it exists. Without that metadata, every incident starts with inventory work.

Second, demo workloads should not run privileged containers. A privileged container is much closer to the host than a normal container. Depending on the node configuration and mounted paths, it can bypass normal container isolation, manipulate kernel interfaces, inspect host devices, or make host-level changes that a regular workload should never need. There are valid uses for privileged containers in platform plumbing, but they should be exceptional and isolated from application namespaces.

## Current controls

The first policy is intentionally boring: application namespaces must say what they belong to, who owns them, and why they exist. This makes namespace inventory readable before the platform adds heavier controls.

Required namespace labels:

- `app.kubernetes.io/part-of`
- `platform.s34nj0hn.dev/owner`
- `platform.s34nj0hn.dev/purpose`

The policy excludes platform and bootstrap namespaces where labels are either managed elsewhere or not useful for the portfolio story: `kube-system`, `flux-system`, `gatekeeper-system`, `default`, and `local-path-storage`.

The second policy blocks privileged containers in demo workloads. It checks both `containers` and `initContainers` on Pods, and excludes platform namespaces that are managed by Kubernetes, Flux, Gatekeeper, or local storage plumbing: `kube-system`, `flux-system`, `gatekeeper-system`, and `local-path-storage`.

In practical terms, Gatekeeper prevents these failures now:

- Creating an application namespace without `app.kubernetes.io/part-of`, `platform.s34nj0hn.dev/owner`, and `platform.s34nj0hn.dev/purpose`.
- Running a Pod in an application namespace when any regular container sets `securityContext.privileged: true`.
- Running a Pod in an application namespace when any init container sets `securityContext.privileged: true`.

## What this does not solve

This is a narrow v1, not a complete Kubernetes security program.

Gatekeeper does not replace Pod Security Admission, NetworkPolicy, image scanning, RBAC review, host hardening, runtime detection, backup testing, or incident response. It also does not prove every allowed workload is safe. It blocks the specific bad shapes described above before they land in the cluster.

That tradeoff is deliberate. A small set of enforced controls is easier to review than a large policy catalog that nobody can explain.

## Verification

Render the policy set before applying it:

```bash
kubectl kustomize GitOps/policies/reference >/tmp/reference-policies.yaml
```

Once Gatekeeper is installed and the constraint is active, an unlabeled application namespace should be denied:

```bash
kubectl --context k8s-platform-reference create ns should-fail
```

Expected result: Gatekeeper denies the request and reports the missing ownership labels.

Once Gatekeeper is installed, the privileged-container constraint is active, and the `demo-app` namespace exists with the required labels, the rejected fixture should be denied without leaving a Pod behind:

```bash
kubectl --context k8s-platform-reference apply --dry-run=server -f tests/gatekeeper/privileged-pod.yaml
```

Expected result: Gatekeeper denies the request with a message like `privileged container "privileged-app" is not allowed in namespace "demo-app"` or `privileged container "privileged-init" is not allowed in namespace "demo-app"`.

Do not run this live denial check until Gatekeeper is installed. Use `--dry-run=server` so rejected resources are not persisted to the cluster.

A namespace with the required labels should be accepted:

```bash
kubectl --context k8s-platform-reference create ns demo-app --dry-run=client -o yaml \
  | kubectl --context k8s-platform-reference label -f - \
    app.kubernetes.io/part-of=k8s-platform-reference \
    platform.s34nj0hn.dev/owner=platform \
    platform.s34nj0hn.dev/purpose=demo \
    --local -o yaml \
  | kubectl --context k8s-platform-reference apply -f -
```
