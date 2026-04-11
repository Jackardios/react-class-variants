# Competitive Benchmarks

This report compares `react-class-variants` against `class-variance-authority`, `classname-variants`, and `tailwind-variants` on root-only common-denominator scenarios.

- All numbers are collected with `NODE_ENV=production`.
- `resolver-only` uses plain resolvers; `tailwind-variants/lite` is used there to isolate raw resolver cost from built-in merge work.
- `tailwind-aware` compares `react-class-variants + twMerge`, wrapper-based `twMerge` integrations for CVA / classname-variants, and full `tailwind-variants`.
- Primary creation throughput uses `fresh unique complex config` so it reflects first-time compile cost.
- `reused complex config` remains as a diagnostic appendix for config-identity reuse scenarios.
- Memory numbers are retained bytes per created resolver instance under forced GC with fresh unique config objects.

Generated at: 2026-04-11T00:54:34.860Z
Node: v22.17.0
Mode: production
Platform: darwin arm64

## Runtime

### Resolver only: simpleDefaults

| Library                  |                 Value | Relative to react-class-variants |
| ------------------------ | --------------------: | -------------------------------: |
| react-class-variants     | 11,376,237.79 ops/sec |                               1x |
| class-variance-authority |  6,272,364.41 ops/sec |                            0.55x |
| classname-variants       |  4,945,567.26 ops/sec |                            0.43x |
| tailwind-variants/lite   |  1,517,816.86 ops/sec |                            0.13x |

### Resolver only: simpleExplicit

| Library                  |                 Value | Relative to react-class-variants |
| ------------------------ | --------------------: | -------------------------------: |
| react-class-variants     | 12,020,198.64 ops/sec |                               1x |
| classname-variants       |  5,532,677.27 ops/sec |                            0.46x |
| class-variance-authority |  5,512,110.72 ops/sec |                            0.46x |
| tailwind-variants/lite   |  1,659,973.86 ops/sec |                            0.14x |

### Resolver only: complexWithCompound

| Library                  |                Value | Relative to react-class-variants |
| ------------------------ | -------------------: | -------------------------------: |
| react-class-variants     | 5,426,010.22 ops/sec |                               1x |
| classname-variants       | 2,290,103.44 ops/sec |                            0.42x |
| class-variance-authority |   769,597.85 ops/sec |                            0.14x |
| tailwind-variants/lite   |   577,556.27 ops/sec |                            0.11x |

### Resolver only: complexNoCompound

| Library                  |                Value | Relative to react-class-variants |
| ------------------------ | -------------------: | -------------------------------: |
| react-class-variants     |  6,332,430.6 ops/sec |                               1x |
| classname-variants       |  2,500,167.5 ops/sec |                            0.39x |
| class-variance-authority | 1,154,210.13 ops/sec |                            0.18x |
| tailwind-variants/lite   |   740,741.36 ops/sec |                            0.12x |

### Resolver only: complexExplicit

| Library                  |                Value | Relative to react-class-variants |
| ------------------------ | -------------------: | -------------------------------: |
| react-class-variants     | 5,124,472.66 ops/sec |                               1x |
| classname-variants       | 2,375,468.16 ops/sec |                            0.46x |
| class-variance-authority |   883,828.83 ops/sec |                            0.17x |
| tailwind-variants/lite   |   541,197.38 ops/sec |                            0.11x |

### Tailwind-aware: simpleDefaults

| Library                            |                Value | Relative to react-class-variants |
| ---------------------------------- | -------------------: | -------------------------------: |
| react-class-variants + twMerge     | 4,657,468.27 ops/sec |                               1x |
| class-variance-authority + twMerge | 3,634,529.94 ops/sec |                            0.78x |
| classname-variants + twMerge       | 3,491,973.22 ops/sec |                            0.75x |
| tailwind-variants                  | 1,285,259.26 ops/sec |                            0.28x |

### Tailwind-aware: simpleExplicit

| Library                            |                Value | Relative to react-class-variants |
| ---------------------------------- | -------------------: | -------------------------------: |
| react-class-variants + twMerge     | 4,786,482.26 ops/sec |                               1x |
| classname-variants + twMerge       | 3,701,926.58 ops/sec |                            0.77x |
| class-variance-authority + twMerge | 3,356,356.69 ops/sec |                             0.7x |
| tailwind-variants                  | 1,351,890.72 ops/sec |                            0.28x |

### Tailwind-aware: complexWithCompound

| Library                            |                Value | Relative to react-class-variants |
| ---------------------------------- | -------------------: | -------------------------------: |
| react-class-variants + twMerge     | 2,332,728.08 ops/sec |                               1x |
| classname-variants + twMerge       | 1,504,691.66 ops/sec |                            0.65x |
| class-variance-authority + twMerge |   880,325.65 ops/sec |                            0.38x |
| tailwind-variants                  |   448,668.37 ops/sec |                            0.19x |

