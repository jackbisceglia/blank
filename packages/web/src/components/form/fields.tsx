import {
  SharedError,
  SharedInputFromField,
  SharedLabel,
  SharedSheetLabel,
} from "./shared";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { format, isWithinInterval, subYears } from "date-fns";
import { Calendar } from "../ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Button, buttonVariants } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type ParticipantWithMember } from "@/lib/participants";
import { useFieldContext } from ".";
import { Member } from "@blank/zero";
import { metaToErrors } from "@/lib/validation-errors";
import { Data, Number, Match, pipe, Option, Schema as S } from "effect";
import { useGroupListByUserId } from "@/pages/_protected/@data/groups";
import { useAuthentication } from "@/lib/authentication";
import { Link } from "@tanstack/react-router";
import { local } from "./errors";
import { useStore } from "@tanstack/react-form";

export type ErrorPositions = Data.TaggedEnum<{
  inline: {};
  custom: { readonly elementId: string };
}>;

export const positions = Data.taggedEnum<ErrorPositions>();
const isInline = positions.$is("inline");

function usePerFieldErrors<T>(
  field: ReturnType<typeof useFieldContext<T>>,
  position: ErrorPositions,
) {
  const meta = useStore(field.store, (s) => s.meta);
  const errors = metaToErrors(meta);

  const id = Match.value(position).pipe(
    Match.tags({
      inline: () => `${field}-error`,
      custom: (config) => config.elementId,
    }),
    Match.exhaustive,
  );

  const isErrored = Match.value(position).pipe(
    Match.tags({
      inline: () =>
        errors.values.filter((e) => !local.filter(e.message)).length > 0,
      custom: () => errors.status === "errored",
    }),
    Match.exhaustive,
  );

  return { id, errors, isErrored };
}

type TextFieldProps =
  | {
      label: string;
      errorPosition?: ErrorPositions;
      labelProps?: React.ComponentProps<typeof SharedLabel>;
      inputProps?: React.ComponentProps<typeof Input>;
      errorProps?: React.ComponentProps<typeof SharedError>;
    }
  | {
      label?: never;
      errorPosition?: ErrorPositions;
      labelProps?: React.ComponentProps<typeof SharedLabel>;
      inputProps: React.ComponentProps<typeof Input> & {
        "aria-label": string;
      };
      errorProps?: React.ComponentProps<typeof SharedError>;
    };

export const TextField = (props: TextFieldProps) => {
  const field = useFieldContext<string>();
  const { label, ...rest } = props;
  const { className: labelClassName, ...restLabelProps } =
    rest.labelProps ?? {};
  const { className: inputClassName, ...restInputProps } =
    rest.inputProps ?? {};
  const { className: errorClassName, ...restErrorProps } =
    rest.errorProps ?? {};

  const position = props.errorPosition ?? positions.inline();

  const e = usePerFieldErrors(field, position);

  return (
    <>
      {label && (
        <SharedLabel
          className={labelClassName}
          htmlFor={field.name}
          {...restLabelProps}
        >
          {label}
        </SharedLabel>
      )}
      <SharedInputFromField
        aria-invalid={e.isErrored}
        aria-errormessage={e.isErrored ? e.id : undefined}
        aria-describedby={e.isErrored ? e.id : undefined}
        type="text"
        field={field}
        className={cn(
          "px-3 py-2 w-full bg-popover col-span-full border-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 flex-1 placeholder:lowercase",
          inputClassName,
        )}
        {...restInputProps}
      />

      {isInline(position) && e.isErrored && (
        <SharedError id={e.id} {...restErrorProps}>
          {e.errors.values[0]?.message}
        </SharedError>
      )}
    </>
  );
};

type SheetTextFieldProps = TextFieldProps;

export const SheetTextField = (props: SheetTextFieldProps) => {
  const field = useFieldContext<string>();
  const { label, ...rest } = props;
  const { className: labelClassName, ...restLabelProps } =
    rest.labelProps ?? {};
  const { className: inputClassName, ...restInputProps } =
    rest.inputProps ?? {};

  return (
    <>
      {label && (
        <SharedSheetLabel
          className={labelClassName}
          htmlFor={field.name}
          {...restLabelProps}
        >
          {label}
        </SharedSheetLabel>
      )}
      <SharedInputFromField
        type="text"
        field={field}
        className={cn(
          "bg-accent/50 border-border/50 text-foreground placeholder:text-muted-foreground/60 h-10",
          inputClassName,
        )}
        {...restInputProps}
      />
    </>
  );
};

type SheetCostFieldProps = TextFieldProps;

