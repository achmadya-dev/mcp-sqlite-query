import { beforeEach, describe, expect, it, jest } from "@jest/globals";

describe("safeQuery", () => {
  let safeQuery: typeof import("../sqlite.js").safeQuery;

  beforeEach(async () => {
    ({ safeQuery } = await import("../sqlite.js"));
  });

  it("allows queries with matching prefixes", () => {
    const res = safeQuery("SELECT id FROM users", ["SELECT", "EXPLAIN"]);
    expect(res).toBe("SELECT id FROM users");
  });

  it("rejects queries with non-matching prefixes", () => {
    expect(() => safeQuery("INSERT INTO users", ["SELECT"])).toThrow(
      /SQL query is not allowed/
    );
  });

  it("allows a trailing semicolon on a single query", () => {
    const res = safeQuery("SELECT 1;", ["SELECT"]);
    expect(res).toBe("SELECT 1");
  });

  it("allows semicolons inside string literals", () => {
    const res = safeQuery("SELECT * FROM users WHERE email = 'a;b';", ["SELECT"]);
    expect(res).toBe("SELECT * FROM users WHERE email = 'a;b'");
  });

  it("rejects multiple queries separated by semicolons", () => {
    expect(() => safeQuery("SELECT 1; SELECT 2", ["SELECT"])).toThrow(
      /Only a single SQL query is allowed/
    );
  });

  it("throws an error if the query is empty", () => {
    expect(() => safeQuery("  ", ["SELECT"])).toThrow(/SQL query cannot be empty/);
  });

  it("allows a single-line comment at the start of the query", () => {
    const res = safeQuery("-- komentar ini\nSELECT 1", ["SELECT"]);
    expect(res).toBe("-- komentar ini\nSELECT 1");
  });

  it("allows a block comment at the start of the query", () => {
    const res = safeQuery("/* komentar blok */ SELECT 1", ["SELECT"]);
    expect(res).toBe("/* komentar blok */ SELECT 1");
  });

  it("allows double single quotes inside string literals", () => {
    const res = safeQuery("SELECT 'it''s fine'", ["SELECT"]);
    expect(res).toBe("SELECT 'it''s fine'");
  });

  it("allows backslash escape inside string literals", () => {
    const res = safeQuery("SELECT 'Achmad\\'s book'", ["SELECT"]);
    expect(res).toBe("SELECT 'Achmad\\'s book'");
  });

  it("allows MSSQL bracket identifiers", () => {
    const res = safeQuery("SELECT [column;name] FROM users", ["SELECT"]);
    expect(res).toBe("SELECT [column;name] FROM users");
  });

  it("rejects queries with unterminated single quotes", () => {
    expect(() => safeQuery("SELECT 'hello", ["SELECT"])).toThrow(
      /Unterminated single quote string/
    );
  });

  it("rejects queries with unterminated block comments", () => {
    expect(() => safeQuery("/* komentar SELECT 1", ["SELECT"])).toThrow(
      /Unterminated block comment/
    );
  });

  it("rejects dangerous SQL patterns like XP_CMDSHELL or LOAD_FILE", () => {
    expect(() => safeQuery("SELECT LOAD_FILE('/etc/passwd')", ["SELECT"])).toThrow(
      /Dangerous SQL pattern detected/
    );
    expect(() => safeQuery("EXEC xp_cmdshell 'dir'", ["EXEC", "SELECT"])).toThrow(
      /Dangerous SQL pattern detected/
    );
  });
});

describe("runSql", () => {
  const mockPrepare = jest.fn<() => any>();
  const mockClose = jest.fn<() => void>();
  const mockDatabaseSync = jest.fn(() => ({
    prepare: mockPrepare,
    close: mockClose,
  }));

  beforeEach(async () => {
    jest.resetModules();
    mockPrepare.mockReset();
    mockClose.mockReset();
    mockDatabaseSync.mockReset();

    mockClose.mockImplementation(() => {});
    mockDatabaseSync.mockImplementation(() => ({
      prepare: mockPrepare,
      close: mockClose,
    }));

    await jest.unstable_mockModule("node:sqlite", () => ({
      DatabaseSync: mockDatabaseSync,
    }));

    await jest.unstable_mockModule("../config.js", () => ({
      default: {
        dbPath: ":memory:",
        maxRows: 2,
        allowInsert: false,
        allowUpdate: false,
        allowDelete: false,
        allowDdl: false,
      },
    }));
  });

  it("returns a result set and truncates rows according to maxRows", async () => {
    const mockColumns = jest.fn<() => any>().mockReturnValue([{ name: "id" }]);
    const mockAll = jest.fn<() => any>().mockReturnValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
    mockPrepare.mockReturnValue({
      columns: mockColumns,
      all: mockAll,
    });

    const { runSql } = await import("../sqlite.js");
    const result = await runSql("SELECT id FROM users");

    expect(result).toEqual({
      kind: "resultset",
      columns: ["id"],
      rowCount: 2,
      totalRows: 3,
      truncated: true,
      maxRows: 2,
      rows: [{ id: 1 }, { id: 2 }],
    });
    expect(mockClose).toHaveBeenCalled();
  });

  it("returns an execute result for DML without a result set", async () => {
    const mockColumns = jest.fn<() => any>().mockReturnValue([]);
    const mockRun = jest.fn<() => any>().mockReturnValue({ changes: 1, lastInsertRowid: 42 });
    mockPrepare.mockReturnValue({
      columns: mockColumns,
      run: mockRun,
    });

    const { runSql } = await import("../sqlite.js");
    const result = await runSql("UPDATE users SET active = 1");

    expect(result).toEqual({
      kind: "execute",
      affectedRows: 1,
      insertId: "42",
    });
  });

  it("throws a ToolError when execution fails", async () => {
    mockPrepare.mockImplementation(() => {
      throw new Error("Syntax error");
    });

    const { runSql } = await import("../sqlite.js");
    await expect(runSql("SELECT 1")).rejects.toThrow(/SQLite: Syntax error/);
  });
});
