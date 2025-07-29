import { cn } from "@/lib/utils";
import { PropsWithChildren, useEffect, useRef, useState } from "react";

type DelayedProps = PropsWithChildren<{ delay?: number }>;

export function Delayed(props: DelayedProps) {
  const [show, setShow] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setShow(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setShow(true);
    }, props.delay ?? 100);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [props.delay]);

  if (!show) return null;
  return <>{props.children}</>;
}

type LoadingProps = PropsWithChildren<{
  useGuard?: boolean;
  omitBaseText?: boolean;
  whatIsLoading?: string;
  title?: string;
  className?: string;
}>;

export function LoadingInner(props: LoadingProps) {
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

export function Loading(props: LoadingProps) {
  if (!props.useGuard) return <LoadingInner {...props} />;

  return (
    <Delayed>
      <LoadingInner {...props} />
    </Delayed>
  );
}
