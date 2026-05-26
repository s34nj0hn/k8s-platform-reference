# Secret management

Secrets should be encrypted before they touch Git.

This repo will use SOPS and age for Kubernetes secrets. No plaintext credentials, Grafana tokens, Cloudflare tokens, kubeconfigs, age private keys, or service account tokens belong here.

The cluster should stay disposable. The secret pattern should still be serious.
