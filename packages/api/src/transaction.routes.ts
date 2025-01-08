import { requireAuthenticated } from './utils';

import { models, nlToParsedTransaction, providers } from '@blank/core/ai';
import {
  TransactionInsertWithTransactionMembers,
  group,
  preference,
  transaction,
} from '@blank/core/db';

import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import * as z from 'zod';

const CreateBodySchema = z.union([
  z.object({
    type: z.literal('default'),
    payload: TransactionInsertWithTransactionMembers,
  }),
  z.object({
    type: z.literal('natural_language'),
    payload: z.object({
      nl: z.string().refine((input) => input.split(' ').length >= 3),
      groupId: z.string().optional(),
    }),
  }),
]);

const api = new Hono()
  .get('/', async (c) => {
    const auth = requireAuthenticated(c);

    const all = await transaction.getAllByUserId(auth.userId);

    return c.json(all);
  })
  .post(
    '/',
    zValidator('json', z.object({ body: CreateBodySchema })),
    async (c) => {
      // const isTruthy = (value: string | null | undefined) =>
      //   value !== null && value !== undefined;

      const auth = requireAuthenticated(c);

      const { body } = c.req.valid('json');

      console.log('GROUP ID FROM BODY: ', body.payload.groupId);
      const groupId =
        body.payload.groupId ??
        (await preference.getDefaultGroupId(auth.userId))?.defaultGroupId;

      if (!groupId) {
        throw new Error('No default group found');
      }

      const getInsertableFromNl = async (
        input: string,
        userId: string,
        groupId: string,
      ): Promise<TransactionInsertWithTransactionMembers> => {
        const parsed = await nlToParsedTransaction(input, {
          llm: {
            provider: providers.default,
            model: models.default.default,
          },
        });

        if (!parsed) {
          throw new Error('Failed to parse transaction');
        }

        const transformed = await transaction.transformParsedToInsertable(
          parsed,
          userId,
          groupId,
        );

        return transformed;
      };

      // here we either get the transaction, or generate it via ai depending on the shape of body
      const insertableTransactionData =
        body.type === 'default'
          ? body.payload
          : await getInsertableFromNl(body.payload.nl, auth.userId, groupId);

      if (
        insertableTransactionData.transactionMembers.find(
          (m) => m.userId === insertableTransactionData.payerId,
        )
      ) {
        throw new Error('Payer can not also be a payee');
      }

      const rows = await transaction.create({
        ...insertableTransactionData,
      });

      if (!rows.length) {
        throw new Error('Failed to create transaction');
      }

      const newTransaction = rows[0];

      const newPayees = await transaction.createTransactionMembers(
        insertableTransactionData.transactionMembers.map((p) => p.userId),
        newTransaction.groupId,
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
        transactionId: z.string(),
        groupId: z.string(),
      }),
    ),
    async (c) => {
      const auth = requireAuthenticated(c);
      const param = c.req.valid('param');

      const isMember = await group.hasUserAsMember(param.groupId, auth.userId);

      if (!isMember) {
        throw new Error(
          'You do not have permission to delete this transaction',
        );
      }

      const rows = await transaction.deleteById(param.transactionId);

      if (!rows.length) {
        throw new Error('Failed to delete transaction');
      }

      const deletedTransaction = rows[0];

      return c.json(deletedTransaction);
    },
  )
  .delete(
    '/',
    zValidator(
      'json',
      z.object({
        body: z.object({
          ids: z
            .object({
              transactionId: z.string(),
              groupId: z.string(),
            })
            .array(),
        }),
      }),
    ),
    async (c) => {
      const auth = requireAuthenticated(c);

      const payload = c.req.valid('json');

      const groupIds = (await group.getAllByUserId(auth.userId)).map(
        (g) => g.id,
      );

      if (!payload.body.ids.every((id) => groupIds.includes(id.groupId))) {
        throw new Error(
          'You do not have permission to delete this transaction',
        );
      }

      const rows = await transaction.deleteByIds(
        payload.body.ids.map((id) => id.transactionId),
      );

      if (!rows.length) {
        throw new Error('Failed to delete transaction');
      }

      const deletedTransactions = rows;

      return c.json(deletedTransactions);
    },
  );

export default api;
