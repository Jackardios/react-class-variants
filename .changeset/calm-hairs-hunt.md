## "react-class-variants": patch

Relax the `render` prop callback typing back to a broad, spread-safe DOM prop bag.
The callback now exposes generic HTML attributes plus any `forwardProps` variants,
instead of implying intrinsic-element-specific resolved props as part of the
stable public contract.
