import { Dialog } from "@/components/ui/dialog";
import { useState } from "react";

type ConfirmDeleteGroupDialogProps = {};

function useView() {
    const [state, setState] = useState<'open' | 'closed'>('closed');
    
    
  return {
    state: () => state
    open: () => {
      setViewState("open");
    },
    close: () => {
      setViewState("closed");
    },
  };
}

export function ConfirmDeleteGroupDialog(props: ConfirmDeleteGroupDialogProps) {
  const formKeys = { title: "confirm-delete" };

  
  
  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  return (
    <Dialog
      open={view.state() === "open"}
      onOpenChange={(bool) => {
        (bool ? view.open : view.close)();
        if (!bool) setError(null);
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
            handleSubmit(e);
          }}
          className="grid grid-rows-4 grid-cols-6 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[1.5px] items-center gap-2.5 p-2 border-[1.5px] border-none bg-transparent [&>div>input]:h-6 h-fit"
        >
          <div className="px-3 py-2 w-full bg-popover space-y-0.5 col-span-full">
            <Label
              className="lowercase font-base text-xs"
              htmlFor={formKeys.title}
            >
              Group Name
            </Label>
            <Input
              aria-errormessage="error-message"
              min={1}
              id={formKeys.title}
              name={formKeys.title}
              className="bg-transparent border-0 p-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 flex-1"
              placeholder="enter a group name"
            />
          </div>
          <div className="px-3 py-2 w-full bg-popover space-y-0.5 col-span-full">
            <Label
              className="lowercase font-base text-xs"
              htmlFor={formKeys.description}
            >
              Group Description
            </Label>
            <Input
              aria-errormessage="error-message"
              min={1}
              id={formKeys.description}
              name={formKeys.description}
              className="bg-transparent border-0 p-0 focus-visible:ring-0 placeholder:text-muted-foreground/60 flex-1"
              placeholder="enter a group description"
            />
          </div>
          <Button
            type="submit"
            variant="theme"
            size="xs"
            className="mb-auto col-start-1 -col-end-2 w-full py-3"
          >
            create
          </Button>
          <Button
            type="button"
            onClick={view.close}
            variant="destructive"
            size="xs"
            className="col-span-1 mb-auto py-3 w-full"
          >
            cancel
          </Button>
          {error ? (
            <div
              id="error-message"
              className="text-sm h-6 text-destructive px-2 lowercase text-center col-span-full mb-auto"
            >
              {error}
            </div>
          ) : (
            <div className="h-6" />
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
