import { Loading } from '../icons/loading';

import { cn } from '@/lib/cn';
import type { ButtonRootProps } from '@kobalte/core/button';
import { Button as ButtonPrimitive } from '@kobalte/core/button';
import type { PolymorphicProps } from '@kobalte/core/polymorphic';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';
import type { JSX, ValidComponent } from 'solid-js';
import { Show, splitProps } from 'solid-js';

export const buttonVariants = cva(
  'inline-flex items-center uppercase justify-center text-s font-medium transition-[color,background-color,box-shadow] focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-ui-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-ui-primary text-ui-primary-foreground shadow hover:bg-ui-primary/90',
        destructive:
          'bg-ui-destructive border-ui-destructive text-ui-destructive-foreground shadow-sm hover:bg-ui-destructive/90',
        outline:
          'border border-ui-input bg-ui-background shadow-sm hover:bg-ui-accent hover:text-ui-accent-foreground',
        secondary:
          'bg-ui-secondary text-ui-secondary-foreground shadow-sm hover:bg-ui-secondary/80',
        ghost: 'hover:bg-ui-accent hover:text-ui-accent-foreground',
        link: 'text-ui-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type buttonProps<T extends ValidComponent = 'button'> = ButtonRootProps<T> &
  VariantProps<typeof buttonVariants> & {
    class?: string;
  };

export const Button = <T extends ValidComponent = 'button'>(
  props: PolymorphicProps<T, buttonProps<T>>,
) => {
  const [local, rest] = splitProps(props as buttonProps, [
    'class',
    'variant',
    'size',
  ]);

  return (
    <ButtonPrimitive
      class={cn(
        buttonVariants({
          size: local.size,
          variant: local.variant,
        }),
        local.class,
      )}
      {...rest}
    />
  );
};

type ButtonLoadableProps<T extends ValidComponent = 'button'> =
  PolymorphicProps<T, buttonProps<T>> & {
    loading: boolean | undefined;
    children: JSX.Element;
  };

export const ButtonLoadable = <T extends ValidComponent = 'button'>(
  props: ButtonLoadableProps<T>,
) => {
  return (
    <Button {...props}>
      <Show when={!props.loading} fallback={<Loading />}>
        {props.children}
      </Show>
    </Button>
  );
};
