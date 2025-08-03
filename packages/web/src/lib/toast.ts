import { ReactNode } from "react";
import { Action, toast, ToastClassnames } from "sonner";

type WithToastOptions<T> = {
  promise: Promise<T> | (() => Promise<T>);
  notify: {
    loading: string;
    success: string;
    error: string;
  };
  classNames?: ToastClassnames;
  finally?: () => void;
  action?: ReactNode | Action;
};

export function withToast<T>(opts: WithToastOptions<T>): Promise<T> {
  // i'm not sure if this is good, but i need to wrap the opts.promise in case it throws synchronously
  // even if it's async, if the throw is synchronous, it will not be caught by the toast promise
  const wrapPromise = () => {
    const get = () =>
      typeof opts.promise === "function" ? opts.promise() : opts.promise;

    try {
      return Promise.resolve(get());
    } catch (e) {
      return Promise.reject(e instanceof Error ? e : new Error(String(e)));
    }
  };

  const promise = wrapPromise();

  toast.promise(promise, {
    ...(opts.classNames ? { classNames: opts.classNames } : {}),
    ...(opts.finally ? { finally: opts.finally } : {}),
    ...(opts.action ? { action: opts.action } : {}),
    loading: opts.notify.loading,
    success: opts.notify.success,
    error: (e) => {
      return {
        message: opts.notify.error,
        description: e instanceof Error ? e.message : "Unknown error occurred",
        action: null,
      };
    },
  });

  return promise;
}
