import { createClientMutators } from "@/lib/client-mutators";
import { OpenAuthToken } from "@blank/auth/subjects";
import { schema } from "@blank/zero";
import {
  PostgresJSConnection,
  PushProcessor,
  ZQLDatabase,
} from "@rocicorp/zero/pg";
import { Resource } from "sst";
import postgres from "postgres";

export const processor = new PushProcessor(
  new ZQLDatabase(
    new PostgresJSConnection(postgres(Resource.Database.connection)),
    schema,
  ),
);

// whenever this grows, we can break it out the same way as client-mutators
export function createServerMutators(auth: OpenAuthToken | undefined) {
  const clientMutators = createClientMutators(auth);

  return {
    ...clientMutators,
  };
}
