#!/usr/bin/env node
import { Server } from "./mcp/server.js";
import packageJson from "../package.json" with { type: "json" };
import {
  sqlite_select,
  sqlite_insert,
  sqlite_update,
  sqlite_delete,
  sqlite_ddl,
} from "./mcp/registry.js";

async function main(): Promise<void> {
  const server = new Server({
    name: "SQLite Database",
    version: packageJson.version,
  });

  server.registerTool(sqlite_select);
  server.registerTool(sqlite_insert);
  server.registerTool(sqlite_update);
  server.registerTool(sqlite_delete);
  server.registerTool(sqlite_ddl);

  await server.start();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
