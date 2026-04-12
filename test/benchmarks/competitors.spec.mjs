import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { runWorkerTaskSubprocess } from '../../bench/competitors/report.mjs';
import { renderMarkdown } from '../../bench/competitors/reporting.mjs';
import {
  aggregateWorkerResults,
  createWorkerTasks,
} from '../../bench/competitors/tasks.mjs';
import { createTempDir, removeTempDir } from '../../bench/shared/fs.mjs';
import { createPerformanceMetric } from '../../bench/shared/stats.mjs';

function metric(samples) {
  return createPerformanceMetric(samples);
}

function groupTasks(tasks) {
  const groups = new Map();

  for (const task of tasks) {
    const key = [task.section, task.track, task.scenario].join(':');
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(task);
  }

  return groups;
}

describe('competitor benchmark reporting', () => {
  it('creates deterministic isolated worker tasks for all benchmark sections', () => {
    const tasks = createWorkerTasks('production');
    const repeatedTasks = createWorkerTasks('production');
    const groupedTasks = groupTasks(tasks);

    expect(tasks).toHaveLength(72);
    expect(tasks).toEqual(repeatedTasks);
    expect(
      new Set(
        tasks.map(task =>
          [
            task.section,
            task.track,
            task.scenario,
            task.library,
            task.nodeEnv,
          ].join(':')
        )
      ).size
    ).toBe(tasks.length);
    expect(
      new Set(
        [...groupedTasks.values()]
          .map(group => group[0]?.library)
          .filter(Boolean)
      ).size
    ).toBeGreaterThan(1);
    expect(
      new Set(
        groupedTasks
          .get('runtime:plain:complexExplicit')
          .map(task => task.library)
      )
    ).toEqual(
      new Set([
        'react-class-variants',
        'class-variance-authority',
        'classname-variants',
        'tailwind-variants/lite',
      ])
    );
  });

  it('aggregates worker payloads into the report schema', () => {
    const report = aggregateWorkerResults([
      {
        library: 'react-class-variants',
        metric: metric([100, 102, 104, 106, 108]),
        nodeEnv: 'production',
        scenario: 'simpleDefaults',
        section: 'runtime',
        track: 'plain',
      },
      {
        library: 'react-class-variants',
        metric: metric([50, 52, 54, 56, 58]),
        nodeEnv: 'production',
        scenario: 'freshComplexConfig',
        section: 'creation',
        track: 'plain',
      },
      {
        library: 'react-class-variants',
        metric: { bytesPerInstance: 32, count: 1000, retainedBytes: 32000 },
        nodeEnv: 'production',
        scenario: 'freshSimpleConfig',
        section: 'memory',
        track: 'plain',
      },
    ]);

    expect(
      report.runtime.plain.simpleDefaults['react-class-variants'].opsPerSec
    ).toBe(104);
    expect(
      report.creation.plain.freshComplexConfig['react-class-variants']
        .sampleOpsPerSec
    ).toEqual([50, 52, 54, 56, 58]);
    expect(
      report.memory.plain.freshSimpleConfig['react-class-variants']
        .bytesPerInstance
    ).toBe(32);
  });

  it('spawns a worker subprocess and parses the JSON payload', () => {
    const workerDir = createTempDir('react-class-variants-worker-test-');
    const workerScript = join(workerDir, 'worker.mjs');

    try {
      writeFileSync(
        workerScript,
        `const task = {};
for (let index = 0; index < process.argv.length; index += 1) {
  const token = process.argv[index];
  if (!token.startsWith('--')) continue;
  task[token.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = process.argv[index + 1];
}
task.pid = process.pid;
process.stdout.write(JSON.stringify(task));
`
      );

      const result = runWorkerTaskSubprocess(
        {
          library: 'react-class-variants',
          nodeEnv: 'production',
          scenario: 'simpleDefaults',
          section: 'runtime',
          track: 'plain',
        },
        {
          cwd: workerDir,
          workerScript,
        }
      );

      expect(result.library).toBe('react-class-variants');
      expect(result.nodeEnv).toBe('production');
      expect(result.scenario).toBe('simpleDefaults');
      expect(result.section).toBe('runtime');
      expect(result.track).toBe('plain');
      expect(result.pid).toEqual(expect.any(Number));
    } finally {
      removeTempDir(workerDir);
    }
  });

  it('renders markdown with RME and synthetic bundle labeling', () => {
    const report = {
      bundles: {
        plainRecipe: {
          'class-variance-authority': {
            brotliBytes: 410,
            gzipBytes: 470,
            rawBytes: 900,
          },
          'react-class-variants/core': {
            brotliBytes: 360,
            gzipBytes: 420,
            rawBytes: 820,
          },
        },
        reactStyled: {
          'classname-variants/react': {
            brotliBytes: 520,
            gzipBytes: 590,
            rawBytes: 1100,
          },
          'react-class-variants': {
            brotliBytes: 500,
            gzipBytes: 560,
            rawBytes: 1050,
          },
        },
        tailwindAwareRecipe: {
          'class-variance-authority + twMerge': {
            brotliBytes: 580,
            gzipBytes: 640,
            rawBytes: 1240,
          },
          'react-class-variants/core + twMerge': {
            brotliBytes: 540,
            gzipBytes: 600,
            rawBytes: 1170,
          },
          'tailwind-variants': {
            brotliBytes: 560,
            gzipBytes: 620,
            rawBytes: 1200,
          },
        },
      },
      creation: {
        plain: {
          freshComplexConfig: {
            'class-variance-authority': metric([80, 82, 84, 86, 88]),
            'react-class-variants': metric([100, 102, 104, 106, 108]),
          },
          reusedComplexConfig: {
            'class-variance-authority': metric([120, 122, 124, 126, 128]),
            'react-class-variants': metric([140, 142, 144, 146, 148]),
          },
        },
        tailwindAware: {
          freshComplexConfig: {
            'class-variance-authority + twMerge': metric([70, 72, 74, 76, 78]),
            'react-class-variants + twMerge': metric([90, 92, 94, 96, 98]),
            'tailwind-variants': metric([75, 77, 79, 81, 83]),
          },
          reusedComplexConfig: {
            'class-variance-authority + twMerge': metric([
              110, 112, 114, 116, 118,
            ]),
            'react-class-variants + twMerge': metric([130, 132, 134, 136, 138]),
            'tailwind-variants': metric([105, 107, 109, 111, 113]),
          },
        },
      },
      environment: {
        mode: 'production',
        node: 'v20.0.0',
        platform: 'darwin arm64',
      },
      generatedAt: '2026-04-11T12:00:00.000Z',
      memory: {
        plain: {
          freshComplexConfig: {
            'class-variance-authority': {
              bytesPerInstance: 44,
              count: 1000,
              retainedBytes: 44000,
            },
            'react-class-variants': {
              bytesPerInstance: 40,
              count: 1000,
              retainedBytes: 40000,
            },
          },
          freshSimpleConfig: {
            'class-variance-authority': {
              bytesPerInstance: 24,
              count: 1000,
              retainedBytes: 24000,
            },
            'react-class-variants': {
              bytesPerInstance: 20,
              count: 1000,
              retainedBytes: 20000,
            },
          },
        },
        tailwindAware: {
          freshComplexConfig: {
            'class-variance-authority + twMerge': {
              bytesPerInstance: 64,
              count: 1000,
              retainedBytes: 64000,
            },
            'react-class-variants + twMerge': {
              bytesPerInstance: 56,
              count: 1000,
              retainedBytes: 56000,
            },
            'tailwind-variants': {
              bytesPerInstance: 60,
              count: 1000,
              retainedBytes: 60000,
            },
          },
          freshSimpleConfig: {
            'class-variance-authority + twMerge': {
              bytesPerInstance: 34,
              count: 1000,
              retainedBytes: 34000,
            },
            'react-class-variants + twMerge': {
              bytesPerInstance: 30,
              count: 1000,
              retainedBytes: 30000,
            },
            'tailwind-variants': {
              bytesPerInstance: 32,
              count: 1000,
              retainedBytes: 32000,
            },
          },
        },
      },
      runtime: {
        plain: {
          complexExplicit: {
            'class-variance-authority': metric([90, 92, 94, 96, 98]),
            'react-class-variants': metric([110, 112, 114, 116, 118]),
          },
          complexNoCompound: {
            'class-variance-authority': metric([100, 102, 104, 106, 108]),
            'react-class-variants': metric([120, 122, 124, 126, 128]),
          },
          complexWithCompound: {
            'class-variance-authority': metric([95, 97, 99, 101, 103]),
            'react-class-variants': metric([115, 117, 119, 121, 123]),
          },
          simpleDefaults: {
            'class-variance-authority': metric([140, 142, 144, 146, 148]),
            'react-class-variants': metric([160, 162, 164, 166, 168]),
          },
          simpleExplicit: {
            'class-variance-authority': metric([130, 132, 134, 136, 138]),
            'react-class-variants': metric([150, 152, 154, 156, 158]),
          },
        },
        tailwindAware: {
          complexExplicit: {
            'class-variance-authority + twMerge': metric([70, 72, 74, 76, 78]),
            'react-class-variants + twMerge': metric([90, 92, 94, 96, 98]),
            'tailwind-variants': metric([72, 74, 76, 78, 80]),
          },
          complexNoCompound: {
            'class-variance-authority + twMerge': metric([80, 82, 84, 86, 88]),
            'react-class-variants + twMerge': metric([100, 102, 104, 106, 108]),
            'tailwind-variants': metric([82, 84, 86, 88, 90]),
          },
          complexWithCompound: {
            'class-variance-authority + twMerge': metric([75, 77, 79, 81, 83]),
            'react-class-variants + twMerge': metric([95, 97, 99, 101, 103]),
            'tailwind-variants': metric([78, 80, 82, 84, 86]),
          },
          simpleDefaults: {
            'class-variance-authority + twMerge': metric([
              120, 122, 124, 126, 128,
            ]),
            'react-class-variants + twMerge': metric([140, 142, 144, 146, 148]),
            'tailwind-variants': metric([124, 126, 128, 130, 132]),
          },
          simpleExplicit: {
            'class-variance-authority + twMerge': metric([
              110, 112, 114, 116, 118,
            ]),
            'react-class-variants + twMerge': metric([130, 132, 134, 136, 138]),
            'tailwind-variants': metric([114, 116, 118, 120, 122]),
          },
        },
      },
    };

    const markdown = renderMarkdown(report);

    expect(markdown).toContain(
      '| Library | Median ops/sec | RME | Relative to baseline |'
    );
    expect(markdown).toContain(
      'Minimal synthetic consumer bundle size: plain recipe'
    );
    expect(markdown).toContain(
      'Ratios near `1.0x` should be interpreted together with `RME`'
    );
    expect(markdown.indexOf('| react-class-variants | 164 |')).toBeLessThan(
      markdown.indexOf('| class-variance-authority | 144 |')
    );
  });
});
