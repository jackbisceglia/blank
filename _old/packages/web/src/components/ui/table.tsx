import { cn } from '@/lib/cn';
import { splitProps, type ComponentProps } from 'solid-js';

export const Table = (
  props: ComponentProps<'table'> & {
    divClass?: string;
    kb?: boolean;
  },
) => {
  const [local, rest] = splitProps(props, ['class', 'divClass', 'kb']);
  return (
    <div class={cn('w-full bg-ui-muted/75 overflow-x-auto', local.divClass)}>
      <table
        class={cn(
          'w-full caption-bottom text-sm border-ui-background  ',
          local.class,
        )}
        {...rest}
      />
    </div>
  );
};

export const TableHeader = (props: ComponentProps<'thead'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return <thead class={cn('[&_tr]:border-b-2', local.class)} {...rest} />;
};

export const TableBody = (props: ComponentProps<'tbody'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <tbody
      class={cn('[&_tr:last-child]:border-0 px-10', local.class)}
      {...rest}
    />
  );
};

export const TableFooter = (props: ComponentProps<'tfoot'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <tbody
      class={cn(
        'bg-ui-primary font-medium text-ui-primary-foreground',
        local.class,
      )}
      {...rest}
    />
  );
};

export const TableRow = (props: ComponentProps<'tr'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <tr
      tabIndex={0}
      class={cn(
        'border-b-2 border-ui-background transition-none hover:bg-ui-secondary/40 data-[state=selected]:bg-ui-secondary duration-0 space-x-10',
        local.class,
      )}
      {...rest}
    />
  );
};

export const TableHead = (props: ComponentProps<'th'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <th
      class={cn(
        'h-10 px-2 text-left align-middle font-medium text-ui-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        local.class,
      )}
      {...rest}
    />
  );
};

export const TableCell = (props: ComponentProps<'td'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <td
      class={cn(
        'py-4 px-2 [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]',
        local.class,
      )}
      {...rest}
    />
  );
};

export const TableCaption = (props: ComponentProps<'caption'>) => {
  const [local, rest] = splitProps(props, ['class']);

  return (
    <caption
      class={cn('mt-4 text-sm text-ui-muted-foreground', local.class)}
      {...rest}
    />
  );
};
