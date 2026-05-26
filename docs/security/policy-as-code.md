# Policy as code

Gatekeeper is here to turn a few repo conventions into admission checks.

The first policies should be boring and obvious. Namespaces need Pod Security labels. Containers need CPU and memory requests and limits. Images should not use `latest`. App pods should not run privileged or borrow host namespaces.

Every policy starts in dry-run. That is the difference between platform engineering and breaking your own cluster to prove a point. Once the rendered manifests and server-side dry-run tests are clean, the safe subset can move to enforcement.

Gatekeeper does not replace Pod Security Admission, NetworkPolicy, image scanning, RBAC review, host hardening, or incident response. It blocks bad Kubernetes objects before they land. That is useful, but it is not magic.
