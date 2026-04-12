import {
  competitorCreationScenarios,
  competitorLibraryLabelsByTrack,
  competitorMemoryScenarios,
  competitorRuntimeScenarios,
} from '../fixtures/competitors.mjs';
import { createEmptyCompetitorMeasurements } from './schema.mjs';

export const runtimeScenarios = competitorRuntimeScenarios;
export const libraryLabelsByTrack = competitorLibraryLabelsByTrack;
export const creationScenarios = competitorCreationScenarios;
export const memoryScenarios = competitorMemoryScenarios;

export function getBaselineLabel(track) {
  return track === 'tailwindAware'
    ? 'react-class-variants + twMerge'
    : 'react-class-variants';
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function rotateLibraries(libraries, seed) {
  if (libraries.length < 2) {
    return [...libraries];
  }

  const offset = hashString(seed) % libraries.length;
  return libraries.map(
    (_, index) => libraries[(index + offset) % libraries.length]
  );
}

export function createWorkerTasks(nodeEnv = 'production') {
  const tasks = [];

  for (const track of Object.keys(libraryLabelsByTrack)) {
    for (const scenario of Object.keys(runtimeScenarios)) {
      const libraries = rotateLibraries(
        libraryLabelsByTrack[track],
        `${nodeEnv}:runtime:${track}:${scenario}`
      );

      for (const library of libraries) {
        tasks.push({
          library,
          nodeEnv,
          scenario,
          section: 'runtime',
          track,
        });
      }
    }

    for (const scenario of creationScenarios) {
      const libraries = rotateLibraries(
        libraryLabelsByTrack[track],
        `${nodeEnv}:creation:${track}:${scenario}`
      );

      for (const library of libraries) {
        tasks.push({
          library,
          nodeEnv,
          scenario,
          section: 'creation',
          track,
        });
      }
    }

    for (const scenario of memoryScenarios) {
      const libraries = rotateLibraries(
        libraryLabelsByTrack[track],
        `${nodeEnv}:memory:${track}:${scenario}`
      );

      for (const library of libraries) {
        tasks.push({
          library,
          nodeEnv,
          scenario,
          section: 'memory',
          track,
        });
      }
    }
  }

  return tasks;
}

export function aggregateWorkerResults(taskResults) {
  const report = createEmptyCompetitorMeasurements();

  for (const task of taskResults) {
    if (task.section === 'runtime') {
      if (!report.runtime[task.track][task.scenario]) {
        report.runtime[task.track][task.scenario] = {};
      }
      report.runtime[task.track][task.scenario][task.library] = task.metric;
      continue;
    }

    report[task.section][task.track][task.scenario][task.library] = task.metric;
  }

  return report;
}
