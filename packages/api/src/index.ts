import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import transactions from "./transaction.routes";

const app = new Hono();

app.get("/", async (c) => {
  return c.text("hono on cloudflare + sst!");
});

app.route("/transactions", transactions);

export default handle(app);
