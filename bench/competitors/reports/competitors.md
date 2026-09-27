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

Generated at: 2026-09-27T13:24:43.897Z
Node: v22.17.0
Mode: production
Platform: darwin arm64

## Runtime

### Resolver only: complexExplicit

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   4,941,492.95 | 0.46% |                   1x |
| classname-variants       |   2,342,394.77 | 2.75% |                0.47x |
| class-variance-authority |     650,108.97 | 0.76% |                0.13x |
| tailwind-variants/lite   |     510,954.15 | 0.76% |                 0.1x |

### Resolver only: complexNoCompound

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   7,020,270.05 | 0.36% |                   1x |
| classname-variants       |   2,677,851.64 | 0.42% |                0.38x |
| class-variance-authority |     826,618.14 | 0.79% |                0.12x |
| tailwind-variants/lite   |     729,735.65 | 0.62% |                 0.1x |

### Resolver only: complexWithCompound

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   5,565,656.44 | 0.47% |                   1x |
| classname-variants       |   2,467,982.91 | 0.39% |                0.44x |
| class-variance-authority |     791,574.53 |  1.8% |                0.14x |
| tailwind-variants/lite   |     583,538.77 | 0.85% |                 0.1x |

### Resolver only: simpleDefaults

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |  13,817,769.69 | 0.99% |                   1x |
| class-variance-authority |   6,906,232.25 | 0.35% |                 0.5x |
| classname-variants       |   5,424,386.13 |  0.3% |                0.39x |
| tailwind-variants/lite   |   1,670,536.98 | 2.28% |                0.12x |

### Resolver only: simpleExplicit

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |  14,558,852.02 | 0.69% |                   1x |
| classname-variants       |   5,804,793.93 | 0.56% |                 0.4x |
| class-variance-authority |   5,499,616.85 | 0.75% |                0.38x |
| tailwind-variants/lite   |    1,553,809.4 | 2.25% |                0.11x |

### Tailwind-aware: complexExplicit

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   4,433,932.76 |  1.2% |                   1x |
| classname-variants + twMerge       |   1,353,507.06 |  0.3% |                0.31x |
| class-variance-authority + twMerge |     545,244.41 | 0.71% |                0.12x |
| tailwind-variants                  |     438,189.08 | 0.96% |                 0.1x |

### Tailwind-aware: complexNoCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   4,391,445.22 | 0.34% |                   1x |
| classname-variants + twMerge       |   1,992,428.65 | 0.32% |                0.45x |
| class-variance-authority + twMerge |     687,987.87 | 7.06% |                0.16x |
| tailwind-variants                  |     663,260.52 | 0.15% |                0.15x |

### Tailwind-aware: complexWithCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   4,261,168.76 |  0.3% |                   1x |
| classname-variants + twMerge       |    1,567,767.6 | 0.62% |                0.37x |
| class-variance-authority + twMerge |     650,949.92 | 0.35% |                0.15x |
| tailwind-variants                  |     531,951.05 | 0.67% |                0.12x |

### Tailwind-aware: simpleDefaults

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |     10,245,930 | 1.48% |                   1x |
| class-variance-authority + twMerge |   3,769,666.38 | 0.29% |                0.37x |
| classname-variants + twMerge       |    3,481,383.8 | 0.57% |                0.34x |
| tailwind-variants                  |    1,306,914.4 | 2.19% |                0.13x |

### Tailwind-aware: simpleExplicit

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   6,629,177.98 | 0.44% |                   1x |
| classname-variants + twMerge       |   3,678,294.99 |  0.5% |                0.55x |
| class-variance-authority + twMerge |   3,254,538.39 |  0.7% |                0.49x |
| tailwind-variants                  |   1,305,725.36 | 0.44% |                 0.2x |

### Resolver creation: plain (fresh unique complex config)

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| class-variance-authority |  12,786,106.74 |  9.8% |               10.56x |
| classname-variants       |  11,623,200.77 | 6.68% |                 9.6x |
| tailwind-variants/lite   |   6,753,843.21 | 0.22% |                5.58x |
| react-class-variants     |   1,210,986.87 | 0.99% |                   1x |

### Resolver creation: plain (diagnostic reused complex config)

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| class-variance-authority | 170,624,140.27 |  48.4% |              131.14x |
| classname-variants       |  65,225,863.51 | 72.13% |               50.13x |
| tailwind-variants/lite   |  10,714,129.54 |  0.81% |                8.23x |
| react-class-variants     |   1,301,101.77 |   0.6% |                   1x |

### Resolver creation: tailwind-aware (fresh unique complex config)

