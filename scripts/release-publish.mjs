import {
  buildReleaseTag,
  git,
  gitMaybe,
  isMainModule,
  npmView,
  pollUntil,
  readPackageJson,
  runInherited,
} from './release-shared.mjs';

// npm keeps no commit provenance for pnpm publishes, so the local release tag
// and the first-parent version bump are the only links between HEAD and an
// already published version.
export function planReleasePublish({
  headSha,
  headIntroducesVersion,
  localTagTarget,
  tag,
  versionPublished,
}) {
  if (!versionPublished && localTagTarget && localTagTarget !== headSha) {
    throw new Error(
      `Release tag ${tag} already exists at ${localTagTarget}, but HEAD is ${headSha}. Refusing to retag a different commit.`
    );
  }

  if (!versionPublished) {
    return { mode: 'publish', publishedCommitHint: null };
  }

  if (localTagTarget === headSha) {
    return { mode: 'reconcile-current-head', publishedCommitHint: headSha };
  }

  if (localTagTarget) {
    return {
      mode: 'already-published-elsewhere',
      publishedCommitHint: localTagTarget,
    };
  }

  if (headIntroducesVersion) {
    return { mode: 'restore-missing-tag', publishedCommitHint: headSha };
  }

  return { mode: 'already-published-elsewhere', publishedCommitHint: null };
}

export function doesFirstParentIntroduceVersion(parentVersion, version) {
  if (parentVersion === null) {
    return true;
  }

  return parentVersion !== version;
}

async function finalizePublishedRelease({
  headSha,
  mode,
  packageName,
  tag,
  version,
}) {
  if (mode === 'publish' || mode === 'restore-missing-tag') {
    const tagStatus = await ensureLocalTagAtHead(tag, headSha);

    if (tagStatus === 'created') {
      console.log(`Created local release tag ${tag} at ${headSha}.`);
    } else {
      console.log(`Release tag ${tag} already points at ${headSha}.`);
    }
  } else if (mode === 'reconcile-current-head') {
    console.log(`Release tag ${tag} already points at ${headSha}.`);
  }

  // The registry can lag behind a fresh publish, so poll before failing.
  const publishedVersion = await pollUntil(
    () => npmView(`${packageName}@${version}`, 'version'),
    value => value === version
  );

  if (publishedVersion !== version) {
    throw new Error(
      `Expected ${packageName}@${version} to be published, but npm returned ${
        publishedVersion ?? 'nothing'
      }.`
    );
  }
}

async function ensureLocalTagAtHead(tag, headSha) {
  const currentTarget = await gitMaybe(['rev-parse', '--verify', `${tag}^{}`]);

  if (!currentTarget) {
    await git(['tag', tag, headSha]);
    return 'created';
  }

  if (currentTarget !== headSha) {
    throw new Error(
      `Release tag ${tag} resolves to ${currentTarget}, but HEAD is ${headSha}.`
    );
  }

  return 'existing';
}

async function firstParentVersion() {
  const firstParent = await gitMaybe(['rev-parse', '--verify', 'HEAD^1']);

  if (!firstParent) {
    return null;
  }

  try {
    const packageJson = await git(['show', `${firstParent}:package.json`]);
    return JSON.parse(packageJson).version ?? null;
  } catch {
    return null;
  }
}

async function headIntroducesVersion(version) {
  const parentVersion = await firstParentVersion();

  return doesFirstParentIntroduceVersion(parentVersion, version);
}

export async function publishRelease() {
  const packageJson = await readPackageJson(import.meta.url);
  const packageName = process.env.RELEASE_PACKAGE_NAME ?? packageJson.name;
  const version = process.env.RELEASE_VERSION ?? packageJson.version;
  const tag = buildReleaseTag(version);
  const headSha = await git(['rev-parse', 'HEAD']);
  const localTagTarget = await gitMaybe(['rev-parse', '--verify', `${tag}^{}`]);
  // One read is enough: if registry lag hides an earlier publish, npm rejects
  // the duplicate `changeset publish` and a rerun reconciles the release.
  const versionPublished =
    (await npmView(`${packageName}@${version}`, 'version')) === version;
  const currentHeadIntroducesVersion = await headIntroducesVersion(version);
  const plan = planReleasePublish({
    headSha,
    headIntroducesVersion: currentHeadIntroducesVersion,
    localTagTarget,
    tag,
    versionPublished,
  });

  if (plan.mode === 'publish') {
    console.log(`Publishing ${packageName}@${version} via changeset publish.`);
    await runInherited('pnpm', ['exec', 'changeset', 'publish']);
  } else if (plan.mode === 'already-published-elsewhere') {
    console.log(
      `Skipping publish because ${packageName}@${version} is already released${
        plan.publishedCommitHint ? ` on commit ${plan.publishedCommitHint}` : ''
      }, while HEAD is ${headSha}.`
    );
    return;
  } else {
    console.log(
      `Skipping npm publish because ${packageName}@${version} is already on the registry.`
    );
  }

  await finalizePublishedRelease({
    headSha,
    mode: plan.mode,
    packageName,
    tag,
    version,
  });
}

if (isMainModule(import.meta.url)) {
  await publishRelease();
}
