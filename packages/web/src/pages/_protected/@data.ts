import { createFromDescriptionServerFn } from "@/server/expense.route";
import { hydrateAsyncServerResult } from "@blank/core/utils";
import { useParams } from "@tanstack/react-router";
import { useGetGroupBySlug } from "./groups/@data";
import { useRecordQuery, useZero } from "@/lib/zero.provider";
import { constants } from "@/lib/utils";
import { useAuthentication } from "@/lib/auth.provider";
import { errAsync } from "neverthrow";

function useGetUserDefaultGroup(userId: string) {
  const z = useZero();
  const query = z.query.preference.where("userId", userId).one();
  return useRecordQuery(query, { ttl: constants.zero_ttl });
}

export function useCreateExpense() {
  const auth = useAuthentication();
  const { slug } = useParams({ strict: false });
  const group = useGetGroupBySlug(slug ?? "");
  const userPreferences = useGetUserDefaultGroup(auth.user.id);
  const groupId = group.data?.id ?? userPreferences.data?.defaultGroupId;

  return (description: string) => {
    if (!groupId) {
      const message =
        group.data?.id && userPreferences.data?.defaultGroupId
          ? "No default group found"
          : "Could not find group to insert";

      return errAsync(new Error(message));
    }

    return hydrateAsyncServerResult(() =>
      createFromDescriptionServerFn({ data: { description, groupId } })
    );
  };
}
