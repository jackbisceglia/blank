import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { Button } from "./ui/button";

type DefaultCatchBoundaryProps = ErrorComponentProps & {
  group?: {
    id: string;
    slug: string;
  };
};

export function DefaultCatchBoundary(props: DefaultCatchBoundaryProps) {
  return (
    <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-4 mx-auto mb-36">
      <p className="text-center uppercase">{props.error.message}</p>
      <div className="flex gap-4 items-center flex-wrap py-2">
        <Button size="sm" variant="secondary" className="w-32" asChild>
          <Link to="." params={(p) => ({ ...p })}>
            Try Again
          </Link>
        </Button>
        <Button size="sm" variant="default" className="w-32" asChild>
          <Link to="/">Home</Link>
        </Button>
      </div>

      {props.group && (
        <Button size="xs" variant="link" className="pt-12" asChild>
          <Link to="/groups/$slug_id" params={{ slug_id: props.group }}>
            Back To Group
          </Link>
        </Button>
      )}
    </div>
  );
}
