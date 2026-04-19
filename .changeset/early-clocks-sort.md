---
'react-class-variants': patch
---

Harden release automation so npm dist-tag validation happens before publish and GitHub Actions can synchronize dist-tags with npm's OIDC exchange flow instead of relying on a long-lived repository token.

The release workflow now also validates GitHub release/changelog readiness before publish, recovers safely on reruns after partial publish success, and catches malformed `.changeset/*.md` files during normal changeset coverage checks instead of at release time.

It also waits through short npm registry propagation delays before deciding that a freshly published version or dist-tag update is still missing.

The post-publish reconciliation path is now simpler too: the workflow runs npm dist-tag sync and GitHub Release sync as separate steps and applies the final failure gate afterward.
