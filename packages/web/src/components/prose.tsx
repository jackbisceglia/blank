import { cn } from "@/lib/utils";

export function PrimaryHeading(props: React.ComponentProps<"h1">) {
  const { className, ...rest } = props;
  return (
    <h1
      className={cn(
        className,
        "text-lg sm:text-xl font-medium uppercase min-w-fit",
      )}
      {...rest}
    />
  );
}

export function SecondaryHeading(props: React.ComponentProps<"h2">) {
  const { className, ...rest } = props;
  return (
    <h2
      className={cn(
        "text-lg font-medium uppercase text-foreground/80",
        className,
      )}
      {...rest}
    />
  );
}

export function SubHeading(props: React.ComponentProps<"h3">) {
  const { className, ...rest } = props;
  return (
    <h3
      className={cn(
        "font-base leading-none lowercase text-muted-foreground text-sm sm:text-base",
        className,
      )}
      {...rest}
    />
  );
}