| Library                            | Median ops/sec |    RME | Relative to baseline |
| ---------------------------------- | -------------: | -----: | -------------------: |
| class-variance-authority + twMerge |  12,063,889.07 | 14.33% |               10.02x |
| classname-variants + twMerge       |  10,670,783.23 |   1.8% |                8.87x |
| tailwind-variants                  |   6,846,560.83 |  4.96% |                5.69x |
| react-class-variants + twMerge     |   1,203,427.85 |  0.46% |                   1x |

### Resolver creation: tailwind-aware (diagnostic reused complex config)

| Library                            | Median ops/sec |    RME | Relative to baseline |
| ---------------------------------- | -------------: | -----: | -------------------: |
| class-variance-authority + twMerge |   62,533,637.2 | 72.74% |               46.64x |
| classname-variants + twMerge       |  43,073,621.49 | 123.4% |               32.13x |
| tailwind-variants                  |  12,974,070.85 |  0.52% |                9.68x |
| react-class-variants + twMerge     |   1,340,808.64 |  0.41% |                   1x |

## Bundle Size

### Minimal synthetic consumer bundle size: plain recipe

| Minimal synthetic consumer |    gzip |      raw |  brotli | Relative gzip |
| -------------------------- | ------: | -------: | ------: | ------------: |
| classname-variants         |   504 B |    817 B |   441 B |         0.13x |
| class-variance-authority   |   692 B |  1,266 B |   623 B |         0.18x |
| tailwind-variants/lite     | 2,142 B |  4,881 B | 1,974 B |         0.55x |
| react-class-variants/core  | 3,866 B | 10,902 B | 3,531 B |            1x |
| react-class-variants       | 3,941 B | 11,103 B | 3,596 B |         1.02x |

### Minimal synthetic consumer bundle size: tailwind-aware recipe

| Minimal synthetic consumer          |     gzip |      raw |   brotli | Relative gzip |
| ----------------------------------- | -------: | -------: | -------: | ------------: |
| classname-variants + twMerge        |  8,622 B | 26,962 B |  7,491 B |          0.7x |
| class-variance-authority + twMerge  |  8,785 B | 27,419 B |  7,665 B |         0.71x |
| tailwind-variants                   | 10,586 B | 32,328 B |  9,280 B |         0.86x |
| react-class-variants/core + twMerge | 12,365 B | 38,793 B | 10,879 B |            1x |

### Minimal synthetic consumer bundle size: React/styled

| Minimal synthetic consumer |    gzip |      raw |  brotli | Relative gzip |
| -------------------------- | ------: | -------: | ------: | ------------: |
| classname-variants/react   |   817 B |  1,607 B |   745 B |         0.14x |
| react-class-variants       | 5,969 B | 17,995 B | 5,406 B |            1x |

## Retained Memory

### Resolver instances: plain freshComplexConfig

| Library                  | Median bytes/instance |   RME | Relative to baseline |
| ------------------------ | --------------------: | ----: | -------------------: |
| class-variance-authority |              728.02 B | 0.15% |                0.37x |
| classname-variants       |              888.02 B | 0.13% |                0.46x |
| tailwind-variants/lite   |            1,088.02 B | 0.16% |                0.56x |
| react-class-variants     |            1,944.02 B | 0.22% |                   1x |

### Resolver instances: plain freshSimpleConfig

| Library                  | Median bytes/instance |   RME | Relative to baseline |
| ------------------------ | --------------------: | ----: | -------------------: |
| class-variance-authority |              320.02 B | 0.26% |                0.33x |
| classname-variants       |              360.02 B | 0.23% |                0.37x |
| tailwind-variants/lite   |              704.02 B | 0.21% |                0.72x |
| react-class-variants     |              984.02 B | 0.29% |                   1x |

### Resolver instances: tailwind-aware freshComplexConfig

| Library                            | Median bytes/instance |   RME | Relative to baseline |
| ---------------------------------- | --------------------: | ----: | -------------------: |
| class-variance-authority + twMerge |              824.02 B | 0.13% |                0.42x |
| classname-variants + twMerge       |              984.02 B | 0.12% |                0.51x |
| tailwind-variants                  |            1,088.02 B | 0.16% |                0.56x |
| react-class-variants + twMerge     |            1,944.02 B | 0.22% |                   1x |

### Resolver instances: tailwind-aware freshSimpleConfig

| Library                            | Median bytes/instance |   RME | Relative to baseline |
| ---------------------------------- | --------------------: | ----: | -------------------: |
| class-variance-authority + twMerge |              416.02 B |  0.2% |                0.42x |
| classname-variants + twMerge       |              456.02 B |  0.4% |                0.46x |
| tailwind-variants                  |              704.02 B | 0.21% |                0.71x |
| react-class-variants + twMerge     |              985.11 B | 0.29% |                   1x |
