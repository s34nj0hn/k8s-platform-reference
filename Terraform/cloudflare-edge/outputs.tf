output "zone_id" {
  description = "Cloudflare zone ID for the reference platform domain."
  value       = data.cloudflare_zone.main.id
}

output "zone_name" {
  description = "Cloudflare zone name read by Terraform."
  value       = data.cloudflare_zone.main.name
}
