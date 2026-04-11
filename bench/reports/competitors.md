# Competitive Benchmarks

This report compares `react-class-variants` against `class-variance-authority`, `classname-variants`, and `tailwind-variants` on root-only common-denominator scenarios.

- All numbers are collected with `NODE_ENV=production`.
- `resolver-only` uses plain resolvers; `tailwind-variants/lite` is used there to isolate raw resolver cost from built-in merge work.
- `tailwind-aware` compares `react-class-variants + twMerge`, wrapper-based `twMerge` integrations for CVA / classname-variants, and full `tailwind-variants`.
- Primary creation throughput uses `fresh unique complex config` so it reflects first-time compile cost.
- `reused complex config` remains as a diagnostic appendix for same-object config reuse versus fresh config object setup cost.
- Memory numbers are retained bytes per created resolver instance under forced GC with fresh unique config objects.
- Bundle size numbers are minified synthetic consumer bundles built with esbuild, reported primarily by gzip bytes with React marked external.

Generated at: 2026-04-11T14:48:34.649Z
Node: v22.17.0
Mode: production
Platform: darwin arm64

## Runtime

### Resolver only: simpleDefaults

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants | 17,416,820.05 ops/sec | 1x |
| class-variance-authority | 7,187,423.83 ops/sec | 0.41x |
| classname-variants | 5,587,934.8 ops/sec | 0.32x |
| tailwind-variants/lite | 1,824,685.24 ops/sec | 0.1x |

### Resolver only: simpleExplicit

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants | 16,610,767.45 ops/sec | 1x |
| class-variance-authority | 6,063,606.86 ops/sec | 0.37x |
| classname-variants | 5,913,410.62 ops/sec | 0.36x |
| tailwind-variants/lite | 1,734,212.38 ops/sec | 0.1x |

### Resolver only: complexWithCompound

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants | 5,900,326.25 ops/sec | 1x |
| classname-variants | 2,543,838.88 ops/sec | 0.43x |
| class-variance-authority | 854,535.56 ops/sec | 0.14x |
| tailwind-variants/lite | 662,035.11 ops/sec | 0.11x |

### Resolver only: complexNoCompound

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants | 7,075,084.45 ops/sec | 1x |
| classname-variants | 2,834,035.35 ops/sec | 0.4x |
| class-variance-authority | 1,292,686.96 ops/sec | 0.18x |
| tailwind-variants/lite | 806,326.62 ops/sec | 0.11x |

### Resolver only: complexExplicit

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants | 5,548,799.62 ops/sec | 1x |
| classname-variants | 2,398,984.9 ops/sec | 0.43x |
| class-variance-authority | 928,169.81 ops/sec | 0.17x |
| tailwind-variants/lite | 566,547.98 ops/sec | 0.1x |

### Tailwind-aware: simpleDefaults

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants + twMerge | 5,513,271.32 ops/sec | 1x |
| class-variance-authority + twMerge | 3,903,321.48 ops/sec | 0.71x |
| classname-variants + twMerge | 3,777,413.25 ops/sec | 0.69x |
| tailwind-variants | 1,493,433.99 ops/sec | 0.27x |

### Tailwind-aware: simpleExplicit

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants + twMerge | 5,802,283.42 ops/sec | 1x |
| classname-variants + twMerge | 4,001,453.8 ops/sec | 0.69x |
| class-variance-authority + twMerge | 3,542,374.19 ops/sec | 0.61x |
| tailwind-variants | 1,452,211.21 ops/sec | 0.25x |

### Tailwind-aware: complexWithCompound

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants + twMerge | 2,459,922.11 ops/sec | 1x |
| classname-variants + twMerge | 1,719,043.89 ops/sec | 0.7x |
| class-variance-authority + twMerge | 923,824.63 ops/sec | 0.38x |
| tailwind-variants | 590,220.91 ops/sec | 0.24x |

### Tailwind-aware: complexNoCompound

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants + twMerge | 3,537,227.42 ops/sec | 1x |
| classname-variants + twMerge | 2,184,595.27 ops/sec | 0.62x |
| class-variance-authority + twMerge | 1,076,999.28 ops/sec | 0.3x |
| tailwind-variants | 729,723.25 ops/sec | 0.21x |

