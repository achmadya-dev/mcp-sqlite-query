import { defineTool, ToolError } from "@achmadya-dev/mcp-core";
import { z } from "zod";
import { runSql, safeQuery } from "../sqlite/sqlite.js";
import {
  sqliteQueryInputSchema,
  sqliteQueryOutputShape,
  sqliteQueryResultSchema,
} from "../sqlite/schema.js";

export const sqlite_select = defineTool({
  name: "sqlite_select",
  description:
    "Read data from the SQLite database using SELECT, PRAGMA, or EXPLAIN. Only a single query is allowed.",
  inputSchema: sqliteQueryInputSchema,
  outputSchema: sqliteQueryOutputShape,
  handler: async ({ sql }) => {
    const query = safeQuery(sql, ["SELECT", "PRAGMA", "EXPLAIN"]);
    const result = await runSql(query);
    const parsed = sqliteQueryResultSchema.safeParse(result);
    if (!parsed.success) {
      throw new ToolError(`Invalid query result: ${parsed.error.message}`);
    }
    return parsed.data;
  },
});
