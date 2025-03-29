// NOTE: THIS FILE ISN'T SUPER NECESSARY, BUT I'LL SLOWLY POPULATE AS I HAVE DUPLIACATED TYPE STYLES

import { cn } from "@/lib/utils";

export function PrimaryHeading(props: React.ComponentProps<"h1">) {
  return (
    <h1
      className={cn("text-2xl font-medium uppercase", props.className)}
      {...props}
    />
  );
}

export function SecondaryHeading(props: React.ComponentProps<"h2">) {
  return (
    <h2
      className={cn(
        "text-xl font-medium uppercase text-foreground/80",
        props.className
      )}
      {...props}
    />
  );
}
