import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as v from "valibot";
import { ok, Result } from "neverthrow";
import { ValidationErrorLegacy } from "@blank/core/lib/effect/index";
import { useState } from "react";
import { slugify } from "@blank/core/lib/utils/index";
import { Label } from "@/components/ui/label";
import { useCreateGroup } from "../@data/groups";
import { createStackableSearchRoute } from "@/lib/search-route";
import { fromParsed } from "@blank/core/lib/_legacy/neverthrow";

const invalidCharactersMessage =
  "Title must only contain letters, numbers, and spaces";

const schemas = {
  title: v.pipe(
    v.string(),
    v.minLength(1, "Title must not be empty"),
    v.maxLength(32, "Title must be at most 32 characters"),
    v.custom(
      (value) => slugify(value as string).isLossless(),
      invalidCharactersMessage,
    ),
    v.transform((value) => slugify(value).encode()),
    v.slug(invalidCharactersMessage),
    v.transform((value) => slugify(value).decode()),
  ),
  description: v.pipe(
    v.string(),
    v.minLength(1, "Description must not be empty"),
    v.maxLength(128, "Description must be at most 128 characters"),
  ),
};

const ENTRY = "new-group" as const;
export const SearchRoute = createStackableSearchRoute("action", ENTRY);
export type SearchRouteSchema = v.InferOutput<typeof SearchRouteSchema>;
export const SearchRouteSchema = v.object({
  action: v.literal(ENTRY),
});

export type CreateGroupDialogProps = {
  searchValue: string[];
  onSubmit: (title: string, description: string) => Promise<void>;
};

export function CreateGroupDialog() {
  const createGroup = useCreateGroup();
  const formKeys = { title: "group-title", description: "group-description" };
  const route = SearchRoute.useSearchRoute();

  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const safeSubmitForm = Result.fromThrowable(createGroup);

    event.preventDefault();
    setError(null);

    ok(new FormData(event.target as HTMLFormElement))
      .andThen((form) =>
        Result.combine([
          fromParsed(schemas.title, form.get(formKeys.title)),
          fromParsed(schemas.description, form.get(formKeys.description)),
        ]),
      )
      .andThrough((values) => safeSubmitForm(...values))
      .match(
        () => {
          route.close();
        },
        (error) => {
          if (error instanceof ValidationErrorLegacy) {
            setError(error.message);
          } else {
            setError("Failed to create group. Please try again.");
          }
        },
      );
  }

  return (
    <Dialog
      open={route.view() === "open"}
      onOpenChange={(bool) => {
        (bool ? route.open : route.close)();
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
            className="col-start-1 -col-end-2 mb-auto py-2.5 w-full"
          >
            create
          </Button>
          <Button
            type="button"
            onClick={route.close}
            variant="destructive"
            size="xs"
            className="col-span-1 mb-auto py-2.5 w-full"
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
