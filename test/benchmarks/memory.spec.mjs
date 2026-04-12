// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  mean,
  median,
  relativeMarginOfErrorPct,
  sampleStandardDeviation,
} from '../../bench/shared/stats.mjs';
import { measureRetainedBytes } from '../../bench/shared/memory.mjs';

const originalGc = globalThis.gc;

afterEach(() => {
  vi.restoreAllMocks();
  if (originalGc) {
    globalThis.gc = originalGc;
    return;
  }

  delete globalThis.gc;
});

describe('benchmark memory helper', () => {
  it('aggregates repeated retained-memory samples with dispersion metrics', () => {
    globalThis.gc = vi.fn();
    const heapSamples = [1000, 1500, 1000, 1000, 1700, 1000, 1000, 1600, 1000];
    vi.spyOn(globalThis.process, 'memoryUsage').mockImplementation(() => {
      const heapUsed = heapSamples.shift();

      return {
        arrayBuffers: 0,
        external: 0,
        heapTotal: 0,
        heapUsed: heapUsed ?? 0,
        rss: 0,
      };
    });

    const metric = measureRetainedBytes(() => ({ value: true }), 10, {
      samples: 3,
      scriptLabel: 'memory-spec',
    });
    const sampleBytesPerInstance = [50, 70, 60];

    expect(metric).toEqual({
      bytesPerInstance: median(sampleBytesPerInstance),
      count: 10,
      maxBytesPerInstance: 70,
      meanBytesPerInstance: mean(sampleBytesPerInstance),
      minBytesPerInstance: 50,
      relativeMarginOfErrorPct: relativeMarginOfErrorPct(
        sampleBytesPerInstance
      ),
      retainedBytes: 600,
      sampleBytesPerInstance,
      sampleRetainedBytes: [500, 700, 600],
      samples: 3,
      stdDevBytesPerInstance: sampleStandardDeviation(sampleBytesPerInstance),
    });
    expect(globalThis.gc).toHaveBeenCalled();
  });
});
