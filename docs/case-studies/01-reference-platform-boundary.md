# Reference platform boundary

The personal homelab is useful because it is real. It also carries personal services, old migrations, storage decisions, and operational scars. That makes it a good workshop and a noisy portfolio artifact.

This repo creates a cleaner boundary.

The personal lab keeps running real life. `k8s-platform-reference` becomes the public proof surface: a small real cluster with GitOps, policy-as-code, observability, encrypted secrets, network policy, and sanitized telemetry.

The tradeoff is deliberate. A smaller reference cluster is less dramatic than a full homelab, but it is easier to review and safer to connect to a public website.
