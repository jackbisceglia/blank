import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AnyFieldMeta,
  createFormHook,
  createFormHookContexts,
  StandardSchemaV1Issue,
  useStore,
} from "@tanstack/react-form";
import { cn } from "./utils";

export const prevented = <
  E extends { preventDefault: () => void; stopPropagation: () => void },
>(
  callback?: (e: E) => unknown
) => {
  return (e: E) => {
    e.preventDefault();
    e.stopPropagation();
    callback?.(e);
  };
};

type FieldsErrorsProps = {
  metas: AnyFieldMeta[];
  className?: string;
};

export const FieldsErrors = (props: FieldsErrorsProps) => {
  const errors = props.metas
    .map((meta) => meta.errors as StandardSchemaV1Issue[])
    .flat();

  const isInErrorState =
    props.metas.some((meta) => meta.isTouched) && errors.length > 0;

  return (
    <ul
      className={cn(
        "list-none p-0 m-0 min-h-32 py-2 lowercase",
        props.className
      )}
    >
      {isInErrorState &&
        errors.map((error, index) => (
          <li
            key={index}
            className="text-sm text-destructive w-full text-center"
          >
            {error.message}
          </li>
        ))}
    </ul>
  );
};

type CancelButtonProps = React.ComponentProps<typeof Button>;

export const CancelButton = (props: CancelButtonProps) => {
  const { className, ...rest } = props;

  return (
    <Button
      type="button"
      variant="destructive"
      size="xs"
      className={cn("col-span-1 mb-auto py-2.5 w-full", className)}
      {...rest}
    />
  );
};

type SubmitButtonProps = React.ComponentProps<typeof Button>;

export const SubmitButton = (props: SubmitButtonProps) => {
  const { className, ...rest } = props;
  const form = useFormContext();

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);

  return (
    <Button
      type="submit"
      variant="theme"
      size="xs"
      className={cn("col-start-1 -col-end-2 mb-auto py-2.5 w-full", className)}
      disabled={isSubmitting && !canSubmit}
      aria-disabled={!canSubmit || isSubmitting}
      {...rest}
    />
  );
};

type TextFieldProps = {
  label: string;
  labelProps?: React.ComponentProps<typeof Label>;
  inputProps?: React.ComponentProps<typeof Input>;
};

export const TextField = (props: TextFieldProps) => {
  const field = useFieldContext<string>();
  const { label, ...rest } = props;
  const { className: labelClassName, ...restLabelProps } =
    rest.labelProps ?? {};
  const { className: inputClassName, ...restInputProps } =
    rest.inputProps ?? {};

  return (
    <>
      <Label
        className={cn(
          labelClassName,
          "lowercase font-base text-xs col-span-full mt-auto"
        )}
        htmlFor={field.name}
        {...restLabelProps}
      >
        {label}
      </Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        className={cn(
          inputClassName,
          "sm:px-3 sm:py-2 w-full bg-popover space-y-0.5 col-span-full border-0 p-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 flex-1"
        )}
        {...restInputProps}
      />
    </>
  );
};

type SheetTextFieldProps = TextFieldProps & {
  variant?: "sheet";
};

export const SheetTextField = (props: SheetTextFieldProps) => {
  const field = useFieldContext<string>();
  const { label, ...rest } = props;
  const { className: labelClassName, ...restLabelProps } =
    rest.labelProps ?? {};
  const { className: inputClassName, ...restInputProps } =
    rest.inputProps ?? {};

  return (
    <div className="space-y-2">
      <Label
        className={cn(
          "lowercase font-medium text-xs text-muted-foreground",
          labelClassName
        )}
        htmlFor={field.name}
        {...restLabelProps}
      >
        {label}
      </Label>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        className={cn(
          "bg-accent/50 border-border/50 text-foreground placeholder:text-muted-foreground/60 h-10",
          inputClassName
        )}
        {...restInputProps}
      />
    </div>
  );
};

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    SheetTextField,
  },
  formComponents: {
    SubmitButton,
    CancelButton,
  },
  fieldContext,
  formContext,
});
