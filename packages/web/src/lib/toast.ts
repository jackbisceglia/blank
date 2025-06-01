import { unwrapOrThrow } from "@blank/core/utils";
import { ResultAsync } from "neverthrow";
import { toast, ToastClassnames } from "sonner";

type WithToastOptions<T> = {
  promise: Promise<T> | (() => Promise<T>);
  notify: {
    loading: string;
    success: string;
    error: string;
  };
  classNames?: ToastClassnames;
};

// TODO: this is broken when the error is thrown synchronously
export function withToast<T>(opts: WithToastOptions<T>): Promise<T> {
  const getPromise = () =>
    typeof opts.promise === "function" ? opts.promise() : opts.promise;

  // hackily doing this temporarily;
  // it catches all errors but as a promise and then rethrows whcih the toast promise catches
  const promise = unwrapOrThrow(ResultAsync.fromThrowable(getPromise)());

  toast.promise(promise, {
    ...(opts.classNames ? { classNames: opts.classNames } : {}),
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
