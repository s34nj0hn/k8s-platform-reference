# Cloudflare Edge Terraform Root

This root manages edge controls for `s34nj0hn.dev`. It is small on purpose.

It owns the zone's security posture: TLS settings and CAA records. It reads the DNS zone. It owns nothing else.

## What This Teaches

A provider is Terraform's API adapter. Here, the provider is Cloudflare.

A data source reads something that already exists. `data.cloudflare_zone.main` reads the DNS zone but does not own it.

A resource manages lifecycle. `cloudflare_zone_settings_override.main` and the `cloudflare_record.caa` set are what this root manages.

`for_each` builds ten CAA records from one map of certificate authorities, rather than ten copies of the same block.

State is Terraform's memory. Even read-only data appears in state, which is why state is never committed and now lives in HCP Terraform rather than on disk.

## What This Root Deliberately Does Not Manage

The DNS record for `api.s34nj0hn.dev` is not here, and that is the most useful lesson in this directory.

This root adopted that record in May 2026. It should not have. `workers/public-telemetry/wrangler.toml` declares the hostname as a Worker custom domain, which makes Cloudflare Workers create and manage the underlying record. Two systems held a claim on one object.

The failure was not immediate. Wrangler recreated the record during a later Worker deploy, which gave it a new record ID. Terraform state still pointed at the old ID, so refresh found nothing and `terraform plan` began proposing to create a record that already existed. Applying that plan would have fought the Workers platform for a hostname that serves the public heartbeat.

The record was released with `terraform state rm`, which detaches without deleting. `terraform destroy` would have taken the live endpoint down.

Rate limiting was the first replacement considered, but Cloudflare gates the `http_ratelimit` ruleset phase behind the paid WAF add-on. Rather than buy a product to give Terraform something to do, the rate limiting moved into the Worker itself, where a binding provides it at no cost, and this root took the zone security posture instead.

That split is the right one regardless of pricing. The limiter belongs next to the fixed-query logic it protects. Zone-wide TLS and CAA belong in Terraform, because nothing else writes them.

## Authentication

Two credentials are needed, and they are separate.

State access, once per machine:

```sh
terraform login
```

Cloudflare API access, in your shell before running `plan`:

```sh
export CLOUDFLARE_API_TOKEN="..."
```

The token needs `Zone → Zone → Read`, `Zone → Zone Settings → Edit`, and `Zone → DNS → Edit`, all scoped to `s34nj0hn.dev`. Do not put tokens in `.tfvars`, README examples, or committed files.

A read-only token is enough for `plan` and will fail on `apply` with Cloudflare error `10000`. That error is a permissions rejection, not a credential problem.

This workspace runs in local execution mode, so the Cloudflare token stays on this machine and is never stored in HCP Terraform.

## Normal Commands

```sh
cd Terraform/cloudflare-edge
terraform init
terraform fmt -check
terraform validate
terraform plan
```

Expected result on a clean tree: no changes.

## Why Provider Version 4.x

This root pins Cloudflare provider `~> 4.52` because the v4 `cloudflare_zone` data source supports a simple `name = var.zone_name` lookup. Provider v5 has breaking schema changes and is not worth adopting for a root this small.
