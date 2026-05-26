# Bootstrap runbook

This runbook describes the v1 access path for the reference cluster: a single-node K3s cluster running inside a libvirt VM on Gaia.

## Current target

| Item | Value |
| --- | --- |
| VM | `k8s-reference-01` |
| VM platform | KVM/libvirt |
| Cluster type | Single-node K3s |
| VM address | `192.168.122.50` |
| K3s API | `192.168.122.50:6443` |
| Local API endpoint | `127.0.0.1:16443` |

The local kubeconfig context is expected to reach the API through an SSH tunnel from the workstation to Gaia, then from Gaia to the VM on the libvirt network.

## Open the local API tunnel

Run this before using the local `k8s-platform-reference` kubeconfig context:

```sh
ssh -fN -L 16443:192.168.122.50:6443 gaia
```

This maps `127.0.0.1:16443` on the workstation to `192.168.122.50:6443` through Gaia.

## Verify access

Confirm the API is reachable and the cluster is responding:

```sh
kubectl --context k8s-platform-reference get nodes
kubectl --context k8s-platform-reference get pods -A
```

Expected result: one K3s node is visible, and system pods are listed across namespaces without authentication or connection errors.

## Bootstrap sequence

Once API access is verified, the working sequence is:

1. Provision or rebuild the `k8s-reference-01` VM.
2. Install or verify single-node K3s on the VM.
3. Open the local API tunnel.
4. Confirm `kubectl` access to the cluster.
5. Create or import the SOPS age key for Flux decryption.
6. Bootstrap Flux against this repository.
7. Reconcile `GitOps/clusters/reference/`.
8. Verify the platform controllers before adding demo workloads.
