import { createFileRoute, Link } from "@tanstack/react-router";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthentication } from "@/lib/authentication";
import { PrimaryHeading } from "@/components/prose";
import * as v from "valibot";
import { GroupBody, States } from "./groups/$slug_id/layout";
import { PageHeaderRow } from "@/components/layouts";
import { ascii } from "@/lib/ascii";
import { useUserDefaultGroup } from "./@data/users";
import { useGroupListByUserId } from "./@data/groups";
import { ExpenseForm } from "./@dashboard/expense-form";
import { cn, constants } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { PropsWithChildren } from "react";
import { buttonVariants } from "@/components/ui/button";
import { templates } from "./@create-group/templates";
import GroupSearchRoute from "./@create-group/route";

const schemas = {
  avatar: {
    src: v.parser(
      v.pipe(
        v.string(),
        v.url(),
        v.transform((url) => {
          if (url.endsWith(constants.googleThumbnailSuffix)) {
            return url.slice(
              0,
              url.length - constants.googleThumbnailSuffix.length,
            );
          }

          return url;
        }),
      ),
    ),
    fallback: v.parser(
      v.fallback(
        v.pipe(
          v.string(),
          v.minLength(1),
          v.transform((name) => {
            const parts = name.split(" ");
            switch (parts.length) {
              case 2:
                return parts.map((p) => p.at(0)).join("");
              case 1:
              default:
                return name.at(0) as string;
            }
          }),
        ),
        "U",
      ),
    ),
  },
};

function BackgroundStyles() {
  return (
    <>
      <pre
        className={cn(
          "-z-10 absolute inset-0 flex justify-center items-center overflow-clip select-none pointer-events-none",
          "w-full h-full text-center pb-36",
          "text-blank-theme/20 font-medium",
          "text-xs leading-3.5 tracking-[0.00125rem]",
          "md:text-lg md:leading-6 md:tracking-[0.0575rem]",
          "lg:text-2xl lg:leading-8 lg:tracking-[0.075rem]",
        )}
      >
        {ascii}
      </pre>

      <div
        className="fixed inset-0 -z-30"
        style={{
          backgroundImage: `radial-gradient(circle, var(--color-blank-theme) 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
          opacity: "0.075",
        }}
      />
    </>
  );
}

function FormDetailsTooltip(props: PropsWithChildren) {
  const items = [
    "Identifies splits, totals, and vendor information",
    "Supports pasted images: jpeg, png, heic, svg",
  ];

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          className="p-1 my-auto h-min w-min ml-1 inline-flex items-center justify-center rounded-full hover:bg-blank-theme-text/20 transition-colors"
          aria-label="More information about splitting"
        >
          {props.children}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        alignOffset={24}
        className="space-y-0.5 max-w-lg lowercase text-xs bg-secondary text-foreground/95 py-2.5 px-2.5"
        arrowProps={{
          className:
            "fill-blank-theme-background bg-blank-theme-background text-foreground",
        }}
      >
        <p className="uppercase pb-1.5 font-medium">Submit Expense</p>
        <ul className="space-y-0.5 mr-1">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </TooltipContent>
    </Tooltip>
  );
}

function HomeRoute() {
  const authentication = useAuthentication();
  const defaultGroup = useUserDefaultGroup(authentication.user.id);
  const groupsList = useGroupListByUserId(authentication.user.id);
  const groupRoute = GroupSearchRoute.useSearchRoute();

  const isLoading =
    defaultGroup.status === "loading" || groupsList.status === "loading";

  if (isLoading) {
    return <States.Loading loading={isLoading} />;
  }

  return (
    <>
      <BackgroundStyles />
      <PageHeaderRow className="min-h-8 flex-col gap-4 sm:flex-row items-start sm:items-center pb-1 sm:pb-0">
        <Avatar className="w-12 h-12 rounded-sm">
          <AvatarImage
            src={schemas.avatar.src(authentication.user.image)}
            alt="User Avatar"
          />
          <AvatarFallback>
            {schemas.avatar.fallback(authentication.user.name)}
          </AvatarFallback>
        </Avatar>
        <PrimaryHeading>
          Welcome Back, {authentication.user.name}
        </PrimaryHeading>
      </PageHeaderRow>
      <GroupBody className="w-full h-full justify-center items-center pb-32">
        {groupsList.status === "success" ? (
          <div className="w-full max-w-3xl mx-auto space-y-2">
            <div className="flex pb-1.5">
              <h2 className="text-base text-left uppercase tracking-wider font-medium text-blank-theme-text ml-0.5">
                splitting something?
              </h2>
              <FormDetailsTooltip>
                <Info className="size-3.5 text-blank-theme-text" />
              </FormDetailsTooltip>
            </div>

            <ExpenseForm
              defaultGroup={defaultGroup.data ?? groupsList.data[0]}
            />
          </div>
        ) : (
          <div className="w-full max-w-3xl mx-auto mt-6">
            <div className="relative overflow-hidden border border-border/60 bg-background/50 backdrop-blur-[3px] shadow-[0_40px_160px_-60px_hsl(var(--border))]">
              <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-border/40" />
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-transparent" />{" "}
                <div className="absolute inset-x-0 -top-40 h-56 bg-gradient-to-bl from-blank-theme/30 to-transparent blur-3xl" />
                <div className="absolute inset-x-0 -bottom-40 h-56 bg-gradient-to-tr from-blank-theme/10 to-transparent blur-2xl" />
                <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-blank-theme/40 to-transparent opacity-70" />
                <div className="absolute right-0 top-0 h-full w-px bg-gradient-to-b from-transparent via-blank-theme/40 to-transparent opacity-70" />
              </div>

              <div className="relative p-6 sm:p-10 text-center">
                <div className="mx-auto w-full max-w-xl">
                  <h2 className="text-2xl font-semibold uppercase">
                    get started by creating a group
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground lowercase">
                    create a group to start adding expenses and splitting with
                    others
                  </p>

                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                    {" "}
                    {[
                      {
                        title: "Default",
                        description: "No preset options",
                        template: false,
                      } as const,
                      ...Object.values(templates).map((t) => ({
                        ...t,
                        template: true,
                      })),
                    ].map((t) => (
                      <Link
                        key={t.title}
                        className="group inline-flex items-center gap-2 px-4 py-2.5 text-xs uppercase text-foreground/90 bg-card/40 border border-border/60 hover:bg-card/60 transition-colors"
                        {...groupRoute.openLinkOptions(
                          t.template
                            ? {
                                withSiblings: { template: t.title },
                              }
                            : {},
                        )}
                      >
                        <span className="text-xs">{t.title}</span>
                        <span className="hidden sm:inline text-xs lowercase text-muted-foreground/90 group-hover:text-foreground/80">
                          {t.description}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </GroupBody>
    </>
  );
}

export const Route = createFileRoute("/_protected/")({
  component: HomeRoute,
  loader: () => ({ crumb: "Home" }),
});
