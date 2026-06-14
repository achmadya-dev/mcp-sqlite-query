import { envBool, envInt, envStr } from "@achmadya-dev/mcp-core";

export default {
  dbPath: envStr("SQLITE_DB_PATH", ":memory:"),
  maxRows: envInt("SQLITE_MAX_ROWS", 500),
  allowInsert: envBool("ALLOW_INSERT_OPERATION"),
  allowUpdate: envBool("ALLOW_UPDATE_OPERATION"),
  allowDelete: envBool("ALLOW_DELETE_OPERATION"),
  allowDdl: envBool("ALLOW_DDL_OPERATION"),
};
