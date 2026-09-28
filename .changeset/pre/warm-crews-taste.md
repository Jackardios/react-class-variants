---
'react-class-variants': patch
---

Fix package packing and publishing from a clean checkout so the tarball always includes the built `dist/` entrypoints even though `dist/` is gitignored. Packed-export validation now exercises that clean-checkout flow as a standalone check, and the local changeset gate now considers staged, unstaged, and untracked release-affecting files before it decides whether a changeset is required.
