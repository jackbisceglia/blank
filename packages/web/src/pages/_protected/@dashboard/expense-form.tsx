import { withToast } from "@/lib/toast";
import { Group } from "@blank/zero";
import * as v from "valibot";
import { useCreateExpense } from "../@data/expenses";
import { FieldsErrors, useAppForm } from "@/components/form";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useStore } from "@tanstack/react-form";
import { Match } from "effect";
import { cn, prevented } from "@/lib/utils";
import { positions } from "@/components/form/fields";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { toast } from "sonner";

const constraints = {
  images: {
    identifier: 3,
    files: {
      submit: {
        max: 2,
      },
      upload: {
        max: 5,
      },
    },
  },
  description: {
    max: 180,
  },
};

type FileData = { id: string; result: string };

const schema = v.pipe(
  v.object({
    description: v.pipe(
      v.string("Description is required"),
      v.maxLength(
        constraints.description.max,
        `Description must be at most 180 characters`,
      ),
    ),
    files: v.pipe(
      v.array(
        v.object({
          id: v.pipe(v.string(), v.uuid()),
          result: v.pipe(
            v.string("must be string"),
            v.startsWith("data:image/", "File is not in image format"),
            v.includes(";base64,", "Can not be decoded"),
            v.transform((data) => {
              return data.split(",").at(-1) ?? "";
            }),
            v.minLength(1),
            v.base64(),
          ),
        }),
      ),
      v.maxLength(
        constraints.images.files.submit.max,
        "You can submit at most 2 images",
      ),
    ),
  }),
  v.check((object) => {
    return Object.values(object).reduce(
      (acc, curr) => acc || curr.length > 0,
      false,
    );
  }),
);

type UsePasteImageOptions = {
  dispatch: (
    options:
      | { _tag: "add"; payload: FileData[] }
      | { _tag: "remove"; payload: FileData },
  ) => void;
  registered: number;
};

function useImageFiles(options: UsePasteImageOptions) {
  const isImage = (file: File) =>
    file && file.type && file.type.startsWith("image/");

  function fileToBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event: ProgressEvent<FileReader>) => {
        const result = event.target?.result;
        if (typeof result === "string") {
          resolve(result);
        } else {
          reject(new Error("Failed to read file as string"));
        }
      };

      reader.onerror = () => {
        reject(new Error("File reading failed"));
      };

      reader.readAsDataURL(file);
    });
  }

  async function handleSubmit(files: File[]) {
    if (!files.length) return [];
    const max = constraints.images.files.upload.max;

    const remaining = Math.max(0, max - options.registered);

    const filesToUpload = files.slice(0, remaining);
    const filesBlocked = files.length - filesToUpload.length;

    if (filesBlocked > 0 || remaining <= 0) {
      toast.dismiss();
      return toast.error(`Maximum upload limit reached (${max})`, {
        description:
          remaining > 0 &&
          `Only ${remaining} more image${remaining > 1 ? "s" : ""} can be added`,
      });
    }

    async function submitSingleFile(file: File) {
      const base64 = await fileToBase64(file);
      const entry = { result: base64, id: crypto.randomUUID() };

      options.dispatch({ _tag: "add", payload: [entry] });
    }

    await Promise.all(
      files.map(async (file) => {
        const promise = submitSingleFile(file);

        withToast({
          promise,
          notify: {
            loading: "Uploading file",
            success: `Image uploaded`,
            error: "Failed to upload image",
          },
        });
      }),
    );
  }

  async function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    if (!e.clipboardData?.items) return [];

    const files = [...e.clipboardData.items]
      .filter((pasted) => pasted.kind === "file")
      .map((pasted) => pasted.getAsFile())
      .filter((file) => !!file)
      .filter((file) => isImage(file));

    if (files.length > 0) {
      e.preventDefault();
      await handleSubmit(files);
    }
  }

  return { handlePaste, handleSubmit, dispatch: options.dispatch };
}

type ExpenseFormProps = { defaultGroup: Group };

export function ExpenseForm(props: ExpenseFormProps) {
  const fieldErrorsId = "create-expense-errors";

  const createExpense = useCreateExpense(props.defaultGroup.id);

  const form = useAppForm({
    defaultValues: { description: "", files: [] as FileData[] },
    validators: { onChange: schema },
    onSubmit: async (opts) => {
      const promise = createExpense(
        opts.value.description,
        opts.value.files.map((f) => f.result),
      );

      const result = await withToast({
        promise,
        action: (
          <Button
            variant="link"
            size="xs"
            className="ml-auto h-full py-0.5 data-[status=active]:no-underline data-[status=active]:cursor-default"
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

  const registered = useStore(form.store, (store) => store.values.files);
  const num = useMemo(() => registered.length, [registered]);

  const images = useImageFiles({
    registered: num,
    dispatch(options) {
      const updater = Match.type<typeof options>().pipe(
        Match.tag("add", function ({ payload }) {
          return (files: FileData[]) => [...payload, ...files];
        }),
        Match.tag("remove", function ({ payload }) {
          return (files: FileData[]) =>
            files.filter((f) => f.id !== payload.id);
        }),
        Match.orElseAbsurd,
      );

      form.setFieldValue("files", updater(options));
      form.validate("change");
    },
  });

  return (
    <>
      <div className="pb-4">
        <form
          onSubmit={prevented(() => void form.handleSubmit())}
          className={cn(
            "gap-2 border-[#8089BA] flex items-center border-2 rounded-md focus-within:border-[#B3BEF5] focus-within:ring-ring/20 focus-within:ring-[1.5px] p-1.5 bg-sidebar hover:border-[#B3BEF5] duration-300",
            "data-dragging:border-blank-theme data-dragging:border-4",
          )}
        >
          <form.AppField
            name="description"
            children={(field) => (
              <field.TextField
                errorPosition={positions.custom({ elementId: fieldErrorsId })}
                inputProps={{
                  placeholder: "ordered dinner with...",
                  "aria-label": "Expense Description",
                  onPaste: images.handlePaste,
                  className:
                    "bg-transparent flex-1 border-none text-left focus-visible:ring-0 focus-visible:ring-offset-0 px-1.5 py-1 placeholder:text-muted-foreground/90 rounded-none h-auto hover:bg-transparent",
                }}
              />
            )}
          />
          <form.AppField name="files" children={() => null} />

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
                    (
                      e.currentTarget.previousSibling as HTMLInputElement
                    ).focus();
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
      </div>

      <div className="h-6.5 flex gap-2">
        <form.Subscribe
          selector={(state) => state.values.files}
          children={(files) =>
            files.map((file) => {
              if (!file.result) return;
              return (
                <Badge
                  key={file.id}
                  className="lowercase py-0 gap-1.5 pl-2 !pr-0 border border-foreground/40 bg-secondary text-foreground/80 text-xs font-medium max-w-48"
                >
                  <span className="truncate">img-{file.id.slice(-3)}</span>
                  <Button
                    onClick={() =>
                      images.dispatch({ _tag: "remove", payload: file })
                    }
                    variant="ghost"
                    size="icon"
                    className="h-min hover:bg-transparent py-[0.25rem] px-1 "
                  >
                    <X className="size-4" />
                  </Button>
                </Badge>
              );
            })
          }
        />
      </div>
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
