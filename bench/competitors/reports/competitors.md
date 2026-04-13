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

Generated at: 2026-04-13T01:52:37.663Z
Node: v22.17.0
Mode: production
Platform: darwin arm64

## Runtime

### Resolver only: complexExplicit

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| react-class-variants     |   5,212,233.21 |  1.68% |                   1x |
| classname-variants       |   2,365,402.59 |  3.66% |                0.45x |
| class-variance-authority |     670,752.26 | 10.64% |                0.13x |
| tailwind-variants/lite   |     517,794.35 | 12.46% |                 0.1x |

### Resolver only: complexNoCompound

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   7,433,869.91 | 1.98% |                   1x |
| classname-variants       |   2,789,964.66 | 1.15% |                0.38x |
| class-variance-authority |     855,341.12 | 1.43% |                0.12x |
| tailwind-variants/lite   |     737,362.79 | 4.07% |                 0.1x |

### Resolver only: complexWithCompound

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   5,575,364.18 | 1.49% |                   1x |
| classname-variants       |   2,445,460.61 | 3.61% |                0.44x |
| class-variance-authority |     736,746.09 | 6.22% |                0.13x |
| tailwind-variants/lite   |     593,648.56 | 1.53% |                0.11x |

### Resolver only: simpleDefaults

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |  14,253,536.76 |  1.5% |                   1x |
| class-variance-authority |    7,047,469.1 | 2.66% |                0.49x |
| classname-variants       |    5,466,537.7 | 1.41% |                0.38x |
| tailwind-variants/lite   |   1,720,353.73 | 2.01% |                0.12x |

### Resolver only: simpleExplicit

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |  14,312,262.92 | 4.03% |                   1x |
| classname-variants       |   5,852,696.64 | 1.14% |                0.41x |
| class-variance-authority |    5,807,324.4 | 0.73% |                0.41x |
| tailwind-variants/lite   |    1,610,504.5 | 1.93% |                0.11x |

### Tailwind-aware: complexExplicit

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   1,910,165.05 | 6.98% |                   1x |
| classname-variants + twMerge       |   1,406,732.03 |  0.9% |                0.74x |
| class-variance-authority + twMerge |     563,388.26 | 0.72% |                0.29x |
| tailwind-variants                  |     438,678.27 | 1.09% |                0.23x |

### Tailwind-aware: complexNoCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   3,549,409.08 | 0.73% |                   1x |
| classname-variants + twMerge       |   2,056,438.28 | 1.48% |                0.58x |
| class-variance-authority + twMerge |     725,303.78 | 2.22% |                 0.2x |
| tailwind-variants                  |      650,927.1 | 7.24% |                0.18x |

### Tailwind-aware: complexWithCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   2,369,662.72 | 1.88% |                   1x |
| classname-variants + twMerge       |   1,603,892.64 | 1.36% |                0.68x |
| class-variance-authority + twMerge |     680,953.13 | 2.01% |                0.29x |
| tailwind-variants                  |     531,264.15 | 8.04% |                0.22x |

### Tailwind-aware: simpleDefaults

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   5,400,810.97 | 0.21% |                   1x |
| class-variance-authority + twMerge |    3,852,401.6 | 2.22% |                0.71x |
| classname-variants + twMerge       |   3,634,223.48 | 0.56% |                0.67x |
| tailwind-variants                  |    1,350,583.8 | 2.66% |                0.25x |

### Tailwind-aware: simpleExplicit

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   5,571,310.07 | 0.97% |                   1x |
| classname-variants + twMerge       |   3,754,200.99 | 0.76% |                0.67x |
| class-variance-authority + twMerge |   3,491,724.74 | 1.09% |                0.63x |
| tailwind-variants                  |   1,337,582.45 | 1.28% |                0.24x |

