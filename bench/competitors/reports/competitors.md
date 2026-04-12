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

Generated at: 2026-04-12T22:08:54.381Z
Node: v22.17.0
Mode: production
Platform: darwin arm64

## Runtime

### Resolver only: complexExplicit

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |    4,656,086.5 | 1.37% |                   1x |
| classname-variants       |   2,462,338.86 | 1.04% |                0.53x |
| class-variance-authority |     705,785.68 | 0.72% |                0.15x |
| tailwind-variants/lite   |     533,161.88 | 0.94% |                0.11x |

### Resolver only: complexNoCompound

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| react-class-variants     |    6,305,021.7 |  1.38% |                   1x |
| classname-variants       |   2,846,426.91 | 13.99% |                0.45x |
| class-variance-authority |     875,783.53 |  0.69% |                0.14x |
| tailwind-variants/lite   |     754,751.32 |  8.07% |                0.12x |

### Resolver only: complexWithCompound

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   4,758,366.04 | 0.66% |                   1x |
| classname-variants       |   2,646,795.93 | 0.18% |                0.56x |
| class-variance-authority |     808,898.35 | 0.81% |                0.17x |
| tailwind-variants/lite   |     647,103.52 | 0.24% |                0.14x |

### Resolver only: simpleDefaults

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |  12,347,403.18 | 4.15% |                   1x |
| class-variance-authority |   7,126,865.66 | 3.69% |                0.58x |
| classname-variants       |   5,530,971.42 | 1.41% |                0.45x |
| tailwind-variants/lite   |   1,733,299.75 | 1.68% |                0.14x |

### Resolver only: simpleExplicit

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |  14,403,253.45 | 2.48% |                   1x |
| classname-variants       |    6,037,648.8 | 1.27% |                0.42x |
| class-variance-authority |   5,928,409.13 | 3.43% |                0.41x |
| tailwind-variants/lite   |   1,636,566.85 | 1.47% |                0.11x |

### Tailwind-aware: complexExplicit

| Library                            | Median ops/sec |    RME | Relative to baseline |
| ---------------------------------- | -------------: | -----: | -------------------: |
| react-class-variants + twMerge     |   1,876,253.03 |  0.84% |                   1x |
| classname-variants + twMerge       |     793,132.45 | 26.47% |                0.42x |
| class-variance-authority + twMerge |     559,567.45 |  1.22% |                 0.3x |
| tailwind-variants                  |     460,055.42 |     1% |                0.25x |

### Tailwind-aware: complexNoCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   3,320,810.16 | 3.53% |                   1x |
| classname-variants + twMerge       |   2,052,454.96 | 2.07% |                0.62x |
| class-variance-authority + twMerge |     767,115.65 |  0.9% |                0.23x |
| tailwind-variants                  |     679,910.46 | 6.46% |                 0.2x |

### Tailwind-aware: complexWithCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   1,817,297.63 | 6.03% |                   1x |
| classname-variants + twMerge       |   1,345,457.13 | 6.66% |                0.74x |
| class-variance-authority + twMerge |     557,279.54 |  6.3% |                0.31x |
| tailwind-variants                  |     503,678.23 | 5.08% |                0.28x |

### Tailwind-aware: simpleDefaults

| Library                            | Median ops/sec |    RME | Relative to baseline |
| ---------------------------------- | -------------: | -----: | -------------------: |
| react-class-variants + twMerge     |   5,111,571.14 |  2.74% |                   1x |
| class-variance-authority + twMerge |   3,982,936.27 |  3.86% |                0.78x |
| classname-variants + twMerge       |   3,343,299.93 |   4.2% |                0.65x |
| tailwind-variants                  |   1,231,254.07 | 14.02% |                0.24x |

### Tailwind-aware: simpleExplicit

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   5,317,939.74 | 7.84% |                   1x |
| class-variance-authority + twMerge |   3,545,404.95 | 0.79% |                0.67x |
| classname-variants + twMerge       |      3,543,876 |  3.9% |                0.67x |
| tailwind-variants                  |   1,282,620.99 | 14.1% |                0.24x |

### Resolver creation: plain (fresh unique complex config)

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| class-variance-authority |  14,073,215.78 | 7.86% |                13.3x |
| classname-variants       |  12,262,960.97 | 4.86% |               11.59x |
| tailwind-variants/lite   |   6,990,279.06 | 2.37% |                6.61x |
| react-class-variants     |   1,057,806.07 |  3.2% |                   1x |

### Resolver creation: plain (diagnostic reused complex config)

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| class-variance-authority | 147,605,768.73 |  53.2% |              127.84x |
| classname-variants       |  72,647,263.67 | 72.05% |               62.92x |
| tailwind-variants/lite   |  11,672,055.21 |  4.17% |               10.11x |
| react-class-variants     |   1,154,639.49 |  1.44% |                   1x |

