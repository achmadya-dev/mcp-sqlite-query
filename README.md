# @achmadya-dev/mcp-sqlite-query

MCP server for SQLite. Runs a single SQL statement per tool call over **stdio** using Node.js built-in `node:sqlite` (no native add-ons). **Read-only by default** — writes and DDL require explicit env flags.

## Requirements

- Node.js **≥ 22.5.0** (`node:sqlite` built-in)
- A SQLite database file path, or `:memory:` for ephemeral storage

## Install from npm

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@achmadya-dev/mcp-sqlite-query"],
      "env": {
        "SQLITE_DB_PATH": "/absolute/path/to/database.db"
      }
    }
  }
}
```

Use `:memory:` for an in-memory database (data is lost when the server stops).

Or use `envFile` instead of inline `env`.

## Develop from source

```bash
cp .env.example .env
pnpm install
docker compose up -d sqlite
pnpm --filter @achmadya-dev/mcp-sqlite-query run build
```

Docker creates `docker/sqlite/data/dev.db` from `docker/sqlite/init.sql` (sample e-commerce schema).

`.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "sqlite": {
      "command": "node",
      "args": ["${workspaceFolder}/packages/mcp-sqlite-query/dist/index.js"],
      "envFile": "${workspaceFolder}/.env"
    }
  }
}
```

Relevant `.env` key:

```env
SQLITE_DB_PATH=docker/sqlite/data/dev.db
```

Path is relative to the workspace root when Cursor starts the server.

## Environment variables

### Database

| Variable          | Default    | Description                      |
| ----------------- | ---------- | -------------------------------- |
| `SQLITE_DB_PATH`  | `:memory:` | Database file path or `:memory:` |
| `SQLITE_MAX_ROWS` | `500`      | Max rows for `SELECT` results    |

### Write access

| Variable                 | Allows                                    |
| ------------------------ | ----------------------------------------- |
| `ALLOW_INSERT_OPERATION` | `INSERT`, `REPLACE`                       |
| `ALLOW_UPDATE_OPERATION` | `UPDATE`                                  |
| `ALLOW_DELETE_OPERATION` | `DELETE`                                  |
| `ALLOW_DDL_OPERATION`    | DDL (`CREATE`, `ALTER`, `DROP`, `VACUUM`) |

Enabled values: `true`, `1`, `yes`, `on`.

## Tools

| Tool            | Statements                    | Env flag                 |
| --------------- | ----------------------------- | ------------------------ |
| `sqlite_select` | `SELECT`, `PRAGMA`, `EXPLAIN` | always on                |
| `sqlite_insert` | `INSERT`, `REPLACE`           | `ALLOW_INSERT_OPERATION` |
| `sqlite_update` | `UPDATE`                      | `ALLOW_UPDATE_OPERATION` |
| `sqlite_delete` | `DELETE`                      | `ALLOW_DELETE_OPERATION` |
| `sqlite_ddl`    | DDL                           | `ALLOW_DDL_OPERATION`    |

Each tool accepts one `sql` string.

## Behavior and security

- One SQL statement per request.
- SQL is validated with a parser that handles string literals, quoted identifiers, and comments before extracting the statement keyword.
- Always blocked: `XP_CMDSHELL`, `EXEC`, `EXECUTE`, `PREPARE`, `DEALLOCATE`, `ATTACH DATABASE`, `LOAD_FILE`, `INTO OUTFILE`, `COPY ... PROGRAM`.
- `SELECT` results are capped by `SQLITE_MAX_ROWS`.

## Package scripts

```bash
pnpm run build
pnpm test
pnpm start
```
