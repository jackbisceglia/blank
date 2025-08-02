import { createFileRoute } from "@tanstack/react-router";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthentication } from "@/lib/authentication";
import { PrimaryHeading } from "@/components/prose";
import * as v from "valibot";
import { GroupBody, States } from "./groups/$slug_id/layout";
import { PageHeaderRow } from "@/components/layouts";
import { ascii } from "@/lib/ascii";
import { useUserDefaultGroup } from "./@data/users";
import { TaggedError } from "@blank/core/lib/effect/index";
import { useGroupListByUserId } from "./@data/groups";
import { ExpenseForm } from "./@dashboard/expense-form";
import { cn, constants } from "@/lib/utils";

class DataFetchingError extends TaggedError("DataFetchingError") {}

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
          "w-full h-full text-center pb-32",
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

function HomeRoute() {
  const authentication = useAuthentication();
  const defaultGroup = useUserDefaultGroup(authentication.user.id);
  const groupsList = useGroupListByUserId(authentication.user.id);

  const isLoading =
    defaultGroup.status === "loading" || groupsList.status === "loading";

  if (isLoading) {
    return <States.Loading loading={isLoading} />;
  }

  if (groupsList.status === "empty") {
    throw new DataFetchingError("Could not load you groups");
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
        <div className="w-full max-w-3xl mx-auto space-y-2">
          <h2 className="text-base text-left uppercase tracking-wider font-medium text-blank-theme-text ml-1.5">
            splitting something?
          </h2>

          <div className="border-6 rounded-md border-background">
            <ExpenseForm
              defaultGroup={defaultGroup.data ?? groupsList.data[0]}
            />
          </div>
        </div>
      </GroupBody>
    </>
  );
}

export const Route = createFileRoute("/_protected/")({
  component: HomeRoute,
  loader: () => ({ crumb: "Home" }),
});
