import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import transactions from "./transaction.routes";

const app = new Hono()
  .get("/", async (c) => {
    return c.text("hono on cloudflare + sst!");
  })
  .route("/transactions", transactions);

export type AppType = typeof app;

export default handle(app);
