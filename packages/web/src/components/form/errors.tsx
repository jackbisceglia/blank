import { AnyFieldMeta, StandardSchemaV1Issue } from "@tanstack/react-form";
import { cn } from "@/lib/utils";
import { pipe } from "effect";

export const local = {
  delimiter: "@",
  suffix: () => [local.delimiter, "FieldLevel"].join(""),
  create: (message: string) => [message, local.suffix()].join(""),
  annotate: (message: string) => ({
    message: () => local.create(message),
  }),
  isLocal: (message: string) => message.endsWith(local.suffix()),
  filter: (messages: string[]) => messages.filter(local.isLocal),
  extract: (annotation: string | undefined) =>
    pipe(
      annotation,
      (annotation) => annotation ?? "",
      (annotation) => annotation.split(local.delimiter),
      ([message, scope]) => (scope?.length ? message : ""),
    ),
};

// single meta
export const metaToErrors = (meta: AnyFieldMeta) => {
  return metasToErrors({ field: meta });
};

// multiple metas
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
        errors.values
          .filter((err) => local.isLocal(err.message))
          .map((error, index) => (
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
