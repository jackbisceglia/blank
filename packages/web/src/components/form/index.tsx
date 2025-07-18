import {
  AnyFieldMeta,
  createFormHook,
  createFormHookContexts,
} from "@tanstack/react-form";
import {
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
  className?: string;
};

export const FieldsErrors = (props: FieldsErrorsProps) => {
  const errors = metasToErrors(props.metas);

  return (
    <ul
      id={props.id}
      className={cn("list-none p-0 m-0 py-2 uppercase", props.className)}
      role="alert"
    >
      {errors.status === "errored" &&
        errors.values.map((error, index) => (
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

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export const { useAppForm } = createFormHook({
  fieldComponents: {
    TextField,
    SheetTextField,
    SheetCostField,
    SheetDateField,
    SheetPaidByField,
  },
  formComponents: {
    SubmitButton,
    SettleButton,
    CancelButton,
  },
  fieldContext,
  formContext,
});
