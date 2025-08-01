import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

export function PageHeaderRow(
  props: PropsWithChildren<{ className?: string }>,
) {
  return (
    <div className={cn("w-full flex items-center", props.className)}>
      {props.children}
    </div>
  );
}
