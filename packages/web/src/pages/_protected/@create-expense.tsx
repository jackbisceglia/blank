import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useDialogFromUrl } from "@/lib/dialog";
import { Label } from "@radix-ui/react-label";
import * as v from "valibot";
import { useCreateExpense } from "./@data";

export const CreateExpenseSearchParams = v.object({
  action: v.literal("new-expense"),
});
export type CreateExpenseSearchParams = v.InferOutput<
  typeof CreateExpenseSearchParams
>;

export function CreateExpenseDialog() {
  const createExpense = useCreateExpense();
  const formKeys = { expense: "expense-description" };

  const view = useDialogFromUrl({ schema: CreateExpenseSearchParams });

  function handleSubmit(_event: React.FormEvent<HTMLFormElement>) {
    const form = new FormData(_event.target as HTMLFormElement);
    // TODO: validate
    const description = form.get(formKeys.expense) as string;
    void createExpense(description);
    view.close();
  }

  return (
    <Dialog
      open={view.state() === "open"}
      onOpenChange={(bool) => {
        (bool ? view.open : view.close)();
      }}
    >
      <DialogHeader className="sr-only">
        <DialogTitle>Create New Group</DialogTitle>
      </DialogHeader>
      <DialogContent
        aria-describedby={undefined}
        omitCloseButton
        className="bg-transparent border-none shadow-none sm:max-w-2xl"
      >
        {/* TODO: convert to form w/ tanstack form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(e);
          }}
          className="grid grid-rows-3 grid-cols-6 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1.5px] items-center gap-2.5 p-2 border-[1.5px] border-none bg-transparent [&>div>input]:h-6 h-fit"
        >
          <Label
            className="lowercase font-base text-xs col-span-full mt-auto"
            htmlFor={formKeys.expense}
          >
            Expense Description
          </Label>
          <Input
            aria-errormessage="error-message"
            min={1}
            id={formKeys.expense}
            name={formKeys.expense}
            className="sm:px-3 sm:py-2 w-full bg-popover space-y-0.5 col-span-full border-0 p-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 flex-1"
            placeholder="enter expense description"
          />
          <Button
            type="submit"
            variant="theme"
            size="xs"
            className="col-start-1 -col-end-2 mb-auto py-2.5 w-full"
          >
            create
          </Button>
          <Button
            type="button"
            onClick={view.close}
            variant="destructive"
            size="xs"
            className="col-span-1 mb-auto py-2.5 w-full"
          >
            cancel
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
