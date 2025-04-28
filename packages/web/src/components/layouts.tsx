import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

export function PageHeaderRow(
  props: PropsWithChildren<{ className?: string }>
) {
  return (
    <div className={cn("w-full flex items-center min-h-8", props.className)}>
      {props.children}
    </div>
  );
}
