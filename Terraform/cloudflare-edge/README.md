# Cloudflare Edge Terraform Root

This root is the first Terraform learning surface for the reference platform.

It starts read-only. The first task is to prove Terraform can authenticate to Cloudflare and read the `s34nj0hn.dev` zone without managing or changing anything.

## What This Teaches

A provider is Terraform's API adapter. Here, the provider is Cloudflare.

A data source reads something that already exists. `data.cloudflare_zone.main` reads the DNS zone but does not own it.

A resource manages lifecycle. This root intentionally has no managed resources yet.

State is Terraform's memory. Even read-only data can appear in state, so state files are never committed.

## Authentication

Set the token in your shell before running `plan`:

```sh
export CLOUDFLARE_API_TOKEN="..."
```

The token needs enough permission to read the `s34nj0hn.dev` zone. Do not put tokens in `.tfvars`, README examples, or committed files.

## First Commands

```sh
cd Terraform/cloudflare-edge
terraform init
terraform fmt -check
terraform validate
terraform plan
```

Expected first result: Terraform reads the Cloudflare zone and proposes no managed resource changes.

## Why Provider Version 4.x

This root pins Cloudflare provider `~> 4.52` because the v4 `cloudflare_zone` data source supports a simple `name = var.zone_name` lookup. Provider v5 has breaking schema changes and is not the right first lesson.
