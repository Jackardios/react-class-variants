# Competitive Benchmarks

This report compares `react-class-variants` against `class-variance-authority`, `classname-variants`, and `tailwind-variants` on root-only common-denominator scenarios.

- All numbers are collected with `NODE_ENV=production`.
- `resolver-only` uses plain resolvers; `tailwind-variants/lite` is used there to isolate raw resolver cost from built-in merge work.
- `tailwind-aware` compares `react-class-variants + twMerge`, wrapper-based `twMerge` integrations for CVA / classname-variants, and full `tailwind-variants`.
- Primary creation throughput uses `fresh unique complex config` so it reflects first-time compile cost.
- `reused complex config` remains as a diagnostic appendix for same-object config reuse versus fresh config object setup cost.
- Memory numbers are median retained bytes per created resolver instance across repeated forced-GC samples with fresh unique config objects.
- Bundle size numbers are minimal synthetic consumer bundles built with esbuild, with explicit production defines and React marked external when relevant.
- Ratios near `1.0x` should be interpreted together with `RME`; near-parity results are not strong claims without stability headroom.

Generated at: 2026-04-13T21:50:35.284Z
Node: v22.17.0
Mode: production
Platform: darwin arm64

## Runtime

### Resolver only: complexExplicit

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   5,420,715.07 | 3.07% |                   1x |
| classname-variants       |   2,628,048.71 | 5.52% |                0.48x |
| class-variance-authority |     764,823.32 | 0.77% |                0.14x |
| tailwind-variants/lite   |     485,315.04 | 3.32% |                0.09x |

### Resolver only: complexNoCompound

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| react-class-variants     |   7,024,862.53 | 10.26% |                   1x |
| classname-variants       |   2,679,566.28 |  1.56% |                0.38x |
| class-variance-authority |     821,604.81 |  0.86% |                0.12x |
| tailwind-variants/lite   |      720,516.9 |  4.97% |                 0.1x |

### Resolver only: complexWithCompound

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| react-class-variants     |    5,320,592.5 | 17.15% |                   1x |
| classname-variants       |   2,454,359.06 |  4.55% |                0.46x |
| class-variance-authority |     772,155.09 | 17.19% |                0.15x |
| tailwind-variants/lite   |     602,283.46 |  1.65% |                0.11x |

### Resolver only: simpleDefaults

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |  14,929,417.75 | 1.33% |                   1x |
| class-variance-authority |   7,903,931.49 | 2.45% |                0.53x |
| classname-variants       |   6,086,829.57 | 3.99% |                0.41x |
| tailwind-variants/lite   |   1,872,967.84 | 1.53% |                0.13x |

### Resolver only: simpleExplicit

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |  16,463,511.56 | 1.67% |                   1x |
| classname-variants       |   6,639,961.25 | 3.42% |                 0.4x |
| class-variance-authority |   6,250,133.33 | 4.66% |                0.38x |
| tailwind-variants/lite   |   1,686,939.27 | 9.12% |                 0.1x |

### Tailwind-aware: complexExplicit

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   2,014,122.05 | 1.78% |                   1x |
| classname-variants + twMerge       |   1,498,107.12 | 0.69% |                0.74x |
| class-variance-authority + twMerge |     583,298.43 | 2.74% |                0.29x |
| tailwind-variants                  |     487,176.21 | 1.21% |                0.24x |

### Tailwind-aware: complexNoCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   3,737,628.73 | 1.14% |                   1x |
| classname-variants + twMerge       |   2,204,087.87 | 0.99% |                0.59x |
| class-variance-authority + twMerge |     788,958.19 | 3.53% |                0.21x |
| tailwind-variants                  |     724,992.68 | 2.43% |                0.19x |

### Tailwind-aware: complexWithCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   2,517,177.53 | 1.43% |                   1x |
| classname-variants + twMerge       |    1,738,410.6 | 1.25% |                0.69x |
| class-variance-authority + twMerge |     713,456.82 | 1.64% |                0.28x |
| tailwind-variants                  |     587,217.96 | 4.49% |                0.23x |

### Tailwind-aware: simpleDefaults

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   5,607,480.39 | 1.86% |                   1x |
| class-variance-authority + twMerge |    4,233,223.9 | 1.84% |                0.75x |
| classname-variants + twMerge       |   3,924,332.86 | 4.17% |                 0.7x |
| tailwind-variants                  |   1,520,444.02 | 1.27% |                0.27x |

### Tailwind-aware: simpleExplicit

| Library                            | Median ops/sec |    RME | Relative to baseline |
| ---------------------------------- | -------------: | -----: | -------------------: |
| react-class-variants + twMerge     |    5,830,360.6 |   0.7% |                   1x |
| classname-variants + twMerge       |   4,077,550.12 |  2.43% |                 0.7x |
| class-variance-authority + twMerge |   3,618,145.51 |  1.43% |                0.62x |
| tailwind-variants                  |   1,462,126.87 | 13.22% |                0.25x |

### Resolver creation: plain (fresh unique complex config)

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| class-variance-authority |  14,900,752.45 |  9.1% |               10.22x |
| classname-variants       |  13,921,383.82 |  6.1% |                9.55x |
| tailwind-variants/lite   |   8,048,367.34 | 3.37% |                5.52x |
| react-class-variants     |   1,457,943.77 | 1.28% |                   1x |

