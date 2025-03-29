import { createFileRoute } from "@tanstack/react-router";
import { match, type } from "arktype";
import { constants } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthentication } from "@/lib/auth/react";
import { PrimaryHeading } from "@/components/prose";

// optimization: if we have more domain suffixes to strip, we may want to use a more dynamic matcher
const googleThumbnailSuffixMatcher =
  `string.url & /${constants.googleThumbnailSuffix}$/` as const;

const imageSourceNormalized = match({
  [googleThumbnailSuffixMatcher]: (url) =>
    url.slice(0, url.length - constants.googleThumbnailSuffix.length),
  "string.url": (url) => url,
  default: "assert",
});

const matchAvatarFallbackFromName = type.match({
  "/^\\w+\\s\\w+$/": (name) =>
    name
      .split(" ")
      .map((word) => word[0].toUpperCase())
      .join(""),
  "string > 0": (name) => name.charAt(0).toUpperCase(),
  default: () => "U",
});

function HomePage() {
  const auth = useAuthentication();

  console.log(imageSourceNormalized(auth.user.image));

  return (
    <div className="flex flex-row items-center gap-4">
      <Avatar className="w-12 h-12 rounded-sm">
        <AvatarImage
          src={imageSourceNormalized(auth.user.image)}
          alt="User Avatar"
        />
        <AvatarFallback>
          {matchAvatarFallbackFromName(auth.user.name)}
        </AvatarFallback>
      </Avatar>
      <PrimaryHeading>Welcome Back, {auth.user.name}</PrimaryHeading>
    </div>
  );
}

export const Route = createFileRoute("/_protected/")({
  ssr: false,
  component: HomePage,
});
