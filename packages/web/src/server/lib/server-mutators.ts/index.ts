import { createClientMutators } from "@/lib/client-mutators";
import { OpenAuthToken } from "@blank/auth/subjects";
import { schema } from "@blank/zero";
import { connectionProvider, PushProcessor } from "@rocicorp/zero/pg";
import postgres from "postgres";
import { Resource } from "sst";

export const processor = new PushProcessor(
  schema,
  connectionProvider(postgres(Resource.Database.connection))
);

// whenever this grows, we can break it out the same way as client-mutators
export function createServerMutators(auth: OpenAuthToken | undefined) {
  const clientMutators = createClientMutators(auth);

  return {
    ...clientMutators,
  };
}
