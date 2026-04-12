function assertNonEmpty(values) {
  if (values.length === 0) {
    throw new Error('Expected at least one benchmark sample.');
  }
}

export function median(values) {
  assertNonEmpty(values);
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);

  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}

export function mean(values) {
  assertNonEmpty(values);
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function sampleStandardDeviation(values) {
  assertNonEmpty(values);
  if (values.length === 1) {
    return 0;
  }

  const average = mean(values);
  const sumOfSquares = values.reduce(
    (total, value) => total + (value - average) ** 2,
    0
  );

  return Math.sqrt(sumOfSquares / (values.length - 1));
}

export function relativeMarginOfErrorPct(values) {
  assertNonEmpty(values);
  if (values.length === 1) {
    return 0;
  }

  const average = mean(values);
  if (average === 0) {
    return 0;
  }

  const standardDeviation = sampleStandardDeviation(values);
  const standardError = standardDeviation / Math.sqrt(values.length);

  return (1.96 * standardError * 100) / average;
}

export function createPerformanceMetric(sampleOpsPerSec) {
  assertNonEmpty(sampleOpsPerSec);

  return {
    maxOpsPerSec: Math.max(...sampleOpsPerSec),
    meanOpsPerSec: mean(sampleOpsPerSec),
    minOpsPerSec: Math.min(...sampleOpsPerSec),
    opsPerSec: median(sampleOpsPerSec),
    relativeMarginOfErrorPct: relativeMarginOfErrorPct(sampleOpsPerSec),
    sampleOpsPerSec: [...sampleOpsPerSec],
    samples: sampleOpsPerSec.length,
    stdDevOpsPerSec: sampleStandardDeviation(sampleOpsPerSec),
  };
}

export function benchmarkOps(
  fn,
  { batchSize = 1, durationMs = 250, samples = 5, warmupMs = 50 } = {}
) {
  const sampleOpsPerSec = [];

  for (let sample = 0; sample < samples; sample += 1) {
    const warmupEnd = performance.now() + warmupMs;
    while (performance.now() < warmupEnd) {
      for (let index = 0; index < batchSize; index += 1) {
        fn();
      }
    }

    let iterations = 0;
    const start = performance.now();
    let elapsedMs = 0;

    do {
      for (let index = 0; index < batchSize; index += 1) {
        fn();
      }
      iterations += batchSize;
      elapsedMs = performance.now() - start;
    } while (elapsedMs < durationMs);

    sampleOpsPerSec.push(iterations / (elapsedMs / 1000));
  }

  return createPerformanceMetric(sampleOpsPerSec);
}
