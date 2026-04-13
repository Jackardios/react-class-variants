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

Generated at: 2026-04-13T16:52:41.377Z
Node: v22.17.0
Mode: production
Platform: darwin arm64

## Runtime

### Resolver only: complexExplicit

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   5,081,018.77 | 4.36% |                   1x |
| classname-variants       |   2,521,846.17 | 0.76% |                 0.5x |
| class-variance-authority |     720,879.57 | 1.94% |                0.14x |
| tailwind-variants/lite   |     543,990.01 | 0.46% |                0.11x |

### Resolver only: complexNoCompound

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   7,482,865.76 | 1.55% |                   1x |
| classname-variants       |   2,855,251.05 | 1.41% |                0.38x |
| class-variance-authority |     912,379.36 | 1.11% |                0.12x |
| tailwind-variants/lite   |     739,471.06 | 2.43% |                 0.1x |

### Resolver only: complexWithCompound

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   6,231,156.57 | 1.53% |                   1x |
| classname-variants       |   2,726,343.19 | 1.81% |                0.44x |
| class-variance-authority |     868,505.86 | 1.41% |                0.14x |
| tailwind-variants/lite   |     666,676.88 | 1.43% |                0.11x |

### Resolver only: simpleDefaults

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   14,597,654.5 | 2.64% |                   1x |
| class-variance-authority |   6,988,450.23 | 6.32% |                0.48x |
| classname-variants       |   5,787,413.55 |  2.6% |                 0.4x |
| tailwind-variants/lite   |   1,836,540.56 |  2.2% |                0.13x |

### Resolver only: simpleExplicit

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |  16,542,586.44 | 6.47% |                   1x |
| classname-variants       |   6,411,747.79 | 2.29% |                0.39x |
| class-variance-authority |   6,173,304.47 |  1.1% |                0.37x |
| tailwind-variants/lite   |   1,777,802.66 | 2.09% |                0.11x |

### Tailwind-aware: complexExplicit

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   2,005,138.51 | 1.51% |                   1x |
| classname-variants + twMerge       |   1,485,549.49 | 1.05% |                0.74x |
| class-variance-authority + twMerge |     601,013.58 | 0.81% |                 0.3x |
| tailwind-variants                  |     479,502.02 | 0.56% |                0.24x |

### Tailwind-aware: complexNoCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   3,653,046.27 | 7.47% |                   1x |
| classname-variants + twMerge       |   2,106,484.85 | 1.18% |                0.58x |
| class-variance-authority + twMerge |     782,174.34 | 1.58% |                0.21x |
| tailwind-variants                  |     652,056.33 | 15.3% |                0.18x |

### Tailwind-aware: complexWithCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   2,488,945.35 | 0.33% |                   1x |
| classname-variants + twMerge       |   1,697,117.14 | 1.19% |                0.68x |
| class-variance-authority + twMerge |     710,627.75 | 0.66% |                0.29x |
| tailwind-variants                  |     579,809.59 | 0.78% |                0.23x |

### Tailwind-aware: simpleDefaults

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |      5,588,804 | 1.22% |                   1x |
| class-variance-authority + twMerge |   4,121,694.32 | 1.53% |                0.74x |
| classname-variants + twMerge       |   3,753,779.77 | 4.49% |                0.67x |
| tailwind-variants                  |   1,415,221.16 | 2.34% |                0.25x |

### Tailwind-aware: simpleExplicit

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   5,865,773.18 | 1.22% |                   1x |
| class-variance-authority + twMerge |   3,736,973.84 | 0.42% |                0.64x |
| classname-variants + twMerge       |    3,625,732.9 |  7.9% |                0.62x |
| tailwind-variants                  |   1,437,268.67 | 1.96% |                0.25x |

### Resolver creation: plain (fresh unique complex config)

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| classname-variants       |  13,844,739.62 |  6.2% |                 9.8x |
| class-variance-authority |  12,645,338.25 | 14.5% |                8.95x |
| tailwind-variants/lite   |   7,869,296.48 | 0.45% |                5.57x |
| react-class-variants     |   1,412,238.81 | 0.79% |                   1x |

### Resolver creation: plain (diagnostic reused complex config)

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| class-variance-authority | 150,353,937.09 | 53.31% |               96.65x |
| classname-variants       |   79,022,624.5 | 69.05% |                50.8x |
| tailwind-variants/lite   |   12,614,450.7 |  0.99% |                8.11x |
| react-class-variants     |   1,555,674.32 |   2.7% |                   1x |

### Resolver creation: tailwind-aware (fresh unique complex config)

| Library                            | Median ops/sec |    RME | Relative to baseline |
| ---------------------------------- | -------------: | -----: | -------------------: |
| class-variance-authority + twMerge |  13,741,133.04 | 12.25% |                9.59x |
| classname-variants + twMerge       |  12,023,371.31 |  2.27% |                8.39x |
| tailwind-variants                  |   7,821,224.66 |  9.39% |                5.46x |
| react-class-variants + twMerge     |   1,432,278.21 |  4.95% |                   1x |

### Resolver creation: tailwind-aware (diagnostic reused complex config)

| Library                            | Median ops/sec |     RME | Relative to baseline |
| ---------------------------------- | -------------: | ------: | -------------------: |
| class-variance-authority + twMerge |  70,733,651.65 |  72.28% |               47.36x |
| classname-variants + twMerge       |  48,953,015.97 | 120.73% |               32.78x |
| tailwind-variants                  |  11,927,986.15 |   2.11% |                7.99x |
| react-class-variants + twMerge     |   1,493,587.16 |   2.95% |                   1x |

## Bundle Size

### Minimal synthetic consumer bundle size: plain recipe

| Minimal synthetic consumer |    gzip |      raw |  brotli | Relative gzip |
| -------------------------- | ------: | -------: | ------: | ------------: |
| classname-variants         |   511 B |    850 B |   451 B |         0.16x |
| class-variance-authority   |   707 B |  1,364 B |   633 B |         0.22x |
| tailwind-variants/lite     | 2,199 B |  5,225 B | 2,019 B |         0.69x |
| react-class-variants/core  | 3,186 B |  9,747 B | 2,895 B |            1x |
| react-class-variants       | 3,289 B | 10,062 B | 2,989 B |         1.03x |

### Minimal synthetic consumer bundle size: tailwind-aware recipe

| Minimal synthetic consumer          |     gzip |      raw |   brotli | Relative gzip |
| ----------------------------------- | -------: | -------: | -------: | ------------: |
| classname-variants + twMerge        |  8,630 B | 26,995 B |  7,546 B |         0.71x |
| class-variance-authority + twMerge  |  8,797 B | 27,517 B |  7,679 B |         0.72x |
| tailwind-variants                   | 10,660 B | 32,701 B |  9,341 B |         0.87x |
| react-class-variants/core + twMerge | 12,237 B | 41,122 B | 10,783 B |            1x |

### Minimal synthetic consumer bundle size: React/styled

| Minimal synthetic consumer |    gzip |      raw |  brotli | Relative gzip |
| -------------------------- | ------: | -------: | ------: | ------------: |
| classname-variants/react   |   828 B |  1,647 B |   744 B |         0.15x |
| react-class-variants       | 5,423 B | 17,681 B | 4,880 B |            1x |

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
| classname-variants       |              360.02 B | 0.22% |                0.42x |
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
| classname-variants + twMerge       |              456.02 B |  0.4% |                0.53x |
| tailwind-variants                  |              704.02 B | 0.21% |                0.81x |
| react-class-variants + twMerge     |              864.02 B | 0.27% |                   1x |