export const SheetCostField = (props: SheetCostFieldProps) => {
  const field = useFieldContext<string>();
  const { label, ...rest } = props;
  const { className: labelClassName, ...restLabelProps } =
    rest.labelProps ?? {};
  const { className: inputClassName, ...restInputProps } =
    rest.inputProps ?? {};

  const { className: errorClassName, ...restErrorProps } =
    rest.errorProps ?? {};

  const position = props.errorPosition ?? positions.inline();

  const e = usePerFieldErrors(field, position);

  return (
    <>
      <SharedSheetLabel
        className={labelClassName}
        htmlFor={field.name}
        {...restLabelProps}
      >
        {label}
      </SharedSheetLabel>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          $
        </span>
        <SharedInputFromField
          type="number"
          step={1}
          field={field}
          onChange={(e) => field.handleChange(e.target.value)}
          className={cn(
            inputClassName,
            "bg-accent/50 border-border/50 text-foreground placeholder:text-muted-foreground/60 h-10 pl-8",
          )}
          {...restInputProps}
        />
      </div>
      {isInline(position) && e.isErrored && (
        <SharedError id={e.id} {...restErrorProps}>
          {local.extract(e.errors.values[0]?.message)}
        </SharedError>
      )}
    </>
  );
};

type SheetPaidByFieldProps = {
  participants: Array<ParticipantWithMember>;
} & TextFieldProps;

