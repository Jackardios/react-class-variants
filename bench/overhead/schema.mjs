export const bundleProfileNames = [
  'recipeOnly',
  'slottedRecipe',
  'tailwindAwareRecipe',
  'component',
  'componentWithRender',
];

export const typescriptProfileNames = [
  'bundlerRootOnlyMinimal',
  'bundlerRootOnly',
  'bundlerReactSurfaceMinimal',
  'bundlerReactSurface',
  'bundlerSlottedRecipeMinimal',
  'bundlerSlottedRecipe',
  'nodeNextReactSurfaceMinimal',
  'nodeNextReactSurface',
];

export function normalizeOverheadReport(report) {
  return {
    ...report,
    bundles: Object.fromEntries(
      bundleProfileNames.map(name => [name, report.bundles?.[name] ?? null])
    ),
    typescript:
      report.typescript == null
        ? null
        : {
            profiles: Object.fromEntries(
              typescriptProfileNames.map(name => [
                name,
                report.typescript?.profiles?.[name] ?? null,
              ])
            ),
          },
  };
}

export function createOverheadSnapshot({ generatedAt, report }) {
  return {
    generatedAt,
    report: normalizeOverheadReport(report),
  };
}
