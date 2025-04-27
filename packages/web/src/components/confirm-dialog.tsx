import { useState } from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

type DialogState = "open" | "closed";
type UseConfirmDialogOptions = {
  default?: DialogState;
  title: string;
  description: string;
  confirm: string;
  cancel: string;
  onSuccess: () => Promise<void>;
};

export function useConfirmDialog(options: UseConfirmDialogOptions) {
  const [state, setState] = useState<DialogState>(options.default ?? "closed");
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "idle"
  >("idle");

  async function handleConfirm() {
    setStatus("loading");
    try {
      await options.onSuccess();
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  function ConfirmDialog() {
    return (
      <Dialog
        defaultOpen={true}
        open={state === "open"}
        onOpenChange={() => {
          setState((previous) => (previous === "closed" ? "open" : "closed"));
        }}
      >
        <DialogContent className="py-4 px-6 sm:max-w-xl">
          <DialogHeader className="py-2 gap-1.5">
            <DialogTitle className="uppercase">{options.title}</DialogTitle>
            <DialogDescription className="lowercase">
              This action cannot be undone
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <DialogDescription className="lowercase">
              {options.description}
            </DialogDescription>
          </div>
          <DialogFooter className="[&>*]:w-full py-3 flex gap-2">
            <Button
              size="xs"
              className="w-full"
              variant="destructive"
              onClick={() => void handleConfirm()}
            >
              {status === "loading" ? "Processing..." : options.confirm}
            </Button>
            <Button
              size="xs"
              className="w-full"
              variant="secondary"
              onClick={() => {
                setState("closed");
              }}
              disabled={status === "loading"}
            >
              {options.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return {
    dialog: ConfirmDialog,
    confirm: () => {
      setState("open");
    },
  };
}
