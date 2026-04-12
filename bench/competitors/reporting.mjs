import { formatBytes, formatNumber } from '../shared/file-size.mjs';
import { getBaselineLabel } from './tasks.mjs';

function relativeRatio(value, baselineValue) {
  return baselineValue === 0
    ? 'n/a'
    : `${formatNumber(value / baselineValue)}x`;
}

function createPerformanceTable(
  title,
  metrics,
  baselineLabel,
  sortDirection = 'desc'
) {
  const baselineValue = metrics[baselineLabel]?.opsPerSec ?? 0;
  const rows = Object.entries(metrics).sort((left, right) => {
    const leftValue = left[1].opsPerSec;
    const rightValue = right[1].opsPerSec;
    return sortDirection === 'asc'
      ? leftValue - rightValue
      : rightValue - leftValue;
  });

  return [
    `### ${title}`,
    '',
    '| Library | Median ops/sec | RME | Relative to baseline |',
    '| --- | ---: | ---: | ---: |',
    ...rows.map(([label, metric]) => {
      const rme = `${formatNumber(metric.relativeMarginOfErrorPct)}%`;
      return `| ${label} | ${formatNumber(
        metric.opsPerSec
      )} | ${rme} | ${relativeRatio(metric.opsPerSec, baselineValue)} |`;
    }),
    '',
  ].join('\n');
}

function createMemoryTable(title, metrics, baselineLabel) {
  const baselineValue = metrics[baselineLabel]?.bytesPerInstance ?? 0;
  const rows = Object.entries(metrics).sort(
    (left, right) => left[1].bytesPerInstance - right[1].bytesPerInstance
  );

  return [
    `### ${title}`,
    '',
    '| Library | Median bytes/instance | RME | Relative to baseline |',
    '| --- | ---: | ---: | ---: |',
    ...rows.map(([label, metric]) => {
      const rme =
        metric.relativeMarginOfErrorPct == null
          ? 'n/a'
          : `${formatNumber(metric.relativeMarginOfErrorPct)}%`;
      return `| ${label} | ${formatBytes(
        metric.bytesPerInstance
      )} | ${rme} | ${relativeRatio(metric.bytesPerInstance, baselineValue)} |`;
    }),
    '',
  ].join('\n');
}

function createBundleSizeTable(title, results, baselineLabel) {
  const baselineValue = results[baselineLabel]?.gzipBytes ?? 0;
  const rows = Object.entries(results).sort(
    (left, right) => left[1].gzipBytes - right[1].gzipBytes
  );

  return [
    `### ${title}`,
    '',
    '| Minimal synthetic consumer | gzip | raw | brotli | Relative gzip |',
    '| --- | ---: | ---: | ---: | ---: |',
    ...rows.map(([label, metric]) => {
      return `| ${label} | ${formatBytes(metric.gzipBytes)} | ${formatBytes(
        metric.rawBytes
      )} | ${formatBytes(metric.brotliBytes)} | ${relativeRatio(
        metric.gzipBytes,
        baselineValue
      )} |`;
    }),
    '',
  ].join('\n');
}

export function renderMarkdown(report) {
  const sections = [
    '# Competitive Benchmarks',
    '',
    'This report compares `react-class-variants` against `class-variance-authority`, `classname-variants`, and `tailwind-variants` on root-only common-denominator scenarios.',
    '',
    '- All numbers are collected with `NODE_ENV=production`.',
    '- `resolver-only` uses plain resolvers; `tailwind-variants/lite` is used there to isolate raw resolver cost from built-in merge work.',
    '- `tailwind-aware` compares `react-class-variants + twMerge`, wrapper-based `twMerge` integrations for CVA / classname-variants, and full `tailwind-variants`.',
    '- Primary creation throughput uses `fresh unique complex config` so it reflects first-time compile cost.',
    '- `reused complex config` remains as a diagnostic appendix for same-object config reuse versus fresh config object setup cost.',
    '- Memory numbers are median retained bytes per created resolver instance across repeated forced-GC samples with fresh unique config objects.',
    '- Bundle size numbers are minimal synthetic consumer bundles built with esbuild, with explicit production defines and React marked external when relevant.',
    '- Ratios near `1.0x` should be interpreted together with `RME`; near-parity results are not strong claims without stability headroom.',
    '',
    `Generated at: ${report.generatedAt}`,
    `Node: ${report.environment.node}`,
    `Mode: ${report.environment.mode}`,
    `Platform: ${report.environment.platform}`,
    '',
    '## Runtime',
    '',
  ];

  for (const [track, scenarios] of Object.entries(report.runtime)) {
    const baselineLabel = getBaselineLabel(track);
    const trackTitle =
      track === 'tailwindAware' ? 'Tailwind-aware' : 'Resolver only';

    for (const [scenario, metrics] of Object.entries(scenarios)) {
      sections.push(
        createPerformanceTable(
          `${trackTitle}: ${scenario}`,
          metrics,
          baselineLabel
        )
      );
    }
  }

  sections.push(
    createPerformanceTable(
      'Resolver creation: plain (fresh unique complex config)',
      report.creation.plain.freshComplexConfig,
      getBaselineLabel('plain')
    )
  );
  sections.push(
    createPerformanceTable(
      'Resolver creation: plain (diagnostic reused complex config)',
      report.creation.plain.reusedComplexConfig,
      getBaselineLabel('plain')
    )
  );
  sections.push(
    createPerformanceTable(
      'Resolver creation: tailwind-aware (fresh unique complex config)',
      report.creation.tailwindAware.freshComplexConfig,
      getBaselineLabel('tailwindAware')
    )
  );
  sections.push(
    createPerformanceTable(
      'Resolver creation: tailwind-aware (diagnostic reused complex config)',
      report.creation.tailwindAware.reusedComplexConfig,
      getBaselineLabel('tailwindAware')
    )
  );

  sections.push('## Bundle Size', '');
  sections.push(
    createBundleSizeTable(
      'Minimal synthetic consumer bundle size: plain recipe',
      report.bundles.plainRecipe,
      'react-class-variants/core'
    )
  );
  sections.push(
    createBundleSizeTable(
      'Minimal synthetic consumer bundle size: tailwind-aware recipe',
      report.bundles.tailwindAwareRecipe,
      'react-class-variants/core + twMerge'
    )
  );
  sections.push(
    createBundleSizeTable(
      'Minimal synthetic consumer bundle size: React/styled',
      report.bundles.reactStyled,
      'react-class-variants'
    )
  );

  sections.push('## Retained Memory', '');
  for (const [track, scenarios] of Object.entries(report.memory)) {
    const baselineLabel = getBaselineLabel(track);
    const trackTitle = track === 'tailwindAware' ? 'tailwind-aware' : 'plain';

    for (const [scenario, metrics] of Object.entries(scenarios)) {
      sections.push(
        createMemoryTable(
          `Resolver instances: ${trackTitle} ${scenario}`,
          metrics,
          baselineLabel
        )
      );
    }
  }

  return sections.join('\n');
}
