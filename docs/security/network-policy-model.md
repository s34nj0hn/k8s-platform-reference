# Network policy model

Demo workloads should not be open just because they are demos.

Each app namespace should start from default-deny and then name the traffic it actually needs: ingress, health checks, metrics, DNS, and any intentional service-to-service calls.

The goal is simple. Traffic intent should live in Git. If a workload can talk to something, the repo should explain why.
