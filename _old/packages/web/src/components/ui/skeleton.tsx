import { cn } from '@/lib/cn';
import { splitProps, type ComponentProps } from 'solid-js';

export const Skeleton = (props: ComponentProps<'div'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <div
      class={cn('animate-pulse rounded-sm bg-ui-muted', local.class)}
      {...rest}
    />
  );
};
