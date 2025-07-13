import {
  AnyFieldMeta,
  createFormHook,
  createFormHookContexts,
  StandardSchemaV1Issue,
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

  // TODO: before merge, this should only be the case for that one card, not all field errors
  if (!isInErrorState || errors.length === 0) return null;

  return (
    <ul
      className={cn("list-none p-0 m-0 py-2 uppercase", props.className)}
      role="alert"
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
