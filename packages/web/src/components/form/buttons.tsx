import { Button } from "../ui/button";
import { useStore } from "@tanstack/react-form";
import { cn } from "@/lib/utils";
import { useFormContext } from ".";

type SettleButtonProps = React.ComponentProps<typeof Button>;

export const SettleButton = (props: SettleButtonProps) => {
  const { className, ...rest } = props;

  return (
    <Button
      type="button"
      variant="secondary"
      size="xs"
      className={cn(
        "col-span-1 mb-auto py-2 w-full h-auto border-border",
        className,
      )}
      {...rest}
    />
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
      className={cn("col-span-1 mb-auto py-2 w-full h-auto", className)}
      {...rest}
    />
  );
};

type SubmitButtonProps = React.ComponentProps<typeof Button> & {
  dirty?: {
    disableForAria?: true;
    disable?: true;
    checkDefaults?: true;
  };
};

export const SubmitButton = (props: SubmitButtonProps) => {
  const { className, dirty, ...rest } = props;
  const form = useFormContext();

  const isSubmitting = useStore(form.store, (state) => state.isSubmitting);
  const canSubmit = useStore(form.store, (state) => state.canSubmit);
  const isDirty = useStore(form.store, (state) => state.isDirty);
  const isDefault = useStore(form.store, (state) => state.isDefaultValue);

  const ariaDisabled =
    !canSubmit ||
    isSubmitting ||
    (dirty?.disableForAria && !isDirty) ||
    (dirty?.checkDefaults && isDefault);

  return (
    <Button
      type="submit"
      variant="theme"
      size="xs"
      className={cn(
        "col-start-1 -col-end-2 mb-auto py-2 w-full h-auto",
        className,
      )}
      disabled={isSubmitting}
      aria-disabled={ariaDisabled}
      {...rest}
    />
  );
};
