import { ComponentProps } from "react";
import { Button } from "./ui/button";

export function DialogButton(props: ComponentProps<typeof Button>) {
  return (
    <Button size="xs" className="w-full" {...props}>
      {props.children}
    </Button>
  );
}
