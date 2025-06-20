import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

type LoadingProps = PropsWithChildren<{
  omitBaseText?: boolean;
  whatIsLoading?: string;
  className?: string;
}>;

export function Loading(props: LoadingProps) {
  const title = [
    "loading",
    props.whatIsLoading && ` ${props.whatIsLoading}`,
    "...",
  ]
    .filter((entry) => !!entry)
    .join("");

  return (
    <div
      className={cn(
        "flex h-full items-center justify-center w-full",
        props.className,
      )}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="h-4 w-4 animate-spin rounded-full border-[1.5px] border-primary border-t-transparent" />
        {props.children ??
          (!props.omitBaseText && (
            <p className="text-sm text-muted-foreground">{title}</p>
          ))}
      </div>
    </div>
  );
}
