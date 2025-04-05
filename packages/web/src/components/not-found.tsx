import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

type NotFoundProps<T extends ReactNode = ReactNode> = {
  children?: T;
};

export function NotFound<T extends ReactNode = ReactNode>({
  children,
}: NotFoundProps<T>) {
  return (
    <div className="space-y-2 p-2">
      <div className="text-gray-600 dark:text-gray-400">
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
      <p className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => {
            window.history.back();
          }}
          className="bg-emerald-500 text-white px-2 py-1 rounded uppercase font-black text-sm"
        >
          Go back
        </button>
        <Link
          to="/"
          search={(prev) => ({ cmd: prev.cmd, action: undefined })}
          className="bg-cyan-600 text-white px-2 py-1 rounded uppercase font-black text-sm"
        >
          Start Over
        </Link>
      </p>
    </div>
  );
}
