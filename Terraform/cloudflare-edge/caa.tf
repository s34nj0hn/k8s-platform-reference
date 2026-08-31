# CAA records for s34nj0hn.dev.
#
# CAA restricts which certificate authorities may issue for this domain. A CA
# that is not listed is required to refuse issuance.
#
# READ BEFORE APPLYING.
#
# Cloudflare Universal SSL issues the certificate that serves this zone. If the
# CA it uses is not in this list, renewal fails and the site loses TLS. The
# failure is not immediate: the current certificate keeps working until it
# expires, so a wrong list here breaks the site weeks later.
#
# This list was verified against Cloudflare's documented CA set on 2026-08-18.
# Re-check it if Cloudflare changes issuers, and before adding any certificate
# that Universal SSL does not provision. `issuewild` matters because Universal
# SSL covers *.s34nj0hn.dev as well as the apex.
#
# This is a Terraform-owned object. Unlike the api record, nothing else creates
# CAA records for this zone.

locals {
  caa_issuers = {
    letsencrypt = "letsencrypt.org"
    google      = "pki.goog; cansignhttpexchanges=yes"
    sslcom      = "ssl.com"
    sectigo     = "sectigo.com"
  }

  caa_records = merge(
    { for key, issuer in local.caa_issuers : "issue_${key}" => { tag = "issue", value = issuer } },
    { for key, issuer in local.caa_issuers : "issuewild_${key}" => { tag = "issuewild", value = issuer } },
  )
}

resource "cloudflare_record" "caa" {
  for_each = local.caa_records

  zone_id = data.cloudflare_zone.main.id
  name    = var.zone_name
  type    = "CAA"
  ttl     = 1

  data {
    flags = 0
    tag   = each.value.tag
    value = each.value.value
  }
}
