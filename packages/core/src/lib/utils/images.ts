import * as v from "valibot";

export const imageDataUrlRegex =
  /data:(image+\/[-+\w.]+)?(;?\w+=[-.\w]+)*(;base64),.*/;

export const ImageDataUrlSchema = v.pipe(
  v.string("must be string"),
  v.regex(imageDataUrlRegex),
  v.check((data) => {
    const result = v.safeParse(
      v.pipe(v.string(), v.minLength(1), v.base64()),
      data.split(",").at(-1) ?? "",
    );

    if (result.success) {
      return true;
    }

    return false;
  }),
);

export type Supported = "jpeg" | "jpg" | "png" | "svg" | "webp" | "heic";
export type ImageDataUrl = `data:image/${Supported};base64,${string}`;
