terraform {
  required_version = ">= 1.5.7"

  cloud {
    # Yes, that is the real org name, and it is deliberate.
    organization = "TST_ORG_PLS_IGNR"

    workspaces {
      name = "k8s-platform-reference-cloudflare-edge"
    }
  }

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.52"
    }
  }
}
