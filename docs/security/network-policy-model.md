# Network policy model

Demo workloads should not be open just because they are demos.

Each app namespace should start from default-deny and then name the traffic it actually needs: ingress, health checks, metrics, DNS, and any intentional service-to-service calls.

The goal is simple. Traffic intent should live in Git. If a workload can talk to something, the repo should explain why.

## Current demo-app policy set

The `demo-app` namespace now starts from a default-deny policy for ingress and egress.

Explicit allowances are intentionally small:

- DNS egress from `demo-app` pods to CoreDNS in `kube-system` on TCP/UDP 53.
- HTTP ingress to the `demo-app` web pod on TCP 8080 from pods in the `demo-app` namespace.
- HTTP ingress to the `demo-app` web pod on TCP 8080 from namespaces labeled `platform.s34nj0hn.dev/purpose=observability`.

There is no broad egress allowance for the demo workload. If the demo app later needs outbound traffic, that dependency should be added as a named policy with a narrow destination.
