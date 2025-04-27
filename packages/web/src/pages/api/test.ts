import { AuthTokens } from "@/server/utils";
import { json } from "@tanstack/react-start";
import { createAPIFileRoute } from "@tanstack/react-start/api";

export const APIRoute = createAPIFileRoute("/api/test")({
  GET: ({}) => {
    console.log("cookies: ", AuthTokens.cookies.get());
    return json({ message: "Hello '/api/test'!" });
  },
});
