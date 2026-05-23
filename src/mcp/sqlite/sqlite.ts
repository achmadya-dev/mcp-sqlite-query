import { DatabaseSync, StatementSync } from "node:sqlite";
import { ToolError } from "../server.js";
import config from "./config.js";
import * as helpers from "./helpers.js";

interface StatementSyncWithColumns extends StatementSync {
  columns(): Array<{ name: string; column: string | null; table: string | null; database: string | null; type: string | null }>;
}

export function safeQuery(sql: string, allowedPrefixes: string[]): string {
  const { cleanSql, prefixes } = helpers.validateInputs(sql, allowedPrefixes);
  const statement = helpers.parseSingleStatement(cleanSql);
  helpers.validateStatement(statement, prefixes);
  return statement;
}

export async function runSql(sql: string): Promise<
  | {
      kind: "resultset";
      columns: string[];
      rowCount: number;
      totalRows: number;
      truncated: boolean;
      maxRows: number;
      rows: Record<string, unknown>[];
    }
  | {
      kind: "execute";
      affectedRows: number;
      insertId: string | null;
    }
> {
  let db: DatabaseSync | null = null;
  try {
    db = new DatabaseSync(config.dbPath);

    const stmt = db.prepare(sql) as StatementSyncWithColumns;
    const columnsInfo = stmt.columns();

    if (columnsInfo && columnsInfo.length > 0) {
      const columns = columnsInfo.map((c) => c.name || "");
      const all = stmt.all() as Record<string, unknown>[];
      const truncated = all.length > config.maxRows;
      const display = all.slice(0, config.maxRows);

      return {
        kind: "resultset",
        columns,
        rowCount: display.length,
        totalRows: all.length,
        truncated,
        maxRows: config.maxRows,
        rows: display,
      };
    }

    const result = stmt.run();
    const insertId =
      result.lastInsertRowid !== undefined && result.lastInsertRowid !== null
        ? String(result.lastInsertRowid)
        : null;

    return {
      kind: "execute",
      affectedRows: Number(result.changes ?? 0),
      insertId,
    };
  } catch (e) {
    throw new ToolError(
      `SQLite: ${e instanceof Error ? e.message : String(e)}`
    );
  } finally {
    if (db) {
      try {
        db.close();
      } catch {
        // Ignore close errors
      }
    }
  }
}
