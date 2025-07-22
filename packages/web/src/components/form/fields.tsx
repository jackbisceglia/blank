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
import { Button } from "../ui/button";
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
import { Data, Match } from "effect";
import { useGroupListByUserId } from "@/pages/_protected/@data/groups";
import { useAuthentication } from "@/lib/authentication";

export type ErrorPositions = Data.TaggedEnum<{
  inline: {};
  custom: { readonly elementId: string };
}>;

export const positions = Data.taggedEnum<ErrorPositions>();
const isInline = positions.$is("inline");

type TextFieldProps = {
  label: string;
  errorPosition?: ErrorPositions;
  labelProps?: React.ComponentProps<typeof SharedLabel>;
  inputProps?: React.ComponentProps<typeof Input>;
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

  const errors = metaToErrors(field.state.meta);

  const errorPosition = props.errorPosition ?? positions.inline();

  const hasErrors = errors.status === "errored";

  const errorId = Match.value(errorPosition).pipe(
    Match.tag("inline", () => `${field}-error`),
    Match.tag("custom", (config) => config.elementId),
    Match.exhaustive,
  );

  return (
    <>
      <SharedLabel
        className={labelClassName}
        htmlFor={field.name}
        {...restLabelProps}
      >
        {label}
      </SharedLabel>
      <SharedInputFromField
        aria-invalid={hasErrors}
        aria-errormessage={hasErrors ? errorId : undefined}
        aria-describedby={hasErrors ? errorId : undefined}
        type="text"
        field={field}
        className={cn(
          "px-3 py-2 w-full bg-popover col-span-full border-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 flex-1 placeholder:lowercase",
          inputClassName,
        )}
        {...restInputProps}
      />

      {isInline(errorPosition) && (
        <SharedError id={errorId} {...restErrorProps}>
          {errors.values[0]?.message}
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
    <div className="space-y-2">
      <SharedSheetLabel
        className={labelClassName}
        htmlFor={field.name}
        {...restLabelProps}
      >
        {label}
      </SharedSheetLabel>
      <SharedInputFromField
        type="text"
        field={field}
        className={cn(
          inputClassName,
          "bg-accent/50 border-border/50 text-foreground placeholder:text-muted-foreground/60 h-10",
        )}
        {...restInputProps}
      />
    </div>
  );
};

type SheetCostFieldProps = TextFieldProps;

export const SheetCostField = (props: SheetCostFieldProps) => {
  const field = useFieldContext<number>();
  const { label, ...rest } = props;
  const { className: labelClassName, ...restLabelProps } =
    rest.labelProps ?? {};
  const { className: inputClassName, ...restInputProps } =
    rest.inputProps ?? {};

  return (
    <div className="space-y-2">
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
          transform={Number}
          type="number"
          step="1.00"
          field={field}
          className={cn(
            inputClassName,
            "bg-accent/50 border-border/50 text-foreground placeholder:text-muted-foreground/60 h-10 pl-8",
          )}
          {...restInputProps}
        />
      </div>
    </div>
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
    <div className="space-y-2">
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
    </div>
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
    <div className="space-y-2">
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
              "w-full justify-start text-left font-normal lowercase bg-accent/50 border border-border/50 text-foreground h-10",
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
    </div>
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

  const errors = metaToErrors(field.state.meta);
  const errorPosition = props.errorPosition ?? positions.inline();
  const hasErrors = errors.status === "errored";

  const errorId = Match.value(errorPosition).pipe(
    Match.tag("inline", () => `${field.name}-error`),
    Match.tag("custom", (config) => config.elementId),
    Match.exhaustive,
  );

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
            hasErrors && "border-destructive",
            triggerClassName,
          )}
          aria-invalid={hasErrors}
          aria-errormessage={hasErrors ? errorId : undefined}
          aria-describedby={hasErrors ? errorId : undefined}
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

      {isInline(errorPosition) && hasErrors && (
        <SharedError id={errorId} {...rest.errorProps}>
          {errors.values[0]?.message}
        </SharedError>
      )}
    </>
  );
};
