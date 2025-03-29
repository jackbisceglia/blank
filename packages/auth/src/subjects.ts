import { createSubjects } from "@openauthjs/openauth/subject";
import { type } from "arktype";

export const subjects = createSubjects({
  user: type({ userID: type.string }),
});

export type OpenAuthUser = typeof subjects.user;
