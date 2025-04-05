import { createSubjects } from "@openauthjs/openauth/subject";
import * as v from "valibot";

export const subjects = createSubjects({
  user: v.object({
    userID: v.string(),
  }),
});

export type OpenAuthUser = typeof subjects.user;
