import { requireAuthenticated } from './utils';

import { nlToParsedTransaction, TransactionParseable } from '@blank/core/ai';
import { transaction, TransactionInsertWithPayees } from '@blank/core/db';

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import * as z from 'zod';

import { setTimeout } from 'timers/promises';

const CreateBodySchema = z.union([
  z.object({
    type: z.literal('default'),
    payload: TransactionInsertWithPayees,
  }),
  z.object({
    type: z.literal('natural_language'),
    payload: z.string(), // bring this into nl module/dir w/ more constraints
  }),
]);

const api = new Hono()
  .get('/', async (c) => {
    requireAuthenticated(c);
    console.log(c.req.header('Authorization'));

    const all = await transaction.getAll();

    return c.json(all);
  })
  .post(
    '/',
    zValidator('json', z.object({ body: CreateBodySchema })),
    async (c) => {
      const auth = requireAuthenticated(c);

      const { body } = c.req.valid('json');

      const getInsertableFromNl = async (input: string, userId: string) => {
        const parsed = await nlToParsedTransaction(input);

        const transformed = transaction.transformParsedToInsertable(
          parsed ?? ({} as TransactionParseable),
          userId,
        );

        return transformed;
      };

      // here we either get the transaction, or generate it via ai depending on the shape of body
      const insertableTransactionData =
        body.type === 'default'
          ? body.payload
          : await getInsertableFromNl(body.payload, auth.userId);

      const rows = await transaction.create(insertableTransactionData);

      if (!rows.length) {
        throw new Error('Failed to create transaction');
      }

      const newTransaction = rows[0];

      const newPayees = await transaction.createPayees(
        insertableTransactionData.payees,
        newTransaction.id,
      );

      return c.json({
        ...newTransaction,
        payees: newPayees,
      });
    },
  )
  .delete(
    '/:id',
    zValidator(
      'param',
      z.object({
        id: z.string(),
      }),
    ),
    async (c) => {
      requireAuthenticated(c);

      await setTimeout(3000);

      const param = c.req.valid('param');

      const rows = await transaction.deleteById(param.id);

      if (!rows.length) {
        throw new Error('Failed to create transaction');
      }

      const deletedTransaction = rows[0];

      return c.json(deletedTransaction);
    },
  );

export default api;