export const SheetPaidByField = (props: SheetPaidByFieldProps) => {
  const { label, participants: participantsProp, ...rest } = props;
  const { className: labelClassName, ...restLabelProps } =
    rest.labelProps ?? {};

  const participants = participantsProp.filter((p) => !!p.member) as Array<
    ParticipantWithMember & { member: Member }
  >;
  const field =
    useFieldContext<(typeof participants)[number]["member"]["userId"]>();

  return (
    <>
      <SharedSheetLabel
        className={labelClassName}
        htmlFor={field.name}
        {...restLabelProps}
      >
        {label}
      </SharedSheetLabel>
      <Select
        value={field.state.value}
        onValueChange={field.handleChange}
        disabled={rest.inputProps?.disabled ?? false}
      >
        <SelectTrigger className="bg-accent/50 border-border/50 border-[1.5px] text-foreground hover:bg-secondary/80 placeholder:text-muted-foreground/60 h-10">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {participants.map((participant) => (
            <SelectItem
              key={participant.member.userId}
              value={participant.member.userId}
            >
              {participant.member.nickname}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
};

type SheetDateFieldProps = TextFieldProps;

export const SheetDateField = (props: SheetDateFieldProps) => {
  const field = useFieldContext();
  const { label, ...rest } = props;
  const { className: labelClassName, ...restLabelProps } =
    rest.labelProps ?? {};

  const value = field.state.value as Date | undefined;

  return (
    <>
      <SharedSheetLabel
        className={labelClassName}
        htmlFor={field.name}
        {...restLabelProps}
      >
        {label}
      </SharedSheetLabel>
      <Popover modal>
        <PopoverTrigger asChild>
          <Button
            disabled={rest.inputProps?.disabled ?? false}
            variant="secondary"
            className={cn(
              "justify-start bg-accent/50 border-border/50 border-[1.5px] text-foreground hover:bg-secondary/80 placeholder:text-muted-foreground/60 h-10 w-full",
              !field.state.value && "text-muted-foreground",
            )}
          >
            <CalendarIcon />
            {value ? format(value, "MM/dd/yy") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            disabled={(date) => {
              const range = {
                start: subYears(new Date(), 1),
                end: new Date(),
              };

              return !isWithinInterval(date, range);
            }}
            selected={value}
            onSelect={(date) => {
              if (!date) return;

              field.handleChange(date);
            }}
          />
        </PopoverContent>
      </Popover>
    </>
  );
};

type DefaultGroupSelectFieldProps = {
  label: string;
  errorPosition?: ErrorPositions;
  labelProps?: React.ComponentProps<typeof SharedLabel>;
  triggerProps?: React.ComponentProps<typeof SelectTrigger>;
  itemProps?: Partial<React.ComponentProps<typeof SelectItem>>;
  errorProps?: React.ComponentProps<typeof SharedError>;
};

export const DefaultGroupSelectField = (
  props: DefaultGroupSelectFieldProps,
) => {
  const { label, ...rest } = props;
  const { className: labelClassName, ...restLabelProps } =
    rest.labelProps ?? {};
  const { className: triggerClassName, ...restTriggerProps } =
    rest.triggerProps ?? {};
  const { className: itemClassName, ...restItemProps } = rest.itemProps ?? {};

  const auth = useAuthentication();
  const groups = useGroupListByUserId(auth.user.id);
  const field = useFieldContext<string>();

  const position = props.errorPosition ?? positions.inline();

  const e = usePerFieldErrors(field, position);

  const errorId = Match.value(position).pipe(
    Match.tag("inline", () => `${field.name}-error`),
    Match.tag("custom", (config) => config.elementId),
    Match.exhaustive,
  );

  if (groups.status === "loading") return null;
  if (groups.status === "empty") {
    return (
      <p className="mx-auto my-auto uppercase text-muted-foreground font-medium text-sm">
        Please{" "}
        <Link
          to={"/groups"}
          search={{ action: ["new-group"] }}
          className={cn(
            buttonVariants({ variant: "link" }),
            "p-0 text-blank-theme-text",
          )}
        >
          create a group
        </Link>{" "}
        before selecting a default
      </p>
    );
  }

  return (
    <>
      <SharedLabel
        className={labelClassName}
        htmlFor={field.name}
        {...restLabelProps}
      >
        {label}
      </SharedLabel>
      <Select
        value={field.state.value}
        onValueChange={field.handleChange}
        disabled={restTriggerProps?.disabled ?? false}
      >
        <SelectTrigger
          className={cn(
            "bg-transparent border border-border hover:bg-secondary/25 text-foreground placeholder:text-foreground/40",
            e.isErrored && "border-destructive",
            triggerClassName,
          )}
          aria-invalid={e.isErrored}
          aria-errormessage={e.isErrored ? errorId : undefined}
          aria-describedby={e.isErrored ? errorId : undefined}
          {...restTriggerProps}
        >
          <SelectValue placeholder="Select default group" />
        </SelectTrigger>
        <SelectContent>
          {groups.data?.map((group) => (
            <SelectItem
              className={cn("", itemClassName)}
              key={group.id}
              value={group.id}
              {...restItemProps}
            >
              {group.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isInline(position) && e.isErrored && (
        <SharedError id={errorId} {...rest.errorProps}>
          {e.errors.values[0]?.message}
        </SharedError>
      )}
    </>
  );
};

type SheetSplitFieldProps = {
  view: "percent" | "amount";
  total: number;
} & TextFieldProps;

export const SheetSplitField = (props: SheetSplitFieldProps) => {
  const field = useFieldContext<string>();
  const { label, total, view, ...rest } = props;
  const { className: labelClassName, ...restLabelProps } =
    rest.labelProps ?? {};
  const { className: inputClassName, ...restInputProps } =
    rest.inputProps ?? {};
  const { className: errorClassName, ...restErrorProps } =
    rest.errorProps ?? {};

  const position = props.errorPosition ?? positions.inline();

  const e = usePerFieldErrors(field, position);

  const Transform = S.transform(S.String, S.String, {
    encode: (amount) => {
      const value = parseFloat(amount);

      return pipe(
        value,
        Number.divide(total),
        Option.getOrElse(() => 0),
        Number.multiply(100),
        Number.round(2),
        (percent) => (isNaN(percent) ? 0 : percent),
        (percent) => {
          const shouldClamp = value < total && value > 0;
          const clamp = Number.clamp({ minimum: 0.01, maximum: 99.9 });

          return shouldClamp ? clamp(percent) : percent;
        },
        globalThis.String,
      );
    },
    decode: (percent) =>
      pipe(
        percent,
        Number.parse,
        Option.getOrElse(() => 0),
        Number.divide(100),
        Option.getOrThrow,
        Number.multiply(total),
        Number.round(2),
        (number) => number.toFixed(2),
        globalThis.String,
      ),
  });

  return (
    <>
      {label && (
        <div className="flex justify-between">
          <SharedSheetLabel
            className={labelClassName}
            htmlFor={field.name}
            {...restLabelProps}
          >
            {label}
          </SharedSheetLabel>
          <span className="text-xs text-muted-foreground/75">
            {Match.value(view).pipe(
              Match.when("amount", () => {
                const transform = Transform.pipe(S.encodeSync);
                const percent = transform(field.state.value);

                return `${percent}%`;
              }),
              Match.when("percent", () => {
                const value = field.state.value;

                return `$${value}`;
              }),
              Match.orElseAbsurd,
            )}
          </span>
        </div>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          {view === "percent" ? "%" : "$"}
        </span>
        <SharedInputFromField
          type="number"
          step={0.01}
          min={0}
          field={field}
          className={cn(
            inputClassName,
            "bg-accent/50 font-medium border-border/50 text-foreground placeholder:text-muted-foreground/60 h-10 pl-8",
          )}
          encode={view === "percent" ? S.encodeSync(Transform) : undefined}
          decode={view === "percent" ? S.decodeSync(Transform) : undefined}
          {...restInputProps}
        />
      </div>
      {isInline(position) && e.isErrored && (
        <SharedError id={e.id} {...restErrorProps}>
          {local.extract(e.errors.values[0]?.message)}
        </SharedError>
      )}
    </>
  );
};
