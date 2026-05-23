# mcp-sqlite-query

Model Context Protocol (MCP) server for SQLite to run SQL queries via stdio (read-only by default). It lets MCP clients run a single SQL statement per invocation using Node.js built-in `node:sqlite` — no native add-ons required.

**Default mode: read-only.** Commands such as `INSERT`, `UPDATE`, `DELETE`, and DDL are not executed unless you enable the corresponding environment variables (see below).

## Requirements

- Node.js **≥ 22.5.0** (uses the built-in `node:sqlite` module introduced in v22.5.0)

Communication uses **stdio** (not HTTP). The SQLite database path and options are set via environment variables in your MCP configuration (`env`) or on the system.

## Install in MCP Clients (e.g. Cursor)

1. Open **Settings → MCP**, or edit the `mcp.json` file for your Cursor account.
2. Add a server entry like the example below. The `npx -y` command fetches the package from the npm registry and runs it (no global install required).

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@achmadya-dev/mcp-sqlite-query"],
      "env": {
        "SQLITE_DB_PATH": "/absolute/path/to/your/database.db"
      }
    }
  }
}
```

Adjust `SQLITE_DB_PATH` to point to your SQLite database file. Use `:memory:` to open an in-memory database (data is lost when the server stops).

## Manual setup from a cloned repository

Clone the repository, install dependencies, then build:

```bash
git clone <repo-url> mcp-sqlite-query
cd mcp-sqlite-query
pnpm install && pnpm run build
```

Then register the MCP server with **`node`** and the **absolute path** to `dist/index.js` in your project folder:

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "node",
      "args": ["/home/username/projects/mcp-sqlite-query/dist/index.js"],
      "env": {
        "SQLITE_DB_PATH": "/absolute/path/to/your/database.db"
      }
    }
  }
}
```

Replace the path in `args` with your clone location. After changing TypeScript sources, run `pnpm run build` again.

## Environment variables

### Database

| Variable          | Default      | Description                                                   |
| ----------------- | ------------ | ------------------------------------------------------------- |
| `SQLITE_DB_PATH`  | `:memory:`   | Path to the SQLite database file, or `:memory:` for in-memory |
| `SQLITE_MAX_ROWS` | `500`        | Maximum number of rows returned for `SELECT` results          |

### Allowing write operations

**Read** commands (`SELECT`, `PRAGMA`, `EXPLAIN`) are always allowed.

To allow **writes** or **DDL**, enable the desired types with the variables below. Values treated as enabled: `true`, `1`, `yes`, or `on` (case-insensitive).

| Variable                 | Allows                                       |
| ------------------------ | -------------------------------------------- |
| `ALLOW_INSERT_OPERATION` | `INSERT` / `REPLACE`                         |
| `ALLOW_UPDATE_OPERATION` | `UPDATE`                                     |
| `ALLOW_DELETE_OPERATION` | `DELETE`                                     |
| `ALLOW_DDL_OPERATION`    | DDL (`CREATE`, `ALTER`, `DROP`, `VACUUM`)    |

If a variable is unset, or its value is not one of the above, that operation type remains **rejected** (read-only for that type).

## Available tools

| Tool            | Allowed statements                          | Requires env flag        |
| --------------- | ------------------------------------------- | ------------------------ |
| `sqlite_select` | `SELECT`, `PRAGMA`, `EXPLAIN`               | _(always enabled)_       |
| `sqlite_insert` | `INSERT`, `REPLACE`                         | `ALLOW_INSERT_OPERATION` |
| `sqlite_update` | `UPDATE`                                    | `ALLOW_UPDATE_OPERATION` |
| `sqlite_delete` | `DELETE`                                    | `ALLOW_DELETE_OPERATION` |
| `sqlite_ddl`    | `CREATE`, `ALTER`, `DROP`, `VACUUM`         | `ALLOW_DDL_OPERATION`    |

Each tool accepts a single `sql` string as input and returns the query result.

## Security

- Each request must contain **one** SQL statement only (no multiple statements separated by `;`).
- SQL is validated using a 3-phase parser that handles string literals, quoted identifiers, and comments before extracting the statement keyword.
- Dangerous patterns are always blocked regardless of the enabled flags: `XP_CMDSHELL`, `EXEC`, `EXECUTE`, `PREPARE`, `DEALLOCATE`, `ATTACH DATABASE`, `LOAD_FILE`, `INTO OUTFILE`, and `COPY ... PROGRAM`.
- `SELECT` results are capped by `SQLITE_MAX_ROWS` to prevent unbounded output.

## Development

```bash
# Run unit tests
pnpm test

# Build
pnpm run build

# Start the built server
pnpm start
```
