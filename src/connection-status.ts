import { fail, type McpSetupHook } from "@achmadya-dev/mcp-core";

type McpServer = Parameters<NonNullable<McpSetupHook>>[0];

export function formatConnectionError(label: string, error: unknown): string {
  if (error instanceof Error) {
    const code =
      "code" in error && typeof (error as { code?: unknown }).code === "string"
        ? (error as { code: string }).code
        : undefined;
    const detail = error.message || code || error.name || "connection failed";
    return `${label}: ${detail}`;
  }
  return `${label}: ${String(error)}`;
}

function connectionSummary(message: string, maxLength = 80): string {
  const colon = message.indexOf(": ");
  const core = colon >= 0 ? message.slice(colon + 2) : message;
  return core.length > maxLength ? `${core.slice(0, maxLength - 3)}...` : core;
}

export function registerConnectionFailureSurface(server: McpServer, message: string): void {
  const summary = connectionSummary(message);
  const hint =
    `Database connection failed: ${message}. ` +
    "Verify the database is running and credentials in .env are correct, then reload this MCP server.";

  server.registerTool(
    "connection_status",
    {
      title: `Connection failed: ${summary}`,
      description: hint,
    },
    async () => fail(`Database connection failed: ${message}`),
  );
}

export function captureHealthCheckError(healthCheck: () => Promise<void>): {
  check: () => Promise<void>;
  getError: () => string | undefined;
} {
  let error: string | undefined;

  return {
    async check() {
      try {
        await healthCheck();
        error = undefined;
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
        throw e;
      }
    },
    getError: () => error,
  };
}
