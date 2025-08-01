import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Input } from "../ui/input";
import { useFieldContext } from ".";
type SharedLabelProps = React.ComponentProps<typeof Label>;

export function SharedLabel(props: SharedLabelProps) {
  const { className, ...rest } = props;

  return (
    <Label
      className={cn(
        "uppercase font-base text-xs col-span-full mt-auto",
        className,
      )}
      {...rest}
    />
  );
}

type SharedSheetLabelProps = React.ComponentProps<typeof Label>;

export function SharedSheetLabel(props: SharedSheetLabelProps) {
  const { className, ...rest } = props;

  return (
    <Label
      className={cn(
        "uppercase font-medium text-xs text-muted-foreground",
        className,
      )}
      {...rest}
    />
  );
}

type SharedInputFromFieldProps<T extends string | number> = {
  field: ReturnType<typeof useFieldContext<T>>;
  transform?: (value: string) => T;
} & React.ComponentProps<typeof Input>;

export function SharedInputFromField<T extends string | number>(
  props: SharedInputFromFieldProps<T>,
) {
  const { className, field, transform, ...rest } = props;
  return (
    <Input
      autoComplete="off"
      id={field.name}
      name={field.name}
      value={field.state.value}
      onChange={(e) => {
        field.handleChange(
          transform?.(e.target.value) ?? (e.target.value as T),
        );
      }}
      onBlur={field.handleBlur}
      className={cn("hover:bg-secondary/80", className)}
      {...rest}
    />
  );
}

type SharedErrorProps = React.ComponentProps<"p">;

export function SharedError(props: SharedErrorProps) {
  const { className, ...rest } = props;

  return (
    <p
      className={cn("text-xs text-destructive uppercase", className)}
      {...rest}
    />
  );
}
