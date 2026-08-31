# Roadmap

This file keeps planned work out of the README so the README can stay focused on the current portfolio story.

The rule for this repo is simple: only claim what exists, and keep future work visible enough that a reviewer can see the direction.

That rule cuts both ways. Work that has shipped should not still be listed as planned.

## Recently Shipped

- **Terraform remote state.** State for `cloudflare-edge` lives in HCP Terraform, workspace `k8s-platform-reference-cloudflare-edge`, in local execution mode so Cloudflare credentials stay on the operator machine.
- **Portfolio consumption of the heartbeat.** The public site at `https://s34nj0hn.dev` reads the sanitized heartbeat directly.
- **Response caching.** The Worker serves from the Cloudflare cache with a 30 second default TTL, bounded to 300 seconds, so Grafana is not turned into a public query target.

## Corrected

- **Released the `api.s34nj0hn.dev` DNS record.** Terraform adopted this record in May. It should not have. `wrangler.toml` declares the hostname as a Worker custom domain, which makes Cloudflare Workers create and manage the underlying record, so two systems held a claim on one object. Wrangler recreated the record on a later deploy, the record ID in Terraform state went stale, and `terraform plan` began proposing to create a record that already existed.

  The record was released with `terraform state rm`, not `terraform destroy`, so the live record was never touched. The boundary check in `docs/operations/terraform-runbook.md` now asks about Wrangler as well as Flux.

## Next Useful Improvements

### Edge security posture

Releasing the DNS record left this root with nothing to manage, so it needed resources that are genuinely Terraform-owned.

A rate limiting ruleset was the first attempt and was abandoned: Cloudflare gates the `http_ratelimit` phase behind the paid WAF add-on. Rate limiting moved into the Worker, which has a binding for it at no cost, and Terraform took the zone security posture instead.

`zone-settings.tf` declares TLS posture. `caa.tf` restricts which certificate authorities may issue for the domain. Neither has been applied yet, so the zone does not currently carry either. The remaining work below is what applying them requires.

Remaining work:

- Verify the CAA issuer list against Cloudflare's current documented set, then apply. A wrong list does not fail at apply time; it fails weeks later when Universal SSL cannot renew.
- Apply zone settings and confirm nothing on the zone depended on TLS 1.0 or 1.1.
- Raise HSTS `max_age` from one day to one year once every hostname is confirmed HTTPS-only.
- Delete the leftover local `terraform.tfstate`, `terraform.tfstate.backup`, and `import-api.tfplan`.

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

### External availability monitoring

The heartbeat is now the front door: the portfolio site renders it, so an outage is visible to visitors before it is visible to me.

Nothing currently watches it from outside. Prometheus runs inside the cluster the endpoint reports on, which means the system that would raise the alarm fails at the same moment the endpoint does.

Planned work:

- Add an external blackbox check against `GET /cluster/heartbeat`.
- Alert on non-200 responses and on `status: "error"` bodies, which return HTTP 502 by design.
- Keep the check outside the reference cluster so it survives a cluster or tunnel outage.

## Deliberately Not In Scope Yet

- Multi-cluster federation
- Service mesh
- Developer portal
- Full SIEM pipeline
- Runtime threat detection
- Backup and disaster-recovery proof
- Production incident-response program

Those may be useful later. They are not needed to make this reference platform credible.

