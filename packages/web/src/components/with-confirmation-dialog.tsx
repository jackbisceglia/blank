import { ReactNode, useRef, useState } from "react";
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
type UseWithConfirmationOptions = {
  default?: DialogState;
  title?: string;
  subtitle?: false | string;
  description:
    | {
        type: "custom";
        value: string;
      }
    | {
        type: "jsx";
        value: () => ReactNode;
      }
    | {
        type: "default";
        entity: string;
      };
  confirm?: string;
  confirmVariant?: "destructive" | "theme";
  cancel?: string;
  onConfirm: () => Promise<void>;
};

export function useWithConfirmation(options: UseWithConfirmationOptions) {
  const [state, setState] = useState<DialogState>(options.default ?? "closed");
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "idle"
  >("idle");

  async function handleConfirm() {
    setStatus("loading");
    try {
      await options.onConfirm();
      setStatus("success");
    } catch {
      setStatus("error");
    }
    setState("closed");
  }

  const defaults = {
    title: "Are you sure?",
    subtitle: "This action cannot be undone",
    description: (entity: string) =>
      `This will permanently delete the ${entity}, along with all of its associated data. Be sure to backup your data before permanently deleting.`,
    confirm: "Delete",
    cancel: "Cancel",
  };

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
            <DialogTitle className="uppercase">
              {options.title ?? defaults.title}
            </DialogTitle>
            {typeof options.subtitle !== "boolean" && (
              <DialogDescription className="lowercase">
                {options.subtitle ?? defaults.subtitle}
              </DialogDescription>
            )}
          </DialogHeader>

          {options.description.type === "jsx" && <options.description.value />}

          {options.description.type === "custom" && (
            <div className="space-y-2 py-2">
              <DialogDescription className="lowercase">
                {options.description.value}
              </DialogDescription>
            </div>
          )}

          {options.description.type === "default" && (
            <div className="space-y-2 py-2">
              <DialogDescription className="lowercase">
                {defaults.description(options.description.entity)}
              </DialogDescription>
            </div>
          )}

          <DialogFooter className="[&>*]:w-full py-3 flex gap-2">
            <Button
              size="xs"
              className="w-full"
              variant={options.confirmVariant ?? "destructive"}
              onClick={() => void handleConfirm()}
            >
              {status === "loading"
                ? "Processing..."
                : (options.confirm ?? defaults.confirm)}
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
              {options.cancel ?? defaults.cancel}
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

type useWithConfirmationImperativeOptions = {
  default?: DialogState;
  title?: string;
  subtitle?: false | string;
  description:
    | {
        type: "custom";
        value: string;
      }
    | {
        type: "jsx";
        value: () => ReactNode;
      }
    | {
        type: "default";
        entity: string;
      };
  confirm?: string;
  confirmVariant?: "destructive" | "theme";
  cancel?: string;
};

// TODO: should probably converge these two. this is probably the more proper approach
export function useWithConfirmationImperative(
  options: useWithConfirmationImperativeOptions,
) {
  const [state, setState] = useState<DialogState>(options.default ?? "closed");
  const res = useRef<(value: boolean | PromiseLike<boolean>) => void>(null);

  const confirm = () =>
    new Promise<boolean>((resolve) => {
      setState("open");
      res.current = resolve;
    });

  const handleClose = (result: boolean) => {
    res.current?.(result);
    setState("closed");
  };

  const defaults = {
    title: "Are you sure?",
    subtitle: "This action cannot be undone",
    description: (entity: string) =>
      `This will permanently delete the ${entity}, along with all of its associated data. Be sure to backup your data before permanently deleting.`,
    confirm: "Delete",
    cancel: "Cancel",
  };

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
            <DialogTitle className="uppercase">
              {options.title ?? defaults.title}
            </DialogTitle>
            {typeof options.subtitle !== "boolean" && (
              <DialogDescription className="lowercase">
                {options.subtitle ?? defaults.subtitle}
              </DialogDescription>
            )}
          </DialogHeader>

          {options.description.type === "jsx" && <options.description.value />}

          {options.description.type === "custom" && (
            <div className="space-y-2 py-2">
              <DialogDescription className="lowercase">
                {options.description.value}
              </DialogDescription>
            </div>
          )}

          {options.description.type === "default" && (
            <div className="space-y-2 py-2">
              <DialogDescription className="lowercase">
                {defaults.description(options.description.entity)}
              </DialogDescription>
            </div>
          )}

          <DialogFooter className="[&>*]:w-full py-3 flex gap-2">
            <Button
              size="xs"
              className="w-full"
              variant={options.confirmVariant ?? "destructive"}
              onClick={() => void handleClose(true)}
            >
              {options.confirm ?? defaults.confirm}
            </Button>
            <Button
              size="xs"
              className="w-full"
              variant="secondary"
              onClick={() => void handleClose(false)}
              disabled={status === "loading"}
            >
              {options.cancel ?? defaults.cancel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return {
    dialog: ConfirmDialog,
    confirm: confirm,
  };
}
