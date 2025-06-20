import { createFileRoute } from "@tanstack/react-router";
import { constants } from "@/lib/utils";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useAuthentication } from "@/lib/authentication";
import { PrimaryHeading } from "@/components/prose";
import * as v from "valibot";

const avatarSrc = v.parser(
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
);

const avatarFallback = v.parser(
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
);

function HomeRoute() {
  const auth = useAuthentication();

  return (
    <div className="flex flex-row items-center gap-4">
      <Avatar className="w-12 h-12 rounded-sm">
        {/* TODO: don't know if this is proper alt text  */}
        <AvatarImage src={avatarSrc(auth.user.image)} alt="User Avatar" />
        <AvatarFallback>{avatarFallback(auth.user.name)}</AvatarFallback>
      </Avatar>
      <PrimaryHeading>Welcome Back, {auth.user.name}</PrimaryHeading>
    </div>
  );
}

export const Route = createFileRoute("/_protected/")({
  ssr: false,
  component: HomeRoute,
  loader: () => ({ crumb: "Home" }),
});
