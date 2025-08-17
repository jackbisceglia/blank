import { createFormHook, createFormHookContexts } from "@tanstack/react-form";
import {
  DefaultGroupSelectField,
  SheetCostField,
  SheetDateField,
  SheetPaidByField,
  SheetTextField,
  TextField,
} from "./fields";
import { CancelButton, SettleButton, SubmitButton } from "./buttons";

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
