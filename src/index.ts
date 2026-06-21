#!/usr/bin/env node
import { runMcp } from "@achmadya-dev/mcp-core";
import packageJson from "../package.json" with { type: "json" };
import {
  captureHealthCheckError,
  registerConnectionFailureSurface,
} from "./connection-status.js";
import { checkConnection } from "./sqlite/sqlite.js";
import { sqlite_ddl } from "./tools/sqlite_ddl.js";
import { sqlite_delete } from "./tools/sqlite_delete.js";
import { sqlite_insert } from "./tools/sqlite_insert.js";
import { sqlite_select } from "./tools/sqlite_select.js";
import { sqlite_update } from "./tools/sqlite_update.js";

const health = captureHealthCheckError(checkConnection);

await runMcp({
  name: "SQLite Database",
  version: packageJson.version,
  transport: "stdio",
  tools: [sqlite_select, sqlite_insert, sqlite_update, sqlite_delete, sqlite_ddl],
  healthCheck: health.check,
  setup(server) {
    const error = health.getError();
    if (error) registerConnectionFailureSurface(server, error);
  },
});
