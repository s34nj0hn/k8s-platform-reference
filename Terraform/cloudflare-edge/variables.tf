variable "api_record_content" {
  description = "Current content for the api.s34nj0hn.dev Cloudflare DNS record."
  type        = string
  sensitive   = true
}

variable "zone_name" {
  description = "Cloudflare DNS zone name for the reference platform."
  type        = string
  default     = "s34nj0hn.dev"
}
