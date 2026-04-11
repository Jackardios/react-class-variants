# Competitive Benchmarks

This report compares `react-class-variants` against `class-variance-authority`, `classname-variants`, and `tailwind-variants` on root-only common-denominator scenarios.

- All numbers are collected with `NODE_ENV=production`.
- `resolver-only` uses plain resolvers; `tailwind-variants/lite` is used there to isolate raw resolver cost from built-in merge work.
- `tailwind-aware` compares `react-class-variants + twMerge`, wrapper-based `twMerge` integrations for CVA / classname-variants, and full `tailwind-variants`.
- Primary creation throughput uses `fresh unique complex config` so it reflects first-time compile cost.
- `reused complex config` remains as a diagnostic appendix for same-object config reuse versus fresh config object setup cost.
- Memory numbers are retained bytes per created resolver instance under forced GC with fresh unique config objects.
- Bundle size numbers are minified synthetic consumer bundles built with esbuild, reported primarily by gzip bytes with React marked external.

Generated at: 2026-04-11T12:57:31.332Z
Node: v22.17.0
Mode: production
Platform: darwin arm64

## Runtime

### Resolver only: simpleDefaults

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants | 14,047,232.12 ops/sec | 1x |
| class-variance-authority | 6,097,249.04 ops/sec | 0.43x |
| classname-variants | 5,112,826.16 ops/sec | 0.36x |
| tailwind-variants/lite | 1,731,756.98 ops/sec | 0.12x |

### Resolver only: simpleExplicit

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants | 13,574,624.47 ops/sec | 1x |
| classname-variants | 5,738,348.7 ops/sec | 0.42x |
| class-variance-authority | 5,530,394.42 ops/sec | 0.41x |
| tailwind-variants/lite | 1,692,975.17 ops/sec | 0.12x |

### Resolver only: complexWithCompound

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants | 5,069,237.78 ops/sec | 1x |
| classname-variants | 2,378,657.47 ops/sec | 0.47x |
| class-variance-authority | 819,357.33 ops/sec | 0.16x |
| tailwind-variants/lite | 629,068.69 ops/sec | 0.12x |

### Resolver only: complexNoCompound

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants | 6,078,463.23 ops/sec | 1x |
| classname-variants | 2,591,509.77 ops/sec | 0.43x |
| class-variance-authority | 1,173,591.59 ops/sec | 0.19x |
| tailwind-variants/lite | 756,390.98 ops/sec | 0.12x |

### Resolver only: complexExplicit

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants | 4,541,329.79 ops/sec | 1x |
| classname-variants | 2,335,559.13 ops/sec | 0.51x |
| class-variance-authority | 873,860.76 ops/sec | 0.19x |
| tailwind-variants/lite | 539,026.61 ops/sec | 0.12x |

### Tailwind-aware: simpleDefaults

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants + twMerge | 4,941,623.61 ops/sec | 1x |
| classname-variants + twMerge | 3,605,227.89 ops/sec | 0.73x |
| class-variance-authority + twMerge | 3,584,868.39 ops/sec | 0.73x |
| tailwind-variants | 1,416,800 ops/sec | 0.29x |

### Tailwind-aware: simpleExplicit

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants + twMerge | 5,254,578.75 ops/sec | 1x |
| classname-variants + twMerge | 3,818,467.95 ops/sec | 0.73x |
| class-variance-authority + twMerge | 3,357,815.87 ops/sec | 0.64x |
| tailwind-variants | 1,383,045.47 ops/sec | 0.26x |

### Tailwind-aware: complexWithCompound

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants + twMerge | 2,255,173.36 ops/sec | 1x |
| classname-variants + twMerge | 1,649,072.66 ops/sec | 0.73x |
| class-variance-authority + twMerge | 872,995.06 ops/sec | 0.39x |
| tailwind-variants | 555,593.75 ops/sec | 0.25x |

### Tailwind-aware: complexNoCompound

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants + twMerge | 3,229,689.12 ops/sec | 1x |
| classname-variants + twMerge | 2,065,741.47 ops/sec | 0.64x |
| class-variance-authority + twMerge | 1,011,501.88 ops/sec | 0.31x |
| tailwind-variants | 681,549.57 ops/sec | 0.21x |

