import { TransactionInsert } from "../db/transaction.schema";
import { generateRandom } from "../db/transaction";

// module for parsing natural language queries into data entities
export module nl {
  export async function toTransaction(
    input: string
  ): Promise<TransactionInsert> {
    return generateRandom();
  }
}
