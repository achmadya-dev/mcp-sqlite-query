import { defineTool, ToolError } from "@achmadya-dev/mcp-core";
import { z } from "zod";
import { runSql, safeQuery } from "../sqlite/sqlite.js";
import {
  sqliteQueryInputSchema,
  sqliteQueryOutputShape,
  sqliteQueryResultSchema,
} from "../sqlite/schema.js";
import config from "../sqlite/config.js";

export const sqlite_delete = defineTool({
  name: "sqlite_delete",
  description:
    "Delete data from the SQLite database using DELETE. Only a single query is allowed. If the operation is rejected as not allowed, you must respect this safety restriction and do not attempt to bypass it via terminal commands, custom scripts, or external tools.",
  inputSchema: sqliteQueryInputSchema,
  outputSchema: sqliteQueryOutputShape,
  handler: async ({ sql }) => {
    if (!config.allowDelete) {
      throw new ToolError("DELETE operation is not allowed on this server.");
    }
    const query = safeQuery(sql, ["DELETE"]);
    const result = await runSql(query);
    const parsed = sqliteQueryResultSchema.safeParse(result);
    if (!parsed.success) {
      throw new ToolError(`Invalid query result: ${parsed.error.message}`);
    }
    return parsed.data;
  },
});
