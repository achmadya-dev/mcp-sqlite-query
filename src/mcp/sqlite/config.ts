function envBool(name: string, defaultVal = false): boolean {
  const v = Reflect.get(process.env, name);
  if (v === undefined) return defaultVal;
  return ["1", "true", "yes", "on"].includes(v.trim().toLowerCase());
}

function envInt(name: string, defaultVal: number, min = 1): number {
  const raw = Reflect.get(process.env, name);
  if (raw === undefined) return defaultVal;
  const n = parseInt(raw, 10);
  return Number.isNaN(n) || n < min ? defaultVal : n;
}

function envStr(name: string, defaultVal = ""): string {
  const raw = Reflect.get(process.env, name);
  if (raw === undefined) return defaultVal;
  const v = raw.trim();
  return v || defaultVal;
}

export default {
  dbPath: envStr("SQLITE_DB_PATH", ":memory:"),
  maxRows: envInt("SQLITE_MAX_ROWS", 500),
  allowInsert: envBool("ALLOW_INSERT_OPERATION"),
  allowUpdate: envBool("ALLOW_UPDATE_OPERATION"),
  allowDelete: envBool("ALLOW_DELETE_OPERATION"),
  allowDdl: envBool("ALLOW_DDL_OPERATION"),
};