### Resolver creation: plain (diagnostic reused complex config)

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| class-variance-authority | 156,818,248.97 | 51.56% |               99.46x |
| classname-variants       | 106,597,184.13 | 62.48% |               67.61x |
| tailwind-variants/lite   |  12,675,845.49 |  0.87% |                8.04x |
| react-class-variants     |   1,576,647.91 |   1.3% |                   1x |

### Resolver creation: tailwind-aware (fresh unique complex config)

| Library                            | Median ops/sec |    RME | Relative to baseline |
| ---------------------------------- | -------------: | -----: | -------------------: |
| classname-variants + twMerge       |  10,899,457.37 | 14.44% |                9.92x |
| class-variance-authority + twMerge |   8,647,415.18 | 30.29% |                7.87x |
| tailwind-variants                  |   8,012,368.83 |  1.13% |                7.29x |
| react-class-variants + twMerge     |   1,098,679.66 | 21.22% |                   1x |

### Resolver creation: tailwind-aware (diagnostic reused complex config)

| Library                            | Median ops/sec |    RME | Relative to baseline |
| ---------------------------------- | -------------: | -----: | -------------------: |
| class-variance-authority + twMerge |  74,162,466.43 | 69.35% |               49.46x |
| classname-variants + twMerge       |  50,965,871.76 | 114.6% |               33.99x |
| tailwind-variants                  |  11,848,558.43 |  7.01% |                 7.9x |
| react-class-variants + twMerge     |    1,499,299.7 |  6.09% |                   1x |

## Bundle Size

### Minimal synthetic consumer bundle size: plain recipe

| Minimal synthetic consumer |    gzip |      raw |  brotli | Relative gzip |
| -------------------------- | ------: | -------: | ------: | ------------: |
| classname-variants         |   511 B |    850 B |   451 B |         0.16x |
| class-variance-authority   |   707 B |  1,364 B |   633 B |         0.22x |
| tailwind-variants/lite     | 2,199 B |  5,225 B | 2,019 B |         0.69x |
| react-class-variants/core  | 3,187 B |  9,745 B | 2,890 B |            1x |
| react-class-variants       | 3,286 B | 10,060 B | 2,985 B |         1.03x |

### Minimal synthetic consumer bundle size: tailwind-aware recipe

| Minimal synthetic consumer          |     gzip |      raw |   brotli | Relative gzip |
| ----------------------------------- | -------: | -------: | -------: | ------------: |
| classname-variants + twMerge        |  8,630 B | 26,995 B |  7,546 B |          0.7x |
| class-variance-authority + twMerge  |  8,797 B | 27,517 B |  7,679 B |         0.72x |
| tailwind-variants                   | 10,660 B | 32,701 B |  9,341 B |         0.87x |
| react-class-variants/core + twMerge | 12,247 B | 41,173 B | 10,748 B |            1x |

### Minimal synthetic consumer bundle size: React/styled

| Minimal synthetic consumer |    gzip |      raw |  brotli | Relative gzip |
| -------------------------- | ------: | -------: | ------: | ------------: |
| classname-variants/react   |   828 B |  1,647 B |   744 B |         0.15x |
| react-class-variants       | 5,452 B | 17,779 B | 4,912 B |            1x |

## Retained Memory

### Resolver instances: plain freshComplexConfig

| Library                  | Median bytes/instance |   RME | Relative to baseline |
| ------------------------ | --------------------: | ----: | -------------------: |
| class-variance-authority |              728.02 B | 0.14% |                0.47x |
| classname-variants       |              888.02 B | 0.12% |                0.57x |
| tailwind-variants/lite   |            1,088.02 B | 0.16% |                 0.7x |
| react-class-variants     |            1,552.02 B | 0.23% |                   1x |

### Resolver instances: plain freshSimpleConfig

| Library                  | Median bytes/instance |   RME | Relative to baseline |
| ------------------------ | --------------------: | ----: | -------------------: |
| class-variance-authority |              320.02 B | 0.25% |                0.37x |
| classname-variants       |              360.02 B | 0.49% |                0.42x |
| tailwind-variants/lite   |              704.02 B | 0.21% |                0.81x |
| react-class-variants     |              864.02 B | 0.28% |                   1x |

### Resolver instances: tailwind-aware freshComplexConfig

| Library                            | Median bytes/instance |   RME | Relative to baseline |
| ---------------------------------- | --------------------: | ----: | -------------------: |
| class-variance-authority + twMerge |              824.02 B | 0.13% |                0.53x |
| classname-variants + twMerge       |              984.02 B | 0.11% |                0.63x |
| tailwind-variants                  |            1,088.02 B | 0.16% |                 0.7x |
| react-class-variants + twMerge     |            1,552.02 B | 0.23% |                   1x |

### Resolver instances: tailwind-aware freshSimpleConfig

| Library                            | Median bytes/instance |   RME | Relative to baseline |
| ---------------------------------- | --------------------: | ----: | -------------------: |
| class-variance-authority + twMerge |              416.02 B | 0.43% |                0.48x |
| classname-variants + twMerge       |              456.02 B | 0.18% |                0.53x |
| tailwind-variants                  |              704.02 B | 0.21% |                0.81x |
| react-class-variants + twMerge     |              864.02 B | 0.28% |                   1x |
