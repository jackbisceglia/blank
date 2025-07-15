import { AnyFieldMeta, StandardSchemaV1Issue } from "@tanstack/react-form";

// this makes it so we can use the same helper for form and field level errors
export const metaToErrors = (meta: AnyFieldMeta) => {
  return metasToErrors({ field: meta });
};

export const metasToErrors = (metasRecord: Record<any, AnyFieldMeta>) => {
  const metas = Object.values(metasRecord);

  const errors = metas
    .map((meta) => meta.errors as StandardSchemaV1Issue[])
    .flat();

  const hasErrors = metas.some((meta) => meta.isTouched) && errors.length > 0;

  return {
    status: hasErrors ? "errored" : "clean",
    values: errors,
  } as const;
};