### Tailwind-aware: complexExplicit

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants + twMerge | 1,986,264.93 ops/sec | 1x |
| classname-variants + twMerge | 1,452,594.7 ops/sec | 0.73x |
| class-variance-authority + twMerge | 704,914.27 ops/sec | 0.35x |
| tailwind-variants | 482,681.02 ops/sec | 0.24x |

### Resolver creation: plain (fresh unique complex config)

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority | 14,981,297.65 ops/sec | 16.63x |
| classname-variants | 13,724,488.06 ops/sec | 15.23x |
| tailwind-variants/lite | 8,156,712.98 ops/sec | 9.05x |
| react-class-variants | 900,893.69 ops/sec | 1x |

### Resolver creation: plain (diagnostic reused complex config)

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority | 45,345,984.76 ops/sec | 42.21x |
| classname-variants | 43,272,470.18 ops/sec | 40.28x |
| tailwind-variants/lite | 12,772,036.11 ops/sec | 11.89x |
| react-class-variants | 1,074,347.36 ops/sec | 1x |

### Resolver creation: tailwind-aware (fresh unique complex config)

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority + twMerge | 12,656,345.17 ops/sec | 13.6x |
| classname-variants + twMerge | 11,542,934.57 ops/sec | 12.41x |
| tailwind-variants | 7,765,970.21 ops/sec | 8.35x |
| react-class-variants + twMerge | 930,446.48 ops/sec | 1x |

### Resolver creation: tailwind-aware (diagnostic reused complex config)

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority + twMerge | 40,842,338.74 ops/sec | 37.98x |
| classname-variants + twMerge | 38,485,729.49 ops/sec | 35.79x |
| tailwind-variants | 12,802,556.75 ops/sec | 11.91x |
| react-class-variants + twMerge | 1,075,297.43 ops/sec | 1x |

## Bundle Size

### Bundle size: plain recipe

| Package import | gzip | raw | brotli | Relative gzip |
| --- | ---: | ---: | ---: | ---: |
| classname-variants | 511 B | 850 B | 451 B | 0.13x |
| class-variance-authority | 707 B | 1,364 B | 633 B | 0.18x |
| tailwind-variants/lite | 2,199 B | 5,225 B | 2,019 B | 0.57x |
| react-class-variants/core | 3,867 B | 11,746 B | 3,453 B | 1x |
| react-class-variants | 3,868 B | 11,746 B | 3,455 B | 1x |

### Bundle size: tailwind-aware recipe

| Package import | gzip | raw | brotli | Relative gzip |
| --- | ---: | ---: | ---: | ---: |
| classname-variants + twMerge | 8,630 B | 26,995 B | 7,546 B | 0.72x |
| class-variance-authority + twMerge | 8,797 B | 27,517 B | 7,679 B | 0.74x |
| tailwind-variants | 10,660 B | 32,701 B | 9,341 B | 0.89x |
| react-class-variants/core + twMerge | 11,923 B | 38,071 B | 10,513 B | 1x |

### Bundle size: React/styled

| Package import | gzip | raw | brotli | Relative gzip |
| --- | ---: | ---: | ---: | ---: |
| classname-variants/react | 828 B | 1,647 B | 744 B | 0.16x |
| react-class-variants/react | 5,071 B | 15,714 B | 4,525 B | 1x |
| react-class-variants | 5,073 B | 15,715 B | 4,529 B | 1x |

## Retained Memory

### Resolver instances: plain freshComplexConfig

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority | 726.89 B | 0.48x |
| classname-variants | 888.13 B | 0.58x |
| tailwind-variants/lite | 1,088.12 B | 0.72x |
| react-class-variants | 1,519.71 B | 1x |

### Resolver instances: plain freshSimpleConfig

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority | 320.28 B | 0.45x |
| classname-variants | 360.51 B | 0.5x |
| tailwind-variants/lite | 704.45 B | 0.98x |
| react-class-variants | 719.12 B | 1x |

### Resolver instances: tailwind-aware freshComplexConfig

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority + twMerge | 824.12 B | 0.54x |
| classname-variants + twMerge | 984.12 B | 0.65x |
| tailwind-variants | 1,087.16 B | 0.72x |
| react-class-variants + twMerge | 1,520.12 B | 1x |

### Resolver instances: tailwind-aware freshSimpleConfig

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority + twMerge | 416.48 B | 0.58x |
| classname-variants + twMerge | 456.76 B | 0.63x |
| tailwind-variants | 704.43 B | 0.98x |
| react-class-variants + twMerge | 719.94 B | 1x |