### Tailwind-aware: complexExplicit

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| react-class-variants + twMerge | 1,812,880.33 ops/sec | 1x |
| classname-variants + twMerge | 1,432,256.06 ops/sec | 0.79x |
| class-variance-authority + twMerge | 668,054.84 ops/sec | 0.37x |
| tailwind-variants | 456,949.59 ops/sec | 0.25x |

### Resolver creation: plain (fresh unique complex config)

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority | 13,797,372.41 ops/sec | 10.55x |
| classname-variants | 12,657,740.91 ops/sec | 9.67x |
| tailwind-variants/lite | 7,618,753.04 ops/sec | 5.82x |
| react-class-variants | 1,308,389.32 ops/sec | 1x |

### Resolver creation: plain (diagnostic reused complex config)

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority | 46,746,545.4 ops/sec | 30.74x |
| classname-variants | 43,641,985.51 ops/sec | 28.7x |
| tailwind-variants/lite | 12,811,452.67 ops/sec | 8.42x |
| react-class-variants | 1,520,879.09 ops/sec | 1x |

### Resolver creation: tailwind-aware (fresh unique complex config)

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority + twMerge | 12,130,749.44 ops/sec | 9.32x |
| classname-variants + twMerge | 11,196,897.39 ops/sec | 8.61x |
| tailwind-variants | 7,311,758.59 ops/sec | 5.62x |
| react-class-variants + twMerge | 1,301,135.16 ops/sec | 1x |

### Resolver creation: tailwind-aware (diagnostic reused complex config)

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority + twMerge | 39,169,754.25 ops/sec | 25.79x |
| classname-variants + twMerge | 36,787,452.85 ops/sec | 24.22x |
| tailwind-variants | 12,835,348.66 ops/sec | 8.45x |
| react-class-variants + twMerge | 1,518,575.96 ops/sec | 1x |

## Bundle Size

### Bundle size: plain recipe

| Package import | gzip | raw | brotli | Relative gzip |
| --- | ---: | ---: | ---: | ---: |
| classname-variants | 511 B | 850 B | 451 B | 0.15x |
| class-variance-authority | 707 B | 1,364 B | 633 B | 0.2x |
| tailwind-variants/lite | 2,199 B | 5,225 B | 2,019 B | 0.63x |
| react-class-variants | 3,482 B | 10,513 B | 3,118 B | 1x |
| react-class-variants/core | 3,482 B | 10,513 B | 3,118 B | 1x |

### Bundle size: tailwind-aware recipe

| Package import | gzip | raw | brotli | Relative gzip |
| --- | ---: | ---: | ---: | ---: |
| classname-variants + twMerge | 8,630 B | 26,995 B | 7,546 B | 0.75x |
| class-variance-authority + twMerge | 8,797 B | 27,517 B | 7,679 B | 0.76x |
| tailwind-variants | 10,660 B | 32,701 B | 9,341 B | 0.92x |
| react-class-variants/core + twMerge | 11,547 B | 36,831 B | 10,164 B | 1x |

### Bundle size: React/styled

| Package import | gzip | raw | brotli | Relative gzip |
| --- | ---: | ---: | ---: | ---: |
| classname-variants/react | 828 B | 1,647 B | 744 B | 0.17x |
| react-class-variants | 4,808 B | 14,828 B | 4,315 B | 1x |
| react-class-variants/react | 4,808 B | 14,827 B | 4,320 B | 1x |

## Retained Memory

### Resolver instances: plain freshComplexConfig

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority | 727.95 B | 0.48x |
| classname-variants | 888.13 B | 0.58x |
| tailwind-variants/lite | 1,088.12 B | 0.72x |
| react-class-variants | 1,521.37 B | 1x |

### Resolver instances: plain freshSimpleConfig

| Library | Value | Relative to react-class-variants |
| --- | ---: | ---: |
| class-variance-authority | 319.7 B | 0.44x |
| classname-variants | 360.79 B | 0.5x |
| tailwind-variants/lite | 705.44 B | 0.98x |
| react-class-variants | 722.52 B | 1x |

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
| classname-variants + twMerge | 456.72 B | 0.63x |
| tailwind-variants | 704.43 B | 0.98x |
| react-class-variants + twMerge | 720.18 B | 1x |
