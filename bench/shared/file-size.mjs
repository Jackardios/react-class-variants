import { readFileSync } from 'node:fs';
import {
  brotliCompressSync,
  constants as zlibConstants,
  gzipSync,
} from 'node:zlib';

export function measureFile(filePath) {
  const buffer = readFileSync(filePath);
  return {
    brotliBytes: brotliCompressSync(buffer, {
      params: {
        [zlibConstants.BROTLI_PARAM_QUALITY]: 11,
      },
    }).byteLength,
    gzipBytes: gzipSync(buffer).byteLength,
    rawBytes: buffer.byteLength,
  };
}

export function formatNumber(value) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatBytes(value) {
  return `${formatNumber(value)} B`;
}
