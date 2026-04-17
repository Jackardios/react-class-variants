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

Generated at: 2026-04-17T12:03:45.183Z
Node: v22.17.0
Mode: production
Platform: darwin arm64

## Runtime

### Resolver only: complexExplicit

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   5,345,590.21 | 1.15% |                   1x |
| classname-variants       |   2,614,180.41 | 1.89% |                0.49x |
| class-variance-authority |     740,323.13 | 4.94% |                0.14x |
| tailwind-variants/lite   |     571,650.63 | 1.22% |                0.11x |

### Resolver only: complexNoCompound

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   7,864,286.21 | 1.11% |                   1x |
| classname-variants       |   3,022,589.42 | 0.85% |                0.38x |
| class-variance-authority |     921,732.22 | 9.42% |                0.12x |
| tailwind-variants/lite   |     763,155.61 | 0.97% |                 0.1x |

### Resolver only: complexWithCompound

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |   6,056,589.15 | 0.94% |                   1x |
| classname-variants       |      2,767,663 | 0.39% |                0.46x |
| class-variance-authority |     859,493.88 |  1.8% |                0.14x |
| tailwind-variants/lite   |     668,970.39 | 2.39% |                0.11x |

### Resolver only: simpleDefaults

| Library                  | Median ops/sec |   RME | Relative to baseline |
| ------------------------ | -------------: | ----: | -------------------: |
| react-class-variants     |  15,356,669.83 |  1.1% |                   1x |
| class-variance-authority |   7,750,727.45 | 4.91% |                 0.5x |
| classname-variants       |    6,059,315.3 |  0.5% |                0.39x |
| tailwind-variants/lite   |   1,800,088.55 | 1.66% |                0.12x |

### Resolver only: simpleExplicit

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| react-class-variants     |  15,656,525.11 |  0.32% |                   1x |
| classname-variants       |   6,481,773.14 |     1% |                0.41x |
| class-variance-authority |   5,896,755.28 | 15.17% |                0.38x |
| tailwind-variants/lite   |   1,751,375.05 |  3.25% |                0.11x |

### Tailwind-aware: complexExplicit

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   1,803,827.43 | 6.33% |                   1x |
| classname-variants + twMerge       |   1,308,137.72 | 5.23% |                0.73x |
| class-variance-authority + twMerge |     543,761.65 | 6.41% |                 0.3x |
| tailwind-variants                  |     432,378.16 | 3.25% |                0.24x |

### Tailwind-aware: complexNoCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   3,527,895.33 |  0.7% |                   1x |
| classname-variants + twMerge       |   1,902,553.71 |  3.7% |                0.54x |
| class-variance-authority + twMerge |      689,364.5 | 4.85% |                 0.2x |
| tailwind-variants                  |     658,184.64 | 0.71% |                0.19x |

### Tailwind-aware: complexWithCompound

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   2,297,020.61 | 2.08% |                   1x |
| classname-variants + twMerge       |   1,587,210.07 | 2.31% |                0.69x |
| class-variance-authority + twMerge |      648,862.7 |  0.9% |                0.28x |
| tailwind-variants                  |     523,966.59 | 1.43% |                0.23x |

### Tailwind-aware: simpleDefaults

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   5,116,330.97 | 7.05% |                   1x |
| class-variance-authority + twMerge |   3,847,561.38 | 1.89% |                0.75x |
| classname-variants + twMerge       |    3,490,664.9 | 2.05% |                0.68x |
| tailwind-variants                  |   1,352,898.96 | 4.05% |                0.26x |

### Tailwind-aware: simpleExplicit

| Library                            | Median ops/sec |   RME | Relative to baseline |
| ---------------------------------- | -------------: | ----: | -------------------: |
| react-class-variants + twMerge     |   5,299,122.11 | 0.91% |                   1x |
| classname-variants + twMerge       |   3,623,851.85 |    1% |                0.68x |
| class-variance-authority + twMerge |   3,477,333.51 | 1.48% |                0.66x |
| tailwind-variants                  |   1,239,795.02 | 3.69% |                0.23x |

