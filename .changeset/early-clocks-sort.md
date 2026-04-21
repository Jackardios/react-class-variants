---
'react-class-variants': patch
---

Harden release automation so publish remains rerunnable and GitHub release/changelog validation happens before npm publication, while npm dist-tag repair now reflects npm's current trusted-publishing limits instead of assuming OIDC can mutate tags.

The release workflow now also validates GitHub release/changelog readiness before publish, recovers safely on reruns after partial publish success, and catches malformed `.changeset/*.md` files during normal changeset coverage checks instead of at release time.

It also waits through short npm registry propagation delays before deciding that a freshly published version or dist-tag update is still missing.

The post-publish reconciliation path is now simpler too: the workflow runs npm dist-tag reporting and GitHub Release sync as separate steps. In OIDC-only runs, any required `npm dist-tag add ...` commands are logged for manual follow-up instead of failing the publish.

Release tooling is also covered by ESLint now, which caught and prevents a latent dist-tag update bug in the non-no-op npm mutation path.
