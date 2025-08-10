import { AnyFieldMeta } from "@tanstack/react-form";
import { metasToErrors } from "@/lib/validation-errors";
import { cn } from "@/lib/utils";

export const fieldLevelError = {
  delimiter: "@",
  suffix: () => [fieldLevelError.delimiter, "FieldLevel"].join(""),
  create: (message: string) => [message, fieldLevelError.suffix()].join(""),
  filter: (message: string) => !message.endsWith(fieldLevelError.suffix()),
  extract: (message: string) => {
    const [err, suffix] = message.split(fieldLevelError.delimiter);

    if (!(suffix ?? "").length) return "";

    return err;
  },
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
          .filter((err) => fieldLevelError.filter(err.message))
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
