import {
  AnyFieldMeta,
  createFormHook,
  createFormHookContexts,
} from "@tanstack/react-form";
import {
  DefaultGroupSelectField,
  SheetCostField,
  SheetDateField,
  SheetPaidByField,
  SheetTextField,
  TextField,
} from "./fields";
import { cn } from "@/lib/utils";
import { CancelButton, SettleButton, SubmitButton } from "./buttons";
import { metasToErrors } from "@/lib/validation-errors";

type FieldsErrorsProps = {
  metas: Record<any, AnyFieldMeta>;
  id?: string;
  ul?: { className?: string };
  li?: { className?: string };
};

export const FieldsErrors = (props: FieldsErrorsProps) => {
  const errors = metasToErrors(props.metas);

  return (
    <ul
      id={props.id}
      className={cn("list-none p-0 m-0 py-2 uppercase", props.ul?.className)}
      role="alert"
    >
      {errors.status === "errored" &&
        errors.values.map((error, index) => (
          <li
            key={index}
            className={cn(
              "text-sm text-destructive w-full text-center",
              props.li?.className,
            )}
          >
            {error.message}
          </li>
        ))}
    </ul>
  );
};

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    SheetTextField,
    SheetCostField,
    SheetDateField,
    SheetPaidByField,
    DefaultGroupSelectField,
  },
  formComponents: {
    SubmitButton,
    SettleButton,
    CancelButton,
  },
  fieldContext,
  formContext,
});
