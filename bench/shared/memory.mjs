import {
  mean,
  median,
  relativeMarginOfErrorPct,
  sampleStandardDeviation,
} from './stats.mjs';

export function assertGcAvailable(scriptLabel = 'benchmark') {
  const { gc } = globalThis;
  if (typeof gc !== 'function') {
    throw new Error(
      `${scriptLabel} requires --expose-gc so retained-memory measurements are meaningful.`
    );
  }
  return gc;
}

export function heapUsed(scriptLabel = 'benchmark') {
  const gc = assertGcAvailable(scriptLabel);
  gc();
  gc();
  return process.memoryUsage().heapUsed;
}

/**
 * @param {() => unknown} createValue
 * @param {number} count
 * @param {{ label?: string; samples?: number; scriptLabel?: string }} [options]
 */
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