### Resolver creation: plain (fresh unique complex config)

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| class-variance-authority |  13,950,843.91 | 10.68% |               10.72x |
| classname-variants       |   11,937,859.3 |  7.07% |                9.17x |
| tailwind-variants/lite   |   6,940,492.44 |  18.1% |                5.33x |
| react-class-variants     |   1,301,261.11 |  2.07% |                   1x |

### Resolver creation: plain (diagnostic reused complex config)

| Library                  | Median ops/sec |    RME | Relative to baseline |
| ------------------------ | -------------: | -----: | -------------------: |
| class-variance-authority | 198,998,325.23 | 44.37% |              134.99x |
| classname-variants       |  69,773,883.06 | 72.37% |               47.33x |
| tailwind-variants/lite   |  11,893,475.43 |  5.27% |                8.07x |
| react-class-variants     |   1,474,181.16 |  2.18% |                   1x |

### Resolver creation: tailwind-aware (fresh unique complex config)

| Library                            | Median ops/sec |    RME | Relative to baseline |
| ---------------------------------- | -------------: | -----: | -------------------: |
| class-variance-authority + twMerge |  13,553,941.91 | 14.22% |               10.29x |
| classname-variants + twMerge       |  11,579,652.25 |   2.5% |                8.79x |
| tailwind-variants                  |   6,895,599.37 |   5.5% |                5.23x |
| react-class-variants + twMerge     |   1,317,705.19 |  0.96% |                   1x |

### Resolver creation: tailwind-aware (diagnostic reused complex config)

| Library                            | Median ops/sec |     RME | Relative to baseline |
| ---------------------------------- | -------------: | ------: | -------------------: |
| class-variance-authority + twMerge |  73,384,539.02 |  70.29% |               52.77x |
| classname-variants + twMerge       |  49,823,356.95 | 117.85% |               35.83x |
| tailwind-variants                  |  12,059,643.25 |   2.85% |                8.67x |
| react-class-variants + twMerge     |   1,390,637.19 |   3.38% |                   1x |

## Bundle Size

### Minimal synthetic consumer bundle size: plain recipe

| Minimal synthetic consumer |    gzip |      raw |  brotli | Relative gzip |
| -------------------------- | ------: | -------: | ------: | ------------: |
| classname-variants         |   511 B |    850 B |   451 B |         0.15x |
| class-variance-authority   |   707 B |  1,364 B |   633 B |         0.21x |
| tailwind-variants/lite     | 2,199 B |  5,225 B | 2,019 B |         0.67x |
| react-class-variants/core  | 3,302 B | 10,121 B | 2,999 B |            1x |
| react-class-variants       | 3,410 B | 10,487 B | 3,103 B |         1.03x |

### Minimal synthetic consumer bundle size: tailwind-aware recipe

| Minimal synthetic consumer          |     gzip |      raw |   brotli | Relative gzip |
| ----------------------------------- | -------: | -------: | -------: | ------------: |
| classname-variants + twMerge        |  8,630 B | 26,995 B |  7,546 B |          0.7x |
| class-variance-authority + twMerge  |  8,797 B | 27,517 B |  7,679 B |         0.71x |
| tailwind-variants                   | 10,660 B | 32,701 B |  9,341 B |         0.86x |
| react-class-variants/core + twMerge | 12,395 B | 41,683 B | 10,856 B |            1x |

### Minimal synthetic consumer bundle size: React/styled

| Minimal synthetic consumer |    gzip |      raw |  brotli | Relative gzip |
| -------------------------- | ------: | -------: | ------: | ------------: |
| classname-variants/react   |   828 B |  1,647 B |   744 B |         0.15x |
| react-class-variants       | 5,611 B | 18,373 B | 5,029 B |            1x |

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
| class-variance-authority + twMerge |              416.02 B |  0.2% |                0.48x |
| classname-variants + twMerge       |              456.02 B | 0.19% |                0.53x |
| tailwind-variants                  |              704.02 B | 0.21% |                0.81x |
| react-class-variants + twMerge     |              864.02 B | 0.27% |                   1x |
