---
'react-class-variants': patch
---

Export `react-class-variants/package.json`, so tools that read a package's manifest (`require.resolve('react-class-variants/package.json')`) no longer fail with `ERR_PACKAGE_PATH_NOT_EXPORTED`.
