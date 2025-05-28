import { createClientMutators } from "@/lib/mutators";
import { schema } from "@blank/zero";

import { connectionProvider, PushProcessor } from "@rocicorp/zero/pg";
import postgres from "postgres";
import { OpenAuthToken } from "@blank/auth/subjects";
import { Resource } from "sst";

export const processor = new PushProcessor(
  schema,
  connectionProvider(postgres(Resource.Database.connection))
);

export function createServerMutators(auth: OpenAuthToken | undefined) {
  const clientMutators = createClientMutators(auth);

  return {
    ...clientMutators,
  };
}
