import {
  competitorCreationScenarios,
  competitorMemoryScenarios,
  competitorRuntimeScenarios,
} from '../fixtures/competitors.mjs';

function createScenarioBuckets(scenarios) {
  return Object.fromEntries(scenarios.map(scenario => [scenario, {}]));
}

export function createEmptyCompetitorMeasurements() {
  return {
    creation: {
      plain: createScenarioBuckets(competitorCreationScenarios),
      tailwindAware: createScenarioBuckets(competitorCreationScenarios),
    },
    memory: {
      plain: createScenarioBuckets(competitorMemoryScenarios),
      tailwindAware: createScenarioBuckets(competitorMemoryScenarios),
    },
    runtime: {
      plain: createScenarioBuckets(Object.keys(competitorRuntimeScenarios)),
      tailwindAware: createScenarioBuckets(
        Object.keys(competitorRuntimeScenarios)
      ),
    },
  };
}

export function createCompetitorReport({
  bundles,
  creation,
  environment,
  generatedAt,
  memory,
  runtime,
}) {
  return {
    bundles,
    creation,
    environment,
    generatedAt,
    memory,
    runtime,
  };
}
