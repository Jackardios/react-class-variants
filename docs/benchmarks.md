# Benchmarks

This repository tracks performance in three layers:

1. `pnpm bench`
   - Vitest microbenchmarks in [`bench/`](../bench)
   - fast local iteration for resolver, component, and creation hot paths
2. `pnpm bench:competitors`
   - builds the package
   - runs reproducible runtime, retained-memory, and synthetic bundle-size comparisons
   - writes reports to [`bench/reports/competitors.md`](../bench/reports/competitors.md) and [`bench/reports/competitors.json`](../bench/reports/competitors.json)
   - runs with `NODE_ENV=production`
3. `pnpm bench:overhead`
   - measures bundle size, retained memory, runtime throughput, and synthetic TypeScript diagnostics for `react-class-variants` itself
   - writes to [`bench/overhead/reports/current.json`](../bench/overhead/reports/current.json)
   - uses the dedicated `react-class-variants/core` and `react-class-variants/react` entrypoints when present, so recipe-only bundle measurements do not include React runtime code

## Competitor matrix

`pnpm bench:competitors` compares `react-class-variants` against:

- `class-variance-authority`
- `classname-variants`
- `tailwind-variants`

It uses two common-denominator tracks:

- `resolver-only`
  - root-only class resolver calls without Tailwind merge work
  - uses `tailwind-variants/lite` to isolate raw resolver cost from built-in merge behavior
- `tailwind-aware`
  - `react-class-variants + twMerge`
  - `class-variance-authority + twMerge`
  - `classname-variants + twMerge`
  - full `tailwind-variants`

## Scenarios

The competitor report covers:

- simple resolver calls with defaults
- simple resolver calls with explicit variants
- complex resolver calls with matching compounds
- complex resolver calls without compound matches
- complex resolver calls with the full prop bag
- resolver creation throughput for fresh unique complex configs
- diagnostic resolver creation throughput for reused complex config objects
- retained memory per created resolver instance for simple and complex configs
- synthetic consumer bundle size for plain recipe imports, Tailwind-aware recipe imports, and React/styled imports

All competitor comparisons use root-only recipes because that is the shared API surface across all libraries.
Slotted behavior, `resolve()`, and React composition paths are benchmarked separately inside the repository's own Vitest benches and overhead tooling.

Creation is reported in two modes:

- `fresh unique config`
  - a new complex config object graph is created on every iteration
  - primary creation KPI and closer proxy for first-time compile cost
- `reused config`
  - the same complex config object identity is passed on every iteration
  - diagnostic-only scenario for same-object config reuse versus fresh config
    object setup cost

Retained-memory comparisons also use fresh unique config objects so per-instance
bytes are not understated by shared config graphs.

Bundle-size comparisons are reported separately from runtime because Tailwind
merge support changes the dependency graph substantially. They use esbuild with
`format=esm`, `platform=browser`, `target=es2018`, `minify`, tree-shaking, and
`react` marked external. The generated JSON keeps raw, gzip, and brotli bytes;
the generated markdown sorts and compares by gzip bytes.

## Notes

- Retained-memory measurements require `node --expose-gc`; the package script handles this automatically.
- The generated markdown report is meant for humans. The JSON report is meant for CI diffing or custom visualization.
- Benchmark numbers depend on CPU, Node version, and background load. Compare relative ratios within the same run, not absolute ops/sec across different machines.
