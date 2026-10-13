terraform {
  required_version = ">= 1.5.7"

  cloud {
    organization = "s34nj0hn-org"

    workspaces {
      name = "k8s-reference-lab"
    }
  }

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.52"
    }
  }
}
