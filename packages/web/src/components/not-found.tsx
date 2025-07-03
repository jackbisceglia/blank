import { Link } from "@tanstack/react-router";
import { Button } from "./ui/button";

export function NotFound() {
  return (
    <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-4 mx-auto mb-36">
      <p className="uppercase">The page you are looking for does not exist</p>

      <div className="flex gap-4 items-center flex-wrap">
        <Button
          size="sm"
          variant="secondary"
          className="w-32"
          onClick={() => {
            window.history.back();
          }}
        >
          Back
        </Button>
        <Button size="sm" variant="default" className="w-32" asChild>
          <Link to="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
