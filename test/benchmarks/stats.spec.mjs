// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  createPerformanceMetric,
  mean,
  median,
  relativeMarginOfErrorPct,
  sampleStandardDeviation,
} from '../../bench/shared/stats.mjs';

describe('benchmark stats helper', () => {
  it('keeps median ops/sec as the compatibility field while exposing dispersion', () => {
    const samples = [90, 95, 100, 105, 110];
    const metric = createPerformanceMetric(samples);

    expect(metric).toEqual({
      maxOpsPerSec: 110,
      meanOpsPerSec: 100,
      minOpsPerSec: 90,
      opsPerSec: 100,
      relativeMarginOfErrorPct: relativeMarginOfErrorPct(samples),
      sampleOpsPerSec: samples,
      samples: 5,
      stdDevOpsPerSec: sampleStandardDeviation(samples),
    });
  });

  it('computes the shared descriptive statistics correctly', () => {
    const values = [100, 110, 90, 95, 105];

    expect(median(values)).toBe(100);
    expect(mean(values)).toBe(100);
    expect(sampleStandardDeviation(values)).toBeCloseTo(7.9056941504, 8);
    expect(relativeMarginOfErrorPct(values)).toBeCloseTo(6.9296464556, 8);
  });
});
