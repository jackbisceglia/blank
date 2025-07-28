import { createFileRoute, Link } from "@tanstack/react-router";
import { cn, constants, prevented } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthentication } from "@/lib/authentication";
import { PrimaryHeading } from "@/components/prose";
import * as v from "valibot";
import { GroupBody, States } from "./groups/$slug_id/layout";
import { PageHeaderRow } from "@/components/layouts";
import { ascii } from "@/lib/ascii";
import { Button } from "@/components/ui/button";
import { useCreateExpense } from "./@data/expenses";
import { withToast } from "@/lib/toast";
import { X } from "lucide-react";
import { FieldsErrors, useAppForm } from "@/components/form";
import { schema as createExpenseSchema } from "./@create-expense.dialog";
import { positions } from "@/components/form/fields";
import { useUserDefaultGroup } from "./@data/users";
import { TaggedError } from "@blank/core/lib/effect/index";
import { Group } from "@blank/zero";

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

type ExpenseFormProps = { defaultGroup: Group };

function ExpenseForm(props: ExpenseFormProps) {
  const createExpense = useCreateExpense(props.defaultGroup.id);

  const form = useAppForm({
    defaultValues: { description: "" },
    validators: { onChange: createExpenseSchema },
    onSubmit: async (opts) => {
      const promise = createExpense(opts.value.description);

      const result = await withToast({
        promise,
        action: (
          <Button
            variant="link"
            size="xs"
            className="ml-auto h-full py-0.5"
            asChild
          >
            <Link
              to="/groups/$slug_id"
              params={{
                slug_id: {
                  id: props.defaultGroup.id,
                  slug: props.defaultGroup.slug,
                },
              }}
              activeProps={{ "aria-disabled": true }}
            >
              View Group
            </Link>
          </Button>
        ),
        notify: {
          loading: "Creating expense...",
          success: "Expense created",
          error: "Unable to create expense",
        },
      });

      opts.formApi.reset();

      return result;
    },
  });

  const fieldErrorsId = "create-expense-errors";

  return (
    <>
      <form
        onSubmit={prevented(() => void form.handleSubmit())}
        className="gap-2 border-[#8089BA] flex items-center border-2 rounded-md focus-within:border-[#B3BEF5] focus-within:ring-ring/20 focus-within:ring-[1.5px] p-1.5 bg-sidebar hover:border-[#B3BEF5] duration-300"
      >
        <form.AppField
          name="description"
          children={(field) => (
            <field.TextField
              errorPosition={positions.custom({ elementId: fieldErrorsId })}
              inputProps={{
                placeholder: "ordered dinner with...",
                "aria-label": "Expense Description",
                className:
                  "bg-transparent flex-1 border-none text-left focus-visible:ring-0 focus-visible:ring-offset-0 px-1.5 py-1 placeholder:text-muted-foreground/90 rounded-none h-auto hover:bg-transparent",
              }}
            />
          )}
        />

        <form.Subscribe
          selector={(state) => state.values.description}
          children={(value) =>
            !!value.length && (
              <Button
                variant="ghost"
                type="button"
                size="xs"
                className="self-stretch w-min px-6 hover:bg-secondary"
                onClick={(e) => {
                  form.resetField("description");
                  (e.currentTarget.previousSibling as HTMLInputElement).focus();
                }}
              >
                <X className="size-3" />
              </Button>
            )
          }
        />

        <form.AppForm>
          <form.SubmitButton
            className="self-stretch w-min px-6"
            dirty={{ disableForAria: true }}
          >
            Split
          </form.SubmitButton>
        </form.AppForm>
      </form>
      <form.Subscribe
        selector={(state) => state.fieldMeta}
        children={(fieldMeta) => (
          <FieldsErrors
            id={fieldErrorsId}
            ul={{ className: "col-span-full min-h-24" }}
            li={{ className: "text-left w-auto" }}
            metas={fieldMeta}
          />
        )}
      />
    </>
  );
}

function HomeRoute() {
  const authentication = useAuthentication();
  const userDefaultGroup = useUserDefaultGroup(authentication.user.id);
  console.log(userDefaultGroup.status);

  if (userDefaultGroup.status === "loading") return <States.Loading />;
  if (userDefaultGroup.status === "not-found") {
    throw new DataFetchingError("Could not load user preferences");
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
            <ExpenseForm defaultGroup={userDefaultGroup.data} />
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
