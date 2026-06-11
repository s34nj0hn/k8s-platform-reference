resource "cloudflare_record" "api" {
  zone_id = data.cloudflare_zone.main.id
  name    = "api"
  type    = "AAAA"
  content = var.api_record_content
  proxied = true
  ttl     = 1
}
