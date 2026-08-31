# Zone-level TLS posture for s34nj0hn.dev.
#
# These settings are Terraform-owned. Nothing else writes them: Wrangler manages
# Worker routes and their DNS records, cloudflared manages tunnel hostnames, and
# neither touches zone settings.
#
# This resource takes ownership of the zone settings object. Changes made in the
# Cloudflare dashboard will show up as drift on the next plan. That is intended.
#
# `ssl` is deliberately not managed here. Changing the zone SSL mode affects
# every origin behind the zone, and this root does not know what serves the
# apex. Set it deliberately, not as a side effect of TLS hardening.

resource "cloudflare_zone_settings_override" "main" {
  zone_id = data.cloudflare_zone.main.id

  settings {
    always_use_https         = "on"
    automatic_https_rewrites = "on"
    min_tls_version          = "1.2"
    tls_1_3                  = "on"
    opportunistic_encryption = "on"

    # HSTS is the one setting here with a lasting client-side effect. Browsers
    # honour max_age even if the header stops being sent, so this starts at one
    # day. Raise it to 31536000 once every hostname on the zone is confirmed
    # HTTPS-only, and leave preload off until you intend that commitment.
    security_header {
      enabled            = true
      max_age            = 86400
      include_subdomains = true
      preload            = false
      nosniff            = true
    }
  }
}
