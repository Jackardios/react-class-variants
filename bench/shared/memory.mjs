import {
  mean,
  median,
  relativeMarginOfErrorPct,
  sampleStandardDeviation,
} from './stats.mjs';

export function assertGcAvailable(scriptLabel = 'benchmark') {
  if (typeof global.gc !== 'function') {
    throw new Error(
      `${scriptLabel} requires --expose-gc so retained-memory measurements are meaningful.`
    );
  }
}

export function heapUsed(scriptLabel = 'benchmark') {
  assertGcAvailable(scriptLabel);
  global.gc();
  global.gc();
  return process.memoryUsage().heapUsed;
}

export function measureRetainedBytes(
  createValue,
  count,
  { label, samples = 5, scriptLabel = 'benchmark' } = {}
) {
  const sampleBytesPerInstance = [];
  const sampleRetainedBytes = [];

  for (let sampleIndex = 0; sampleIndex < samples; sampleIndex += 1) {
    const before = heapUsed(scriptLabel);
    const values = [];

    for (let index = 0; index < count; index += 1) {
      values.push(createValue());
    }

    const after = heapUsed(scriptLabel);
    const retainedBytes = after - before;

    sampleBytesPerInstance.push(retainedBytes / count);
    sampleRetainedBytes.push(retainedBytes);

    values.length = 0;
    heapUsed(scriptLabel);
  }

  return {
    bytesPerInstance: median(sampleBytesPerInstance),
    count,
    maxBytesPerInstance: Math.max(...sampleBytesPerInstance),
    meanBytesPerInstance: mean(sampleBytesPerInstance),
    minBytesPerInstance: Math.min(...sampleBytesPerInstance),
    relativeMarginOfErrorPct: relativeMarginOfErrorPct(sampleBytesPerInstance),
    ...(label ? { sample: label } : {}),
    retainedBytes: median(sampleRetainedBytes),
    sampleBytesPerInstance: [...sampleBytesPerInstance],
    sampleRetainedBytes: [...sampleRetainedBytes],
    samples: sampleBytesPerInstance.length,
    stdDevBytesPerInstance: sampleStandardDeviation(sampleBytesPerInstance),
  };
}
