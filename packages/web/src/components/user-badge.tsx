import { Badge, badgeVariants } from './ui/badge';

import { cn } from '@/lib/cn';
import { A } from '@solidjs/router';
import { ComponentProps, splitProps } from 'solid-js';

const badgeGradientClasslist = (value: number) => {
  const gradientPart = `bg-gradient-to-br from-ui-primary`;

  // i can't make this dynamic, so hardcoded it is, for now
  return {
    [`${gradientPart} to-orange-400`]: value % 8 === 0,
    [`${gradientPart} to-red-400`]: value % 8 === 1,
    [`${gradientPart} to-violet-400`]: value % 8 === 2,
    [`${gradientPart} to-fuschia-400`]: value % 8 === 3,
    [`${gradientPart} to-rose-400`]: value % 8 === 4,
    [`${gradientPart} to-teal-400`]: value % 8 === 5,
    [`${gradientPart} to-yellow-400`]: value % 8 === 6,
    [`${gradientPart} to-sky-400`]: value % 8 === 7,
  };
};

const shellClass =
  'border-primary flex items-center justify-center bg-transparent rounded-full h-min aspect-square p-1.5 text-xs leading-none';

type BaseUserBadgeProps = {
  gradientHash: number;
  class?: string;
};

type UserBadgeLinkProps = BaseUserBadgeProps & {
  variant: 'link';
} & Omit<ComponentProps<typeof A>, keyof BaseUserBadgeProps | 'variant'>;

type UserBadgeStaticProps = BaseUserBadgeProps & {
  variant: 'static';
} & Omit<ComponentProps<typeof Badge>, keyof BaseUserBadgeProps | 'variant'>;

type UnifiedUserBadgeProps = UserBadgeLinkProps | UserBadgeStaticProps;

export function UserBadge(props: UnifiedUserBadgeProps) {
  const [local, rest] = splitProps(props, ['class', 'gradientHash', 'variant']);

  return (
    <>
      {local.variant === 'link' ? (
        <A
          class={cn(
            local.class,
            badgeVariants({ variant: 'default' }),
            shellClass,
          )}
          classList={badgeGradientClasslist(local.gradientHash)}
          {...(rest as ComponentProps<typeof A>)}
        />
      ) : (
        <Badge
          variant="default"
          class={cn(local.class, shellClass)}
          classList={badgeGradientClasslist(local.gradientHash)}
          {...(rest as ComponentProps<typeof Badge>)}
        />
      )}
    </>
  );
}
