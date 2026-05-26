# Bootstrap runbook

This runbook will become the path from an empty K3s install to a Flux-managed reference cluster.

The rough sequence is:

1. Provision the K3s node or nodes.
2. Confirm `kubectl` access to the new cluster.
3. Create or import the SOPS age key for Flux decryption.
4. Bootstrap Flux against this repository.
5. Reconcile `GitOps/clusters/reference/`.
6. Verify the platform controllers before adding demo workloads.

The exact commands depend on the hardware target and cluster access path. Those belong here once the cluster is chosen.
