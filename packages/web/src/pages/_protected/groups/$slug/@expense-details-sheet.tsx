import { SheetBody, SheetClose } from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import * as v from "valibot";
import { Expenses } from "./page";
import { Calendar, DollarSign, ImageIcon, Receipt, Tag } from "lucide-react";
import { Select, SelectValue } from "@/components/ui/select";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@radix-ui/react-select";
import { createSearchRoute } from "@/lib/create-search-route";
import { useConfirmDialog } from "@/components/confirm-dialog";
import { useDeleteExpense } from "./@data";

const key = "expense" as const;
export const SearchRouteSchema = v.object({
  [key]: v.optional(v.string()),
});
export const SearchRoute = createSearchRoute(key);

type ExpenseSheetProps = {
  expenses: Expenses[];
};

export function ExpenseSheet(props: ExpenseSheetProps) {
  const route = SearchRoute.useSearchRoute();
  const active = props.expenses.find((expense) => expense.id === route.state());

  const deleteExpense = useDeleteExpense();
  const ConfirmDelete = useConfirmDialog({
    title: "Are you absolutely sure?",
    description: { type: "default", entity: "expense" },
    onConfirm: async () => {
      try {
        await deleteExpense({ expenseId: active?.id ?? "" });
        route.close();
      } catch (error) {
        console.error("DELETE_ERROR", JSON.stringify(error, null, 2));
      }
    },
  });

  if (!active) return null;

  return (
    <>
      <ConfirmDelete.dialog />
      <Sheet
        open={route.view() === "open"}
        onOpenChange={(bool) => {
          if (!bool) return route.close();
          console.error("can not open sheet from here without id context");
        }}
      >
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="uppercase">{active.description}</SheetTitle>
            <SheetDescription>{}</SheetDescription>
          </SheetHeader>
          <SheetBody className="grid gap-4 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="uppercase" htmlFor="title">
                  Title
                </Label>
                <div className="relative">
                  <Receipt className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="title"
                    placeholder="What was this expense for?"
                    // value={expenseTitle}
                    // onChange={(e) => setExpenseTitle(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="uppercase" htmlFor="amount">
                    Amount
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      // value={expenseAmount}
                      // onChange={(e) => setExpenseAmount(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="uppercase" htmlFor="date">
                    Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      // value={expenseDate}
                      // onChange={(e) => setExpenseDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="uppercase" htmlFor="paid-by">
                  Paid by
                </Label>
                <Select
                // value={expensePaidBy} onValueChange={setExpensePaidBy}
                >
                  <SelectTrigger id="paid-by" className="w-full">
                    <SelectValue placeholder="Who paid?" />
                  </SelectTrigger>
                  {/* <SelectContent>
                  {members.map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className={member.color}>
                            {member.name[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span>{member.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent> */}
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="uppercase" htmlFor="category">
                  Category
                </Label>
                <Select
                // value={expenseCategory}
                // onValueChange={setExpenseCategory}
                >
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">Food & Dining</SelectItem>
                    <SelectItem value="groceries">Groceries</SelectItem>
                    <SelectItem value="transportation">
                      Transportation
                    </SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="utilities">Utilities</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="uppercase" htmlFor="notes">
                  Notes
                </Label>
                {/* <TextArea
                id="notes"
                placeholder="Add any additional details..."
                // value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                className="min-h-[100px]"
              /> */}
              </div>

              <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" className="gap-1">
                  <ImageIcon className="h-4 w-4" />
                  Add Receipt
                </Button>
                <Button variant="outline" size="sm" className="gap-1">
                  <Tag className="h-4 w-4" />
                  Add Tags
                </Button>
              </div>
            </div>
          </SheetBody>
          <SheetFooter className="flex gap-2.5">
            <Button className="w-full" variant="theme" size="sm" type="submit">
              Save
            </Button>
            {/* <SheetClose asChild>
            <Button
              className="w-full"
              variant="outline"
              size="sm"
              type="submit"
            >
              Cancel
            </Button>
          </SheetClose> */}
            <Button
              onClick={() => ConfirmDelete.confirm()}
              className="w-full"
              variant="destructive"
              size="sm"
            >
              Delete
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}
