# Benchmarks

This repository tracks performance in three distinct layers:

1. fast local iteration benches
2. reproducible competitor reports
3. package-overhead tracking for `react-class-variants` itself

All benchmark tooling lives under [`bench/`](../bench).

## Benchmark Commands

### `pnpm bench`

Runs the local Vitest microbench suites under [`bench/vitest/`](../bench/vitest).

Use this for:

- quick feedback while changing resolver behavior
- comparing hot paths locally
- checking React adapter changes

This command intentionally excludes the optional competitor diagnostics.

### `pnpm bench:diagnostics:competitors`

Runs the local, non-authoritative cross-library diagnostics under [`bench/vitest/diagnostics/`](../bench/vitest/diagnostics).

Use this for:

- local iteration while investigating a regression
- rough competitor sanity checks before regenerating reports

Do not treat this as the canonical comparison source.

### `pnpm bench:competitors`

Builds the package and regenerates the reproducible competitor reports:

- [`bench/competitors/reports/competitors.md`](../bench/competitors/reports/competitors.md)
- [`bench/competitors/reports/competitors.json`](../bench/competitors/reports/competitors.json)

This pipeline:

- runs with `NODE_ENV=production`
- isolates each runtime, creation, and retained-memory task in its own subprocess
- compares only common-denominator root-only scenarios across libraries

### `pnpm bench:overhead`

Measures package-specific overhead for `react-class-variants` and writes the output to:

- [`bench/overhead/reports/current.json`](../bench/overhead/reports/current.json)

This includes:

- bundle size
- runtime throughput
- retained memory
- synthetic TypeScript diagnostics

The overhead pipeline measures both the package root React surface and the `react-class-variants/core` entrypoint so recipe-only consumers are represented separately.

## Directory Layout

- [`bench/vitest/`](../bench/vitest): local microbench suites
- [`bench/vitest/diagnostics/`](../bench/vitest/diagnostics): optional local competitor diagnostics
- [`bench/competitors/`](../bench/competitors): reproducible competitor reports
- [`bench/overhead/`](../bench/overhead): package-overhead measurement and checks

## Competitor Matrix

`pnpm bench:competitors` currently compares against:

- `class-variance-authority`
- `classname-variants`
- `tailwind-variants`

The report uses two tracks:

### `resolver-only`

- raw root-only class resolution
- no built-in Tailwind merge work
- uses `tailwind-variants/lite` to keep the comparison on resolver cost

### `tailwind-aware`

- `react-class-variants + twMerge`
- `class-variance-authority + twMerge`
- `classname-variants + twMerge`
- full `tailwind-variants`

## Covered Scenarios

The competitor report covers:

- simple resolver calls with defaults
- simple resolver calls with explicit variants
- complex resolver calls with matching compounds
- complex resolver calls without compound matches
- resolver creation throughput for fresh unique configs
- diagnostic resolver creation throughput for reused config objects
- retained memory per created resolver instance
- synthetic consumer bundle size for root-only, Tailwind-aware, and React-component imports

All competitor comparisons use root-only recipes because that is the shared surface across all measured libraries.

Repository-specific paths such as:

- slot recipes
- slot render overrides
- `resolve()`
- React `styled()` composition
- `withRender`

are measured separately in the local benches and the package-overhead pipeline.

## Package-Overhead Profiles

The overhead report keeps named synthetic profiles instead of one aggregate number.

Bundle-oriented profiles include:

- `bundles.recipeOnly`
- `bundles.slottedRecipe`
- `bundles.tailwindAwareRecipe`
- `bundles.component`
- `bundles.componentWithRender`

TypeScript-oriented profiles include:

- `typescript.profiles.bundlerRootOnly`
- `typescript.profiles.bundlerReactSurface`
- `typescript.profiles.bundlerSlottedRecipe`
- `typescript.profiles.nodeNextReactSurface`

## How to Read the Reports

### Runtime tables

- compare relative ratios inside the same run
- prefer medians and stability metrics over one-off peak numbers
- use `RME` to judge whether a reported ratio is actually distinguishable from noise

### Creation throughput

Two creation modes are reported:

- `fresh unique config`: primary KPI and the closer proxy for real recipe creation cost
- `reused config`: diagnostic scenario that isolates repeated compilation of the same object identity

### Memory

Retained-memory comparisons use fresh unique config objects so shared object graphs do not understate per-instance cost.

### Bundles

Bundle-size comparisons use minified synthetic consumers via esbuild with:

- `format=esm`
- `platform=browser`
- `target=es2018`
- tree-shaking enabled
- `react` marked external

The JSON report keeps raw, gzip, and brotli bytes. The markdown report is optimized for human comparison.

## Notes and Caveats

- Retained-memory measurements require `node --expose-gc`; the package scripts already do this.
- Numbers depend on CPU, Node version, OS scheduling, and background load.
- Compare ratios within the same run, not absolute ops/sec between machines.
- Treat local diagnostics as exploratory. The canonical comparison story lives in `bench/competitors/`.
