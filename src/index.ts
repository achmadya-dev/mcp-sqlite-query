#!/usr/bin/env node
import { startMcpServer } from "@achmadya-dev/mcp-core";
import packageJson from "../package.json" with { type: "json" };
import { sqlite_ddl } from "./tools/sqlite_ddl.js";
import { sqlite_delete } from "./tools/sqlite_delete.js";
import { sqlite_insert } from "./tools/sqlite_insert.js";
import { sqlite_select } from "./tools/sqlite_select.js";
import { sqlite_update } from "./tools/sqlite_update.js";

await startMcpServer({
  name: "SQLite Database",
  version: packageJson.version,
  tools: [sqlite_select, sqlite_insert, sqlite_update, sqlite_delete, sqlite_ddl],
});
