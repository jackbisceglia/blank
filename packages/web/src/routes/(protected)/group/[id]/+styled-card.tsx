import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardListItem,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { ParentComponent, splitProps } from 'solid-js';

export const StyledCardListItem: ParentComponent<{ class?: string }> = (props) => {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <CardListItem
      class={cn('text-left flex h-full flex-col justify-start', local.class)}
      {...rest}
    />
  );
};

export const StyledCard: ParentComponent<{ class?: string }> = (props) => {
  const [local, rest] = splitProps(props, ['class']);
  return (
    <Card
      class={cn('text-left flex h-full flex-col justify-start', local.class)}
      {...rest}
    />
  );
};

export const StyledCardHeader: ParentComponent<{ class?: string }> = (
  props,
) => {
  return <CardHeader {...props} />;
};

export const StyledCardTitle: ParentComponent = (props) => (
  <CardTitle class="uppercase text-lg" {...props} />
);
export const StyledCardDescription: ParentComponent = (props) => (
  <CardDescription class="lowercase" {...props} />
);
export const StyledCardContent: ParentComponent<{ class?: string }> = (
  props,
) => <CardContent class={cn(props.class, 'p-0 px-6 mb-auto')} {...props} />;

export const StyledCardFooter: ParentComponent<{ class?: string }> = (
  props,
) => {
  const [local, rest] = splitProps(props, ['class']);
  return <CardFooter class={cn('p-6 px-6', local.class)} {...rest} />;
};
