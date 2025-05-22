"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type TableProps = React.ComponentProps<"table">;

function Table({ className, ...props }: TableProps) {
  return (
    <div className={cn("overflow-x-auto w-full text-foreground/75 duration-0")}>
      <table
        data-slot="table"
        className={cn("caption-bottom text-sm min-w-full", className)}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  );
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body h-full"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  );
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-muted/50 border-t font-medium", className)}
      {...props}
    />
  );
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "hover:bg-blank-theme-background/25 data-[state=selected]:bg-blank-theme-background/50 transition-[color,box-shadow] duration-0 outline-hidden focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1.5px] focus-visible:relative focus-visible:z-10",
        className
      )}
      {...props}
    />
  );
}

const x_spacing = "pl-2 pr-4 lg:pl-2 lg:pr-10";

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        x_spacing,
        " uppercase text-xs text-muted-foreground h-10 min-w-fit whitespace-nowrap text-left align-middle font-normal [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] [&:nth-child(1)]:w-24 [&:nth-child(2)]:w-full",
        className
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "py-3 w-fit align-left [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] border-b border-primary/5 ",
        x_spacing,
        className
      )}
      {...props}
    />
  );
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("text-muted-foreground mt-4 text-sm", className)}
      {...props}
    />
  );
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
