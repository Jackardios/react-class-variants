---
'react-class-variants': patch
---

Mark the duplicate type aliases as deprecated: `ClassValue` (use `ClassNameValue`), `Recipe` (use `AnyRecipe`), and `AnyElementType` (use React's `ElementType`). They remain exported, so existing code keeps compiling, and editors now point to the canonical names.
