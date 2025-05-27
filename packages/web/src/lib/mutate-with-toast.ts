import { toast } from "sonner";

type WithToastOptions<T> = {
  promise: Promise<T> | (() => Promise<T>);
  notify: {
    loading: string;
    success: string;
    error: string;
  };
};

export function withToast<T>(opts: WithToastOptions<T>): Promise<T> {
  const promise =
    typeof opts.promise === "function" ? opts.promise() : opts.promise;

  toast.promise(promise, {
    loading: opts.notify.loading,
    success: opts.notify.success,
    error: (e) => {
      return {
        message: opts.notify.error,
        description: e instanceof Error ? e.message : "Unknown error occurred",
      };
    },
  });

  return promise;
}
