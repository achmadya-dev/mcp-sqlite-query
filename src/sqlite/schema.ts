import { z } from "zod";

const rowValue = z.union([z.string(), z.number(), z.boolean(), z.null()]);

export const sqliteQueryInputSchema = z.object({
  sql: z
    .string()
    .check(
      z.trim(),
      z.minLength(1, "SQL cannot be empty"),
      z.maxLength(100_000, "SQL is too long (max 100,000 characters)")
    )
    .describe("A single SQL statement. Multiple statements separated by ';' are not allowed."),
});

export const sqliteQueryOutputShape = z.object({
  kind: z.enum(["resultset", "execute"]),
  columns: z.array(z.string()).optional(),
  rowCount: z.number().int().nonnegative().optional(),
  totalRows: z.number().int().nonnegative().optional(),
  truncated: z.boolean().optional(),
  maxRows: z.number().int().positive().optional(),
  rows: z.array(z.record(z.string(), rowValue)).optional(),
  affectedRows: z.number().int().nonnegative().optional(),
  insertId: z.string().nullable().optional(),
});

export const sqliteQueryResultSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("resultset"),
    columns: z.array(z.string()),
    rowCount: z.number().int().nonnegative(),
    totalRows: z.number().int().nonnegative(),
    truncated: z.boolean(),
    maxRows: z.number().int().positive(),
    rows: z.array(z.record(z.string(), rowValue)),
  }),
  z.object({
    kind: z.literal("execute"),
    affectedRows: z.number().int().nonnegative(),
    insertId: z.string().nullable(),
  }),
]);

export type SqliteQueryResult = z.infer<typeof sqliteQueryResultSchema>;
