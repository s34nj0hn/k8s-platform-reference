# Roadmap

This file keeps planned work out of the README so the README can stay focused on the current portfolio story.

The rule for this repo is simple: only claim what exists, and keep future work visible enough that a reviewer can see the direction.

## Next Useful Improvements

### SOPS and age-managed secrets

The intended GitOps secret pattern is SOPS with age. The current Cloudflare tunnel token is created out-of-band and is not committed to Git. That is safer than plaintext secrets, but it is not the final encrypted-secret workflow.

Planned work:

- Add `.sops.yaml` with age recipient configuration.
- Document key ownership and recovery expectations.
- Move eligible Kubernetes Secret manifests into encrypted GitOps form.
- Keep private keys, service account tokens, kubeconfigs, and Cloudflare credentials out of the repo.

### CI validation

Flux should not be the first system to discover broken manifests.

Planned work:

- Add a GitHub Actions workflow.
- Render all GitOps entry points with `kubectl kustomize`.
- Validate rendered manifests with `kubeconform` where schemas are available.
- Run public telemetry Worker tests and typecheck.
- Keep validation readable enough that a recruiter can understand what passed.

### Expanded Gatekeeper policy set

The current Gatekeeper policy set is intentionally narrow: required namespace labels and no privileged application pods.

Planned work:

- Require workload resource requests and limits in application namespaces.
- Consider restrictions for host networking, host PID, host IPC, and hostPath usage.
- Keep platform namespace exemptions explicit.
- Document every enforced policy in human language before expanding the catalog.

### Public portfolio integration

The public heartbeat endpoint exists. The next step is to make the portfolio consume it in a way that is useful but not noisy.

Planned work:

- Display sanitized cluster health on the portfolio site.
- Cache public responses so Grafana is not turned into a public query target.
- Keep the UI clear that this is a reference platform, not a production SLA.

## Deliberately Not In Scope Yet

- Multi-cluster federation
- Service mesh
- Developer portal
- Full SIEM pipeline
- Runtime threat detection
- Backup and disaster-recovery proof
- Production incident-response program

Those may be useful later. They are not needed to make this reference platform credible.

