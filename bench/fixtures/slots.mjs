export const simpleSlotConfig = {
  slots: {
    root: 'inline-flex items-center gap-2 rounded-md',
    label: 'font-medium',
    icon: 'size-4',
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue-600 text-white',
        label: 'text-white',
        icon: 'text-blue-100',
      },
      secondary: {
        root: 'bg-slate-200 text-slate-950',
        label: 'text-slate-950',
        icon: 'text-slate-500',
      },
    },
    size: {
      sm: {
        root: 'h-8 px-3',
        label: 'text-sm',
        icon: 'size-3.5',
      },
      md: {
        root: 'h-10 px-4',
        label: 'text-base',
        icon: 'size-4',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
    size: 'md',
  },
};

export const complexSlotConfig = {
  slots: {
    root: 'inline-flex items-center justify-center gap-2 rounded-md',
    label: ['font-medium', 'leading-none'],
    icon: 'shrink-0',
    badge: null,
  },
  variants: {
    tone: {
      primary: {
        root: 'bg-blue-600 text-white',
        label: ['text-white', 'uppercase'],
        icon: 'text-blue-100',
        badge: null,
      },
      secondary: {
        root: ['bg-slate-200', 'text-slate-950'],
        label: 'text-slate-900',
        icon: 'text-slate-500',
        badge: 'bg-slate-50 text-slate-700',
      },
      danger: {
        root: 'bg-rose-600 text-white',
        label: 'text-white',
        icon: 'text-rose-100',
        badge: 'bg-rose-100 text-rose-700',
      },
    },
    size: {
      sm: {
        root: 'h-8 px-3',
        label: 'text-sm',
        icon: 'size-3.5',
        badge: 'text-[10px]',
      },
      md: {
        root: 'h-10 px-4',
        label: 'text-base',
        icon: 'size-4',
        badge: 'text-xs',
      },
      lg: {
        root: 'h-12 px-5',
        label: 'text-lg',
        icon: 'size-5',
        badge: 'text-sm',
      },
    },
    emphasis: {
      quiet: {
        root: 'shadow-sm',
        label: null,
        icon: 'opacity-80',
        badge: ['hidden'],
      },
      loud: {
        root: 'ring-2 ring-offset-2',
        label: ['tracking-wide'],
        icon: 'opacity-100',
        badge: 'inline-flex',
      },
    },
    disabled: {
      true: {
        root: 'opacity-50 pointer-events-none',
        label: '',
        icon: '',
        badge: 'opacity-50',
      },
      false: {
        root: '',
        label: '',
        icon: '',
        badge: '',
      },
    },
  },
  defaultVariants: {
    tone: 'primary',
    size: 'md',
    emphasis: 'quiet',
    disabled: false,
  },
};

export function makeSimpleSlotConfig() {
  return {
    slots: {
      ...simpleSlotConfig.slots,
    },
    variants: {
      tone: {
        primary: { ...simpleSlotConfig.variants.tone.primary },
        secondary: { ...simpleSlotConfig.variants.tone.secondary },
      },
      size: {
        sm: { ...simpleSlotConfig.variants.size.sm },
        md: { ...simpleSlotConfig.variants.size.md },
      },
    },
    defaultVariants: {
      ...simpleSlotConfig.defaultVariants,
    },
  };
}

export function makeComplexSlotConfig() {
  return {
    slots: {
      badge: complexSlotConfig.slots.badge,
      icon: complexSlotConfig.slots.icon,
      label: [...complexSlotConfig.slots.label],
      root: complexSlotConfig.slots.root,
    },
    variants: {
      tone: {
        primary: {
          badge: complexSlotConfig.variants.tone.primary.badge,
          icon: complexSlotConfig.variants.tone.primary.icon,
          label: [...complexSlotConfig.variants.tone.primary.label],
          root: complexSlotConfig.variants.tone.primary.root,
        },
        secondary: {
          badge: complexSlotConfig.variants.tone.secondary.badge,
          icon: complexSlotConfig.variants.tone.secondary.icon,
          label: complexSlotConfig.variants.tone.secondary.label,
          root: [...complexSlotConfig.variants.tone.secondary.root],
        },
        danger: { ...complexSlotConfig.variants.tone.danger },
      },
      size: {
        sm: { ...complexSlotConfig.variants.size.sm },
        md: { ...complexSlotConfig.variants.size.md },
        lg: { ...complexSlotConfig.variants.size.lg },
      },
      emphasis: {
        quiet: {
          badge: [...complexSlotConfig.variants.emphasis.quiet.badge],
          icon: complexSlotConfig.variants.emphasis.quiet.icon,
          label: complexSlotConfig.variants.emphasis.quiet.label,
          root: complexSlotConfig.variants.emphasis.quiet.root,
        },
        loud: {
          badge: complexSlotConfig.variants.emphasis.loud.badge,
          icon: complexSlotConfig.variants.emphasis.loud.icon,
          label: [...complexSlotConfig.variants.emphasis.loud.label],
          root: complexSlotConfig.variants.emphasis.loud.root,
        },
      },
      disabled: {
        true: { ...complexSlotConfig.variants.disabled.true },
        false: { ...complexSlotConfig.variants.disabled.false },
      },
    },
    defaultVariants: {
      ...complexSlotConfig.defaultVariants,
    },
  };
}

export const slotScenarioInputs = {
  complex: {
    disabled: true,
    emphasis: 'loud',
    size: 'lg',
    tone: 'danger',
  },
  rootClassNameComplex: {
    className: 'shadow-lg',
  },
  rootClassNameSimple: {
    className: 'shadow-sm',
  },
  simple: {
    size: 'md',
    tone: 'secondary',
  },
};