### Resolver creation: plain (fresh unique complex config)

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| class-variance-authority |  13,908,719.72 | 9.25% |                10.7x |
| classname-variants       |  12,969,566.06 |  6.2% |                9.98x |
| tailwind-variants/lite   |   7,218,281.83 | 1.27% |                5.55x |
| react-class-variants     |    1,299,884.4 | 9.92% |                   1x |

### Resolver creation: plain (diagnostic reused complex config)

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| class-variance-authority |  142,741,257.1 | 53.99% |              107.33x |
| classname-variants       |  71,608,538.04 | 70.63% |               53.84x |
| tailwind-variants/lite   |  11,708,229.13 |  0.64% |                 8.8x |
| react-class-variants     |   1,329,966.64 |  3.83% |                   1x |

### Resolver creation: tailwind-aware (fresh unique complex config)

| Library                            | Median ops/sec |    RME | Relative to baseline |
| ---------------------------------- | -------------: | -----: | -------------------: |
| class-variance-authority + twMerge |  12,802,143.98 | 12.13% |                9.49x |
| classname-variants + twMerge       |  11,069,419.34 |  1.73% |                8.21x |
| tailwind-variants                  |    7,196,725.6 |  5.22% |                5.34x |
| react-class-variants + twMerge     |   1,348,914.66 |  0.35% |                   1x |

### Resolver creation: tailwind-aware (diagnostic reused complex config)

| Library                            | Median ops/sec |    RME | Relative to baseline |
| ---------------------------------- | -------------: | -----: | -------------------: |
| class-variance-authority + twMerge |  69,254,719.33 | 71.28% |               49.61x |
| classname-variants + twMerge       |  46,953,547.83 | 119.7% |               33.64x |
| tailwind-variants                  |  11,667,759.79 |   0.5% |                8.36x |
| react-class-variants + twMerge     |   1,395,942.81 |   0.6% |                   1x |

## Bundle Size

### Minimal synthetic consumer bundle size: plain recipe

| Minimal synthetic consumer |    gzip |     raw |  brotli | Relative gzip |
| -------------------------- | ------: | ------: | ------: | ------------: |
| classname-variants         |   511 B |   850 B |   451 B |         0.16x |
| class-variance-authority   |   707 B | 1,364 B |   633 B |         0.22x |
| tailwind-variants/lite     | 2,199 B | 5,225 B | 2,019 B |         0.69x |
| react-class-variants/core  | 3,191 B | 9,765 B | 2,895 B |            1x |
| react-class-variants       | 3,261 B | 9,934 B | 2,959 B |         1.02x |

### Minimal synthetic consumer bundle size: tailwind-aware recipe

| Minimal synthetic consumer          |     gzip |      raw |   brotli | Relative gzip |
| ----------------------------------- | -------: | -------: | -------: | ------------: |
| classname-variants + twMerge        |  8,630 B | 26,995 B |  7,546 B |         0.71x |
| class-variance-authority + twMerge  |  8,797 B | 27,517 B |  7,679 B |         0.72x |
| tailwind-variants                   | 10,660 B | 32,701 B |  9,341 B |         0.87x |
| react-class-variants/core + twMerge | 12,239 B | 41,140 B | 10,771 B |            1x |

### Minimal synthetic consumer bundle size: React/styled

| Minimal synthetic consumer |    gzip |      raw |  brotli | Relative gzip |
| -------------------------- | ------: | -------: | ------: | ------------: |
| classname-variants/react   |   828 B |  1,647 B |   744 B |         0.17x |
| react-class-variants       | 4,816 B | 15,183 B | 4,333 B |            1x |

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
| class-variance-authority |              320.02 B | 0.55% |                0.37x |
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
| class-variance-authority + twMerge |              416.02 B |  0.2% |                0.48x |
| classname-variants + twMerge       |              456.02 B |  0.4% |                0.53x |
| tailwind-variants                  |              704.02 B | 0.21% |                0.81x |
| react-class-variants + twMerge     |              864.02 B | 0.28% |                   1x |
