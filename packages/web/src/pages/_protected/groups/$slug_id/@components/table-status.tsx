import * as v from "valibot";
import { Route } from "../page";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// config
const TableStatus = {
  status: "status",
} as const;

export const TableStatusKeys = Object.keys(
  TableStatus,
) as (keyof typeof TableStatus)[];

const statuses = ["all", "active", "settled"] as const;
export type Status = (typeof statuses)[number];

export const StatusSchema = v.object({
  [TableStatus.status]: v.pipe(v.optional(v.picklist(statuses), "active")),
} as const);
// end config

export function useStatusFromSearch() {
  const navigate = Route.useNavigate();
  const value = Route.useSearch({
    select: (state) => state[TableStatus.status],
  });

  function set(value: Status) {
    void navigate({
      search: (previous) => ({
        ...previous,
        [TableStatus.status]: value,
      }),
    });
  }

  return { value, set };
}

export function TableStatusSelect() {
  const status = useStatusFromSearch();

  return (
    <Select
      value={status.value}
      onValueChange={(value) => {
        if (statuses.includes(value as Status)) {
          status.set(value as Status);
        }
      }}
    >
      <SelectTrigger className="text-xs uppercase w-24 bg-transparent border border-border py-1.5 pl-3 pr-2 hover:bg-secondary/25 text-foreground h-min ">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="uppercase">
        {statuses.map((s) => (
          <SelectItem className="text-xs" value={s} key={s}>
            {s.toUpperCase()}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
