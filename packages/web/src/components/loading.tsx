import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";
import { useSpinDelay } from "spin-delay";

type LoadingProps = PropsWithChildren<{
  omitBaseText?: boolean;
  whatIsLoading?: string;
  title?: string;
  className?: string;
}>;

export function Loading(props: LoadingProps) {
  const title =
    props.title ??
    ["loading", props.whatIsLoading && ` ${props.whatIsLoading}`, "..."]
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

export type LoadingDelayedProps = LoadingProps & {
  loading: boolean | undefined | null;
};

export function LoadingDelayed(props: LoadingDelayedProps) {
  const { loading, ...restProps } = props;

  const showSpinner = useSpinDelay(!!props.loading);

  if (showSpinner) <Loading {...restProps} />;

  return null;
}
