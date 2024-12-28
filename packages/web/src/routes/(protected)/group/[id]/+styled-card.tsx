import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { ParentComponent } from 'solid-js';

export const StyledCard: ParentComponent<{ class?: string }> = (props) => (
  <Card
    class={cn('text-left flex h-full flex-col justify-start', props.class)}
    {...props}
  />
);
export const StyledCardHeader: ParentComponent = (props) => (
  <CardHeader {...props} />
);
export const StyledCardTitle: ParentComponent = (props) => (
  <CardTitle class="uppercase text-lg" {...props} />
);
export const StyledCardDescription: ParentComponent = (props) => (
  <CardDescription class="lowercase" {...props} />
);
export const StyledCardContent: ParentComponent<{ class?: string }> = (
  props,
) => <CardContent class={cn(props.class, 'p-0 px-6 mb-auto')} {...props} />;
export const StyledCardFooter: ParentComponent = (props) => (
  <CardFooter class="p-6 px-6" {...props} />
);
