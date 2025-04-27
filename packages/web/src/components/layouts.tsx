import { cn } from "@/lib/utils";
import { PropsWithChildren } from "react";

type PageHeaderProps = PropsWithChildren;

export function PageHeader(props: PageHeaderProps) {
  return (
    <div className="w-full flex flex-col items-center gap-1.5">
      {props.children}
    </div>
  );
}

export function PageHeaderRow(
  props: PropsWithChildren<{ className?: string }>
) {
  return (
    <div className={cn("w-full flex items-end", props.className)}>
      {props.children}
    </div>
  );
}
