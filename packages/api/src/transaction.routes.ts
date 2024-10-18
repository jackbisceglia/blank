import * as z from "zod";

import { TransactionInsert, transaction } from "@blank/core/db";

import { Hono } from "hono";
import { nl } from "@blank/core/ai";
// fix imports
import { zValidator } from "@hono/zod-validator";

const api = new Hono()
  .get("/", async (c) => {
    const all = await transaction.getAll();

    return c.json(all);
  })
  .post(
    "/",
    zValidator(
      "json",
      z.object({
        body: z.object({
          // TODO: replace with new zod schema exported from core/ai
          payload: TransactionInsert.or(z.string()),
        }),
      })
    ),
    async (c) => {
      const { body } = c.req.valid("json");

      // here we either get the transaction, or generate it via ai depending on the shape of body
      async function deriveTransactionInsertion() {
        const toInsert =
          typeof body.payload === "string"
            ? await nl.toTransaction(body.payload)
            : body.payload;

        return toInsert;
      }

      const newTransaction = await transaction.create(
        await deriveTransactionInsertion()
      );

      return c.json(newTransaction);
    }
  )
  .delete(
    "/",
    zValidator(
      "json",
      z.object({
        body: z.object({
          action: z.literal(`all`),
        }),
      })
    ),
    async (c) => {
      console.log("hit?");
      const { body } = c.req.valid("json");
      switch (body.action) {
        case "all":
          const deleted = await transaction.deleteAll();
          console.log(deleted.rowCount);

          return c.json(deleted);
      }
    }
  )
  .post("/random", async (c) => {
    const newTransaction = await transaction.createRandom();

    return c.json(newTransaction);
  });

export default api;
