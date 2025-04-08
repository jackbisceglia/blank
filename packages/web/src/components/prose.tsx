// NOTE: THIS FILE ISN'T SUPER NECESSARY, BUT I'LL SLOWLY POPULATE AS I HAVE DUPLIACATED TYPE STYLES

import { cn } from "@/lib/utils";

export function PrimaryHeading(props: React.ComponentProps<"h1">) {
  const { className, ...rest } = props;
  return (
    <h1 className={cn(className, "text-xl font-medium uppercase")} {...rest} />
  );
}

export function SecondaryHeading(props: React.ComponentProps<"h2">) {
  const { className, ...rest } = props;
  return (
    <h2
      className={cn(
        "text-lg font-medium uppercase text-foreground/80",
        className
      )}
      {...rest}
    />
  );
}

export function SubHeading(props: React.ComponentProps<"h3">) {
  const { className, ...rest } = props;
  return (
    <h3
      className={cn("font-base lowercase text-muted-foreground", className)}
      {...rest}
    />
  );
}
