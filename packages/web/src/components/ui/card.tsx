import { cn } from '@/lib/cn';
import { A } from '@solidjs/router';
import type { ComponentProps, ParentComponent } from 'solid-js';
import { splitProps } from 'solid-js';

export const CardListItem = (props: ComponentProps<'li'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <li
      class={cn(
        'border bg-ui-muted border-ui-border text-ui-card-foreground shadow',
        local.class,
      )}
      {...rest}
    />
  );
};


export const LinkCard = (props: ComponentProps<typeof A>) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <A
      class={cn(
        'border bg-ui-accent border-ui-border text-ui-card-foreground shadow',
        local.class,
      )}
      {...rest}
    />
  );
};

export const Card = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn(
        'border bg-ui-muted border-ui-border text-ui-card-foreground shadow',
        local.class,
      )}
      {...rest}
    />
  );
};

export const CardHeader = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <div class={cn('flex flex-col space-y-1.5 p-6', local.class)} {...rest} />
  );
};

export const CardTitle: ParentComponent<ComponentProps<'h1'>> = (props) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <h1
      class={cn('font-semibold leading-none tracking-tight', local.class)}
      {...rest}
    />
  );
};

export const CardDescription: ParentComponent<ComponentProps<'h3'>> = (
  props,
) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <h3 class={cn('text-sm text-ui-muted-foreground', local.class)} {...rest} />
  );
};

export const CardContent = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <div class={cn('p-6 pt-0 text-ui-foreground/50', local.class)} {...rest} />
  );
};

export const CardFooter = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <div class={cn('flex items-center p-6 pt-0', local.class)} {...rest} />
  );
};
