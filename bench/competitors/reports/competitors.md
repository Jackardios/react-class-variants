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

Generated at: 2026-05-01T09:20:14.987Z
Node: v22.17.0
Mode: production
Platform: darwin arm64

## Runtime

### Resolver only: complexExplicit

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   5,624,452.23 | 3.16% |                   1x |
| classname-variants       |   2,617,787.96 |    2% |                0.47x |
| class-variance-authority |      776,784.2 |  1.8% |                0.14x |
| tailwind-variants/lite   |        574,657 | 1.19% |                 0.1x |

### Resolver only: complexNoCompound

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   7,990,766.69 | 0.59% |                   1x |
| classname-variants       |    3,092,525.8 | 1.75% |                0.39x |
| class-variance-authority |     937,701.86 | 1.63% |                0.12x |
| tailwind-variants/lite   |     816,578.63 | 3.67% |                 0.1x |

### Resolver only: complexWithCompound

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   6,007,608.99 | 0.86% |                   1x |
| classname-variants       |   2,817,461.94 | 2.39% |                0.47x |
| class-variance-authority |     888,138.91 | 0.95% |                0.15x |
| tailwind-variants/lite   |     683,750.32 | 0.76% |                0.11x |

### Resolver only: simpleDefaults

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| react-class-variants     |  14,978,745.36 |  5.25% |                   1x |
| class-variance-authority |   6,578,833.32 | 19.13% |                0.44x |
| classname-variants       |    5,979,616.3 |  0.58% |                 0.4x |
| tailwind-variants/lite   |   1,824,740.27 |  1.09% |                0.12x |

### Resolver only: simpleExplicit

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |  16,273,750.43 | 1.26% |                   1x |
| classname-variants       |   6,356,361.19 | 1.34% |                0.39x |
| class-variance-authority |   6,047,577.69 | 0.14% |                0.37x |
| tailwind-variants/lite   |   1,730,554.67 |  1.6% |                0.11x |

### Tailwind-aware: complexExplicit

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   1,961,844.03 | 0.24% |                   1x |
| classname-variants + twMerge       |   1,447,955.36 | 0.21% |                0.74x |
| class-variance-authority + twMerge |     584,704.01 | 0.17% |                 0.3x |
| tailwind-variants                  |     476,696.32 | 0.79% |                0.24x |

### Tailwind-aware: complexNoCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   3,625,934.07 | 0.73% |                   1x |
| classname-variants + twMerge       |   2,159,810.65 | 0.15% |                 0.6x |
| class-variance-authority + twMerge |     765,536.33 | 0.69% |                0.21x |
| tailwind-variants                  |     689,922.15 | 0.97% |                0.19x |

### Tailwind-aware: complexWithCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   2,444,702.56 | 1.03% |                   1x |
| classname-variants + twMerge       |    1,659,074.9 | 1.09% |                0.68x |
| class-variance-authority + twMerge |     700,672.48 | 0.37% |                0.29x |
| tailwind-variants                  |     573,120.01 | 0.91% |                0.23x |

### Tailwind-aware: simpleDefaults

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |    5,492,519.4 | 0.28% |                   1x |
| class-variance-authority + twMerge |    3,967,158.3 | 2.38% |                0.72x |
| classname-variants + twMerge       |   3,777,748.16 | 3.43% |                0.69x |
| tailwind-variants                  |   1,458,697.81 | 0.47% |                0.27x |

### Tailwind-aware: simpleExplicit

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   5,681,589.04 | 4.49% |                   1x |
| classname-variants + twMerge       |   3,988,686.89 | 0.66% |                 0.7x |
| class-variance-authority + twMerge |   3,690,905.26 | 0.86% |                0.65x |
| tailwind-variants                  |    1,399,965.7 | 0.39% |                0.25x |

### Resolver creation: plain (fresh unique complex config)

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| class-variance-authority |  14,460,333.87 | 9.02% |               10.64x |
| classname-variants       |  12,252,524.76 | 5.58% |                9.02x |
| tailwind-variants/lite   |   7,643,874.42 | 0.97% |                5.62x |
| react-class-variants     |   1,359,027.99 | 0.38% |                   1x |

### Resolver creation: plain (diagnostic reused complex config)

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| class-variance-authority | 203,379,898.31 | 43.71% |              137.23x |
| classname-variants       |  77,015,757.66 | 69.62% |               51.96x |
| tailwind-variants/lite   |  14,663,606.67 |  1.09% |                9.89x |
| react-class-variants     |    1,482,089.1 |  1.24% |                   1x |

### Resolver creation: tailwind-aware (fresh unique complex config)

