# Live Baseline

Captured on 2026-05-26 before making reference cluster or repository changes.

## Reference Cluster

- VM: `k8s-reference-01`
- VM host: `gaia`
- VM IP: `192.168.122.50`
- Kubernetes distribution: K3s
- K3s version: `v1.34.3+k3s1`
- Kubernetes node: `reference-01`
- Node status: `Ready`
- Node roles: `control-plane,etcd`
- OS image: Ubuntu 24.04.4 LTS
- Container runtime: `containerd://2.1.5-k3s1`

## Access Path

- Local kubeconfig context: `k8s-platform-reference`
- API access path: local tunnel from `127.0.0.1:16443` through `gaia` to `192.168.122.50:6443`
- VM access path: SSH to `gaia`, then libvirt management of `k8s-reference-01`

## Current Workloads

All observed pods are in `kube-system` and running on `reference-01`:

- `coredns-7f496c8d7d-wfkw9`
- `local-path-provisioner-578895bd58-vrb6m`
- `metrics-server-7b9c9c4b9c-8k4q7`

## Repository State

- Worktree: `/Users/s34nj0hn/k8s-platform-reference/.worktrees/reference-cluster-implementation`
- Branch: `reference-cluster-implementation`
- Baseline dirty state before creating this document: clean (`git status --short --branch` returned only `## reference-cluster-implementation`)
- The README rewrite in the original checkout is intentionally uncommitted and is not part of this worktree baseline change.

## Host Baseline

- `k8s-reference-01` exists on `gaia` under libvirt.
- The VM is running.
- The libvirt default network DHCP lease resolves `k8s-reference-01` to `192.168.122.50/24`.
