import { transactions, transactionsSQL } from "@blank/core/db";

import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

const api = new Hono();

api.get("/", async (c) => {
  const all = await transactions.getAll();

  return c.json(all);
});

api.post(
  "/",
  zValidator(
    "json",
    z.object({
      body: z.object({
        transaction: transactionsSQL.TransactionInsertZod,
      }),
    })
  ),
  async (c) => {
    const { body } = c.req.valid("json");

    const newTransaction = await transactions.create(body.transaction);

    return c.json(newTransaction);
  }
);

api.post("/random", async (c) => {
  const newTransaction = await transactions.createRandom();

  return c.json(newTransaction);
});

export default api;
