import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { PrimaryHeading } from "@/components/prose";
import { PageHeaderRow } from "@/components/layouts";
import { underline_defaults } from "@/components/ui/utils";
import { build, cn } from "@/lib/utils";
import { PropsWithChildren } from "react";
import { useGroupById, useGroupBySlug } from "../../@data/groups";
import { slugify } from "@blank/core/lib/utils/index";
import { Effect, Array, String, pipe, Match } from "effect";
import {
  fromParsedEffect,
  fromParsedEffectPipe,
  TaggedError,
} from "@blank/core/lib/effect/index";
import * as v from "valibot";

export const States = {
  Loading: () => null,
  NotFound: (props: { title: string }) => (
    <PrimaryHeading className="mx-auto py-12">
      Group "{props.title}" not found
    </PrimaryHeading>
  ),
};

type GroupNavigationProps = {
  title: string;
  disable?: boolean;
};

function GroupNavigation(props: GroupNavigationProps) {
  const links = ["dashboard", "members", "settings"] as const;

  const buildTo = (l: (typeof links)[number]) =>
    build("/")("groups", "$slug", l !== "dashboard" && l);

  return (
    <div className="sm:ml-auto uppercase text-xs sm:text-sm flex items-center justify-center sm:justify-start gap-4">
      {links.map((link) => (
        <Link
          disabled={props.disable ?? false}
          key={link}
          activeOptions={{ exact: true, includeSearch: false }}
          activeProps={{
            className: cn(
              underline_defaults,
              "text-blank-theme font-semibold hover:text-blank-theme",
            ),
          }}
          params={{ title: props.title }}
          from="/"
          to={buildTo(link)}
          className="active:[&[aria-disabled=true]]:pointer-events-none [&[aria-disabled=true]]:text-muted-foreground/70"
        >
          {link}
        </Link>
      ))}
    </div>
  );
}

export function SecondaryRow(props: PropsWithChildren<{ className?: string }>) {
  return (
    <PageHeaderRow className={cn("items-start", props.className)}>
      {props.children}
    </PageHeaderRow>
  );
}

export function GroupBody(props: PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={cn(
        "flex flex-col w-full pb-3.5 space-y-5 pt-2.5",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}

function GroupLayout() {
  const params = Route.useParams()["slug_id"];
  const group = useGroupById(params.id);

  const title = group.data?.title ?? slugify(params.slug).decode();

  if (group.status === "not-found") return <States.NotFound title={title} />;

  return (
    <>
      <PageHeaderRow className="min-h-8 flex-col gap-2.5 sm:flex-row items-start sm:items-center sm:justify-between pb-1 sm:pb-0">
        <PrimaryHeading>{title}</PrimaryHeading>
        <GroupNavigation title={title} />
      </PageHeaderRow>
      {group.status === "loading" && <States.Loading />}
      {group.status === "success" && <Outlet />}
    </>
  );
}

class InvalidPathParamError extends TaggedError("InvalidSlugIdFormatError") {}

const SEPARATOR = "_";

const Params = v.object({
  slug_id: v.object({
    id: v.pipe(v.string(), v.uuid()),
    slug: v.string(),
  }),
});

export const Route = createFileRoute("/_protected/groups/$slug_id")({
  component: GroupLayout,
  ssr: false,
  params: {
    parse: (params) =>
      pipe(
        Effect.succeed(
          Array.reverse(String.split(params["slug_id"], SEPARATOR)),
        ),
        Effect.tap((parts) => console.log("parts: ", parts)),
        Effect.flatMap((parts) =>
          pipe(
            parts,
            Match.value,
            Match.when(
              (parts) => parts.length >= 2,
              (parts) => Effect.succeed(parts),
            ),
            Match.orElse(() =>
              Effect.fail(
                new InvalidPathParamError("Path must contain slug and id"),
              ),
            ),
            Effect.map(([id, ...slugParts]) => ({
              id: id,
              slug: slugParts.join(""),
            })),
            Effect.andThen((data) =>
              fromParsedEffect(Params.entries.slug_id, data),
            ),
            Effect.map((data) => ({ slug_id: data })),
          ),
        ),
        Effect.runSync,
      ),
    stringify: (params) => ({
      slug_id: `${params["slug_id"].slug}_${params["slug_id"].id}`,
    }),
  },
  loader: (context) => ({
    crumb: slugify(context.params["slug_id"].slug).decode(),
  }),
});
