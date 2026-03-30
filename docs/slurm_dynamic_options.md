# Dynamic Slurm Options Guide

This guide explains how other HPC centers can adapt OpenComposer's dynamic Slurm form options without hardcoding partition, GPU, CPU, or memory values into each app form.

## Goal

The dynamic Slurm discovery in OpenComposer is designed to make these form fields cluster-aware at runtime:

- `partition`
- `gpu_type`
- `gpus`
- `cores_memory`
- `time`

Instead of maintaining static values in each application's `form.yml`, the app can discover limits and choices from the Slurm cluster itself.

## Files Involved

- `partials/slurm_discovery.erb`
- `apps/GPU/form.yml.erb`
- `apps/CPU/form.yml.erb`
- `public/form.js`

## How It Works

### 1. Slurm-native commands are the canonical source

The discovery flow uses Slurm-native commands first:

- `sinfo -o "%P %l"` for partition names and partition time limits
- `scontrol show node --oneliner` for node membership, CPU counts, memory, GRES, state, and partition mapping

This keeps the feature portable across clusters that expose standard Slurm metadata.

### 2. Optional site-specific enrichment

If your site provides additional commands such as `sfeatures`, OpenComposer can use them as an optional enrichment layer.

The important rule is:

- Do not treat site-specific commands as the canonical source of partitions
- Use them only to fill in missing per-node details such as GPU count, feature labels, or model-specific metadata

This is the safest model if you want to upstream the feature later.

### 3. Partition mapping should come from Slurm node metadata

For portability, partitions should come from:

- `sinfo` for the user-visible partition list
- `Partitions=` in `scontrol show node --oneliner` for node-to-partition mapping

Avoid inferring partitions from feature tags unless your center has no better source and you are intentionally making a local-only customization.

## Data Model

The discovery partial effectively normalizes the cluster into this shape:

```text
partition -> gpu_type -> {
  max_cores,
  max_memory_mb,
  max_gpus
}
```

It also tracks:

- per-partition time limits
- per-partition GPU choices
- unavailable GPU types
- Slurm script substitutions for GRES and optional constraints

## What Other Centers May Need To Customize

Most centers should only need to review `partials/slurm_discovery.erb`.

### GPU labels

The file contains a small label map for common GPU types so the UI can show friendlier names. If your cluster has other GPU names, you can extend the label map.

Examples:

- `mi250`
- `a30`
- `a40`
- `gh200`

If a GPU type is not in the map, OpenComposer falls back to the raw Slurm GPU name.

### Feature-derived variants

Some centers expose useful variants through features instead of distinct GRES names.

Examples:

- `a100-40G`
- `a100-80G`
- MIG profiles
- vendor-specific feature tags

If you want separate UI choices for those variants, add a small translation layer in the discovery partial that maps site features to:

- a UI GPU identifier
- a Slurm GRES name
- an optional Slurm constraint line

Keep this mapping isolated so it is easy to maintain or disable.

### Optional enrichment commands

If your cluster exposes additional metadata through custom commands, prefer this pattern:

1. Read the custom command output.
2. Expand node lists into individual node names if needed.
3. Join the data back onto the canonical `scontrol` node records by node name.
4. Use the custom data only when the Slurm-native fields are missing or incomplete.

This approach keeps the implementation portable while still letting centers improve the UX locally.

## Recommended Adaptation Workflow

1. Start with `sinfo` and `scontrol show node --oneliner` only.
2. Verify that partitions, CPU counts, memory, GPU names, GPU counts, and time limits render correctly.
3. Add site-specific enrichment only if some required field is missing or unreliable.
4. Keep site-specific logic localized to helper methods in `partials/slurm_discovery.erb`.
5. Avoid editing the app forms unless you are adding new dynamic fields.

## GPU Script Rendering

The GPU form uses two values for script generation:

- `gpu_type_1`: the Slurm GRES fragment
- `gpu_type_2`: an optional full `#SBATCH --constraint=...` line

This is intentional. It avoids generating an invalid empty constraint line when a GPU type does not require one.

## Testing Checklist For New Centers

When adapting the feature to another cluster, test at least these cases:

- CPU-only partition
- GPU partition with one GPU type
- GPU partition with multiple GPU types
- partition with mixed node sizes
- partition with different GPU counts per node
- A100 40GB and 80GB, if applicable
- drained or unavailable GPU nodes
- job script preview for `any` GPU and typed GPU requests

Also verify that the generated script is accepted by `sbatch`.

## Upstream-Friendly Guidelines

If you intend to contribute your changes back to the original RIKEN repository, these rules help keep the patch portable:

- Prefer Slurm-native commands over center-specific tools
- Keep site-specific logic optional
- Avoid hardcoded partition names
- Avoid hardcoded assumptions about one center's feature taxonomy
- Keep custom parsing in small helper methods
- Make fallback behavior safe when discovery fails

## If Discovery Fails

OpenComposer should still remain usable even if dynamic discovery fails.

Recommended behavior:

- fall back to static partition options
- fall back to static GPU choices
- avoid breaking form rendering
- avoid generating invalid Slurm script lines

That way centers can adopt the feature incrementally.
