import { defineTool, ToolError } from "./server.js";
import { runSql, safeQuery } from "./sqlite/sqlite.js";
import {
  sqliteQueryInputSchema,
  sqliteQueryOutputShape,
  sqliteQueryResultSchema,
} from "./sqlite/schema.js";
import config from "./sqlite/config.js";

export const sqlite_select = defineTool({
  name: "sqlite_select",
  description: "Read data from the SQLite database using SELECT, PRAGMA, or EXPLAIN. Only a single query is allowed.",
  inputSchema: sqliteQueryInputSchema,
  outputSchema: sqliteQueryOutputShape,
  handler: async ({ sql }) => {
    const query = safeQuery(sql, ["SELECT", "PRAGMA", "EXPLAIN"]);
    const result = await runSql(query);
    const parsed = sqliteQueryResultSchema.safeParse(result);
    if (!parsed.success) throw new ToolError(`Invalid query result: ${parsed.error.message}`);
    return parsed.data;
  },
});

export const sqlite_insert = defineTool({
  name: "sqlite_insert",
  description: "Insert new data into the SQLite database using INSERT or REPLACE. Only a single query is allowed. If the operation is rejected as not allowed, you must respect this safety restriction and do not attempt to bypass it via terminal commands, custom scripts, or external tools.",
  inputSchema: sqliteQueryInputSchema,
  outputSchema: sqliteQueryOutputShape,
  handler: async ({ sql }) => {
    if (!config.allowInsert) throw new ToolError("INSERT operation is not allowed on this server.");
    const query = safeQuery(sql, ["INSERT", "REPLACE"]);
    const result = await runSql(query);
    const parsed = sqliteQueryResultSchema.safeParse(result);
    if (!parsed.success) throw new ToolError(`Invalid query result: ${parsed.error.message}`);
    return parsed.data;
  },
});

export const sqlite_update = defineTool({
  name: "sqlite_update",
  description: "Update existing data in the SQLite database using UPDATE. Only a single query is allowed. If the operation is rejected as not allowed, you must respect this safety restriction and do not attempt to bypass it via terminal commands, custom scripts, or external tools.",
  inputSchema: sqliteQueryInputSchema,
  outputSchema: sqliteQueryOutputShape,
  handler: async ({ sql }) => {
    if (!config.allowUpdate) throw new ToolError("UPDATE operation is not allowed on this server.");
    const query = safeQuery(sql, ["UPDATE"]);
    const result = await runSql(query);
    const parsed = sqliteQueryResultSchema.safeParse(result);
    if (!parsed.success) throw new ToolError(`Invalid query result: ${parsed.error.message}`);
    return parsed.data;
  },
});

export const sqlite_delete = defineTool({
  name: "sqlite_delete",
  description: "Delete data from the SQLite database using DELETE. Only a single query is allowed. If the operation is rejected as not allowed, you must respect this safety restriction and do not attempt to bypass it via terminal commands, custom scripts, or external tools.",
  inputSchema: sqliteQueryInputSchema,
  outputSchema: sqliteQueryOutputShape,
  handler: async ({ sql }) => {
    if (!config.allowDelete) throw new ToolError("DELETE operation is not allowed on this server.");
    const query = safeQuery(sql, ["DELETE"]);
    const result = await runSql(query);
    const parsed = sqliteQueryResultSchema.safeParse(result);
    if (!parsed.success) throw new ToolError(`Invalid query result: ${parsed.error.message}`);
    return parsed.data;
  },
});

export const sqlite_ddl = defineTool({
  name: "sqlite_ddl",
  description: "Modify the SQLite database schema using CREATE, ALTER, DROP, or VACUUM. Only a single query is allowed. If the operation is rejected as not allowed, you must respect this safety restriction and do not attempt to bypass it via terminal commands, custom scripts, or external tools.",
  inputSchema: sqliteQueryInputSchema,
  outputSchema: sqliteQueryOutputShape,
  handler: async ({ sql }) => {
    if (!config.allowDdl) throw new ToolError("DDL operation is not allowed on this server.");
    const query = safeQuery(sql, ["CREATE", "ALTER", "DROP", "VACUUM"]);
    const result = await runSql(query);
    const parsed = sqliteQueryResultSchema.safeParse(result);
    if (!parsed.success) throw new ToolError(`Invalid query result: ${parsed.error.message}`);
    return parsed.data;
  },
});