| Library                            | Median ops/sec |    RME | Relative to baseline |
| ---------------------------------- | -------------: | -----: | -------------------: |
| class-variance-authority + twMerge |  13,536,703.87 | 11.86% |               10.09x |
| classname-variants + twMerge       |  11,917,926.21 |  1.54% |                8.88x |
| tailwind-variants                  |   7,617,347.87 |  0.97% |                5.68x |
| react-class-variants + twMerge     |   1,341,355.44 |  0.14% |                   1x |

### Resolver creation: tailwind-aware (diagnostic reused complex config)

| Library                            | Median ops/sec |     RME | Relative to baseline |
| ---------------------------------- | -------------: | ------: | -------------------: |
| class-variance-authority + twMerge |  73,497,684.82 |  70.63% |               50.26x |
| classname-variants + twMerge       |  50,632,514.79 | 116.23% |               34.62x |
| tailwind-variants                  |  12,372,257.05 |   6.35% |                8.46x |
| react-class-variants + twMerge     |   1,462,492.66 |   1.56% |                   1x |

## Bundle Size

### Minimal synthetic consumer bundle size: plain recipe

| Minimal synthetic consumer |    gzip |      raw |  brotli | Relative gzip |
| -------------------------- | ------: | -------: | ------: | ------------: |
| classname-variants         |   511 B |    850 B |   451 B |         0.15x |
| class-variance-authority   |   707 B |  1,364 B |   633 B |         0.21x |
| tailwind-variants/lite     | 2,199 B |  5,225 B | 2,019 B |         0.67x |
| react-class-variants/core  | 3,302 B | 10,121 B | 3,000 B |            1x |
| react-class-variants       | 3,410 B | 10,487 B | 3,106 B |         1.03x |

### Minimal synthetic consumer bundle size: tailwind-aware recipe

| Minimal synthetic consumer          |     gzip |      raw |   brotli | Relative gzip |
| ----------------------------------- | -------: | -------: | -------: | ------------: |
| classname-variants + twMerge        |  8,630 B | 26,995 B |  7,546 B |          0.7x |
| class-variance-authority + twMerge  |  8,797 B | 27,517 B |  7,679 B |         0.71x |
| tailwind-variants                   | 10,660 B | 32,701 B |  9,341 B |         0.86x |
| react-class-variants/core + twMerge | 12,396 B | 41,683 B | 10,911 B |            1x |

### Minimal synthetic consumer bundle size: React/styled

| Minimal synthetic consumer |    gzip |      raw |  brotli | Relative gzip |
| -------------------------- | ------: | -------: | ------: | ------------: |
| classname-variants/react   |   828 B |  1,647 B |   744 B |         0.13x |
| react-class-variants       | 6,481 B | 22,759 B | 5,832 B |            1x |

## Retained Memory

### Resolver instances: plain freshComplexConfig

| Library                  | Median bytes/instance |   RME | Relative to baseline |
| ------------------------ | --------------------: | ----: | -------------------: |
| class-variance-authority |              728.02 B | 0.14% |                0.47x |
| classname-variants       |              888.02 B | 0.13% |                0.57x |
| tailwind-variants/lite   |            1,088.02 B | 0.16% |                 0.7x |
| react-class-variants     |            1,552.02 B | 0.23% |                   1x |

### Resolver instances: plain freshSimpleConfig

| Library                  | Median bytes/instance |   RME | Relative to baseline |
| ------------------------ | --------------------: | ----: | -------------------: |
| class-variance-authority |              320.02 B | 0.25% |                0.37x |
| classname-variants       |              360.02 B | 0.23% |                0.42x |
| tailwind-variants/lite   |              704.02 B | 0.21% |                0.81x |
| react-class-variants     |              864.03 B | 0.27% |                   1x |

### Resolver instances: tailwind-aware freshComplexConfig

| Library                            | Median bytes/instance |   RME | Relative to baseline |
| ---------------------------------- | --------------------: | ----: | -------------------: |
| class-variance-authority + twMerge |              824.02 B | 0.13% |                0.53x |
| classname-variants + twMerge       |              984.02 B | 0.12% |                0.63x |
| tailwind-variants                  |            1,088.02 B | 0.16% |                 0.7x |
| react-class-variants + twMerge     |            1,552.02 B | 0.23% |                   1x |

### Resolver instances: tailwind-aware freshSimpleConfig

| Library                            | Median bytes/instance |   RME | Relative to baseline |
| ---------------------------------- | --------------------: | ----: | -------------------: |
| class-variance-authority + twMerge |              416.02 B | 0.44% |                0.48x |
| classname-variants + twMerge       |              456.02 B | 0.19% |                0.53x |
| tailwind-variants                  |              704.02 B | 0.21% |                0.81x |
| react-class-variants + twMerge     |              864.02 B | 0.27% |                   1x |
