import { cn } from '@/lib/cn';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import { splitProps, type ComponentProps } from 'solid-js';

export const badgeVariants = cva(
  'inline-flex items-center uppercase border px-3 py-1 text-xs font-semibold transition-shadow focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-ring',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-ui-primary text-ui-primary-foreground shadow hover:bg-ui-primary/80',
        secondary:
          'border-transparent bg-ui-secondary text-ui-secondary-foreground hover:bg-ui-secondary/80',
        tertiary:
          'border-transparent hover:underline bg-ui-background text-ui-secondary-foreground hover:bg-ui-background/80',
        destructive:
          'border-transparent bg-ui-destructive text-ui-destructive-foreground shadow hover:bg-ui-destructive/80',
        outline: 'text-ui-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export const Badge = (
  props: ComponentProps<'div'> & VariantProps<typeof badgeVariants>,
) => {
  const [local, rest] = splitProps(props, ['class', 'variant']);

  return (
    <div
      class={cn(
        badgeVariants({
          variant: local.variant,
        }),
        local.class,
      )}
      {...rest}
    />
  );
};