### Resolver creation: tailwind-aware (fresh unique complex config)

| Library                            | Median ops/sec |    RME | Relative to baseline |
| ---------------------------------- | -------------: | -----: | -------------------: |
| class-variance-authority + twMerge |  13,721,825.22 | 11.16% |               12.91x |
| classname-variants + twMerge       |  11,958,194.59 |  3.39% |               11.25x |
| tailwind-variants                  |   7,353,985.74 |  3.38% |                6.92x |
| react-class-variants + twMerge     |   1,062,629.44 |  1.18% |                   1x |

### Resolver creation: tailwind-aware (diagnostic reused complex config)

| Library                            | Median ops/sec |     RME | Relative to baseline |
| ---------------------------------- | -------------: | ------: | -------------------: |
| class-variance-authority + twMerge |  75,359,682.05 |  70.37% |               66.05x |
| classname-variants + twMerge       |  51,889,230.28 | 115.56% |               45.48x |
| tailwind-variants                  |  11,839,088.39 |   3.39% |               10.38x |
| react-class-variants + twMerge     |   1,140,881.32 |   0.55% |                   1x |

## Bundle Size

### Minimal synthetic consumer bundle size: plain recipe

| Minimal synthetic consumer |    gzip |      raw |  brotli | Relative gzip |
| -------------------------- | ------: | -------: | ------: | ------------: |
| classname-variants         |   511 B |    850 B |   451 B |         0.14x |
| class-variance-authority   |   707 B |  1,364 B |   633 B |          0.2x |
| tailwind-variants/lite     | 2,199 B |  5,225 B | 2,019 B |         0.61x |
| react-class-variants/core  | 3,581 B | 10,909 B | 3,246 B |            1x |
| react-class-variants       | 3,648 B | 11,078 B | 3,302 B |         1.02x |

### Minimal synthetic consumer bundle size: tailwind-aware recipe

| Minimal synthetic consumer          |     gzip |      raw |   brotli | Relative gzip |
| ----------------------------------- | -------: | -------: | -------: | ------------: |
| classname-variants + twMerge        |  8,630 B | 26,995 B |  7,546 B |         0.74x |
| class-variance-authority + twMerge  |  8,797 B | 27,517 B |  7,679 B |         0.75x |
| tailwind-variants                   | 10,660 B | 32,701 B |  9,341 B |         0.91x |
| react-class-variants/core + twMerge | 11,666 B | 37,228 B | 10,298 B |            1x |

### Minimal synthetic consumer bundle size: React/styled

| Minimal synthetic consumer |    gzip |      raw |  brotli | Relative gzip |
| -------------------------- | ------: | -------: | ------: | ------------: |
| classname-variants/react   |   828 B |  1,647 B |   744 B |         0.17x |
| react-class-variants       | 4,835 B | 14,980 B | 4,375 B |            1x |

## Retained Memory

### Resolver instances: plain freshComplexConfig

| Library                  | Median bytes/instance |   RME | Relative to baseline |
| ------------------------ | --------------------: | ----: | -------------------: |
| class-variance-authority |              728.02 B | 0.15% |                0.29x |
| classname-variants       |              888.02 B | 0.13% |                0.35x |
| tailwind-variants/lite   |            1,088.02 B | 0.16% |                0.43x |
| react-class-variants     |            2,504.02 B | 0.18% |                   1x |

### Resolver instances: plain freshSimpleConfig

| Library                  | Median bytes/instance |   RME | Relative to baseline |
| ------------------------ | --------------------: | ----: | -------------------: |
| class-variance-authority |              320.02 B | 0.26% |                0.43x |
| classname-variants       |              360.02 B | 0.24% |                0.48x |
| tailwind-variants/lite   |              704.02 B | 0.22% |                0.95x |
| react-class-variants     |              744.02 B | 0.39% |                   1x |

### Resolver instances: tailwind-aware freshComplexConfig

| Library                            | Median bytes/instance |   RME | Relative to baseline |
| ---------------------------------- | --------------------: | ----: | -------------------: |
| class-variance-authority + twMerge |              824.02 B | 0.13% |                0.33x |
| classname-variants + twMerge       |              984.02 B | 0.12% |                0.39x |
| tailwind-variants                  |            1,088.02 B | 0.16% |                0.43x |
| react-class-variants + twMerge     |            2,504.02 B | 0.18% |                   1x |

### Resolver instances: tailwind-aware freshSimpleConfig

| Library                            | Median bytes/instance |   RME | Relative to baseline |
| ---------------------------------- | --------------------: | ----: | -------------------: |
| class-variance-authority + twMerge |              416.02 B | 0.44% |                0.56x |
| classname-variants + twMerge       |              456.02 B | 0.19% |                0.61x |
| tailwind-variants                  |              704.02 B | 0.22% |                0.95x |
| react-class-variants + twMerge     |              744.02 B | 0.39% |                   1x |