### Tailwind-aware: complexNoCompound

| Library                            |                Value | Relative to react-class-variants |
| ---------------------------------- | -------------------: | -------------------------------: |
| react-class-variants + twMerge     | 3,194,377.64 ops/sec |                               1x |
| classname-variants + twMerge       | 1,926,638.41 ops/sec |                             0.6x |
| class-variance-authority + twMerge |   946,287.74 ops/sec |                             0.3x |
| tailwind-variants                  |    658,641.6 ops/sec |                            0.21x |

### Tailwind-aware: complexExplicit

| Library                            |                Value | Relative to react-class-variants |
| ---------------------------------- | -------------------: | -------------------------------: |
| react-class-variants + twMerge     | 1,780,459.93 ops/sec |                               1x |
| classname-variants + twMerge       | 1,279,483.47 ops/sec |                            0.72x |
| class-variance-authority + twMerge |   621,366.16 ops/sec |                            0.35x |
| tailwind-variants                  |   422,151.56 ops/sec |                            0.24x |

### Resolver creation: plain (fresh unique complex config)

| Library                  |                 Value | Relative to react-class-variants |
| ------------------------ | --------------------: | -------------------------------: |
| class-variance-authority | 13,199,756.02 ops/sec |                           17.23x |
| classname-variants       | 12,333,349.24 ops/sec |                            16.1x |
| tailwind-variants/lite   |   6,911,780.4 ops/sec |                            9.02x |
| react-class-variants     |    766,073.98 ops/sec |                               1x |

### Resolver creation: plain (diagnostic reused complex config)

| Library                  |                 Value | Relative to react-class-variants |
| ------------------------ | --------------------: | -------------------------------: |
| class-variance-authority | 41,843,095.39 ops/sec |                           49.77x |
| classname-variants       | 40,344,352.88 ops/sec |                           47.99x |
| tailwind-variants/lite   | 11,854,992.13 ops/sec |                            14.1x |
| react-class-variants     |    840,676.42 ops/sec |                               1x |

### Resolver creation: tailwind-aware (fresh unique complex config)

| Library                            |                 Value | Relative to react-class-variants |
| ---------------------------------- | --------------------: | -------------------------------: |
| class-variance-authority + twMerge | 12,308,197.98 ops/sec |                           15.59x |
| classname-variants + twMerge       | 11,277,762.38 ops/sec |                           14.29x |
| tailwind-variants                  |   6,976,503.5 ops/sec |                            8.84x |
| react-class-variants + twMerge     |    789,285.82 ops/sec |                               1x |

### Resolver creation: tailwind-aware (diagnostic reused complex config)

| Library                            |                 Value | Relative to react-class-variants |
| ---------------------------------- | --------------------: | -------------------------------: |
| class-variance-authority + twMerge | 37,642,253.33 ops/sec |                           43.55x |
| classname-variants + twMerge       | 32,878,506.89 ops/sec |                           38.04x |
| tailwind-variants                  | 11,238,102.59 ops/sec |                              13x |
| react-class-variants + twMerge     |    864,282.17 ops/sec |                               1x |

## Retained Memory

### Resolver instances: plain freshComplexConfig

| Library                  |      Value | Relative to react-class-variants |
| ------------------------ | ---------: | -------------------------------: |
| class-variance-authority |   728.56 B |                            0.27x |
| classname-variants       |   888.36 B |                            0.32x |
| tailwind-variants/lite   | 1,088.31 B |                             0.4x |
| react-class-variants     | 2,736.16 B |                               1x |

### Resolver instances: plain freshSimpleConfig

| Library                  |      Value | Relative to react-class-variants |
| ------------------------ | ---------: | -------------------------------: |
| class-variance-authority |   320.49 B |                            0.31x |
| classname-variants       |   360.55 B |                            0.35x |
| tailwind-variants/lite   |   706.08 B |                            0.69x |
| react-class-variants     | 1,028.57 B |                               1x |

### Resolver instances: tailwind-aware freshComplexConfig

| Library                            |      Value | Relative to react-class-variants |
| ---------------------------------- | ---------: | -------------------------------: |
| class-variance-authority + twMerge |   824.12 B |                             0.3x |
| classname-variants + twMerge       |   984.12 B |                            0.36x |
| tailwind-variants                  | 1,087.16 B |                             0.4x |
| react-class-variants + twMerge     | 2,736.75 B |                               1x |

### Resolver instances: tailwind-aware freshSimpleConfig

| Library                            |      Value | Relative to react-class-variants |
| ---------------------------------- | ---------: | -------------------------------: |
| class-variance-authority + twMerge |   417.01 B |                            0.41x |
| classname-variants + twMerge       |   456.47 B |                            0.45x |
| tailwind-variants                  |   704.43 B |                            0.69x |
| react-class-variants + twMerge     | 1,022.88 B |                               1x |
