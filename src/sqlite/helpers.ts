import { ToolError } from "@achmadya-dev/mcp-core";

/**
 * Validate and clean up input SQL query and allowed prefixes.
 */
export function validateInputs(
  sql: string,
  allowedPrefixes: string[]
): { cleanSql: string; prefixes: string[] } {
  const cleanSql = sql.trim();
  if (!cleanSql) {
    throw new ToolError("SQL query cannot be empty.");
  }

  if (allowedPrefixes.length === 0) {
    throw new ToolError("allowedPrefixes cannot be empty.");
  }

  const prefixes = allowedPrefixes.map((p) => p.trim().toUpperCase());
  return { cleanSql, prefixes };
}

/**
 * Splits the SQL query, parses syntax, handles quoting/nesting/comments,
 * and extracts the single SQL statement while ensuring syntax correctness.
 */
export function parseSingleStatement(sql: string): string {
  const parts: string[] = [];
  let current = "";

  let inSingleQuote = false;
  let inDoubleQuote = false;
  let inBacktick = false;
  let inBracketIdentifier = false;

  let inLineComment = false;
  let inBlockComment = false;
  let escape = false;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const next = sql[i + 1];

    if (escape) {
      current += char;
      escape = false;
      continue;
    }

    if (char === "\\" && (inSingleQuote || inDoubleQuote || inBacktick)) {
      current += char;
      escape = true;
      continue;
    }

    if (inLineComment) {
      current += char;
      if (char === "\n") {
        inLineComment = false;
      }
      continue;
    }

    if (inBlockComment) {
      current += char;
      if (char === "*" && next === "/") {
        current += next;
        i++;
        inBlockComment = false;
      }
      continue;
    }

    if (!inSingleQuote && !inDoubleQuote && !inBacktick && !inBracketIdentifier) {
      if (char === "-" && next === "-") {
        current += char + next;
        i++;
        inLineComment = true;
        continue;
      }

      if (char === "/" && next === "*") {
        current += char + next;
        i++;
        inBlockComment = true;
        continue;
      }
    }

    if (char === "'" && !inDoubleQuote && !inBacktick && !inBracketIdentifier) {
      if (inSingleQuote && next === "'") {
        current += "''";
        i++;
        continue;
      }
      inSingleQuote = !inSingleQuote;
      current += char;
      continue;
    }

    if (char === '"' && !inSingleQuote && !inBacktick && !inBracketIdentifier) {
      if (inDoubleQuote && next === '"') {
        current += '""';
        i++;
        continue;
      }
      inDoubleQuote = !inDoubleQuote;
      current += char;
      continue;
    }

    if (char === "`" && !inSingleQuote && !inDoubleQuote && !inBracketIdentifier) {
      inBacktick = !inBacktick;
      current += char;
      continue;
    }

    if (char === "[" && !inSingleQuote && !inDoubleQuote && !inBacktick) {
      inBracketIdentifier = true;
      current += char;
      continue;
    }

    if (char === "]" && inBracketIdentifier) {
      inBracketIdentifier = false;
      current += char;
      continue;
    }

    if (char === ";" && !inSingleQuote && !inDoubleQuote && !inBacktick && !inBracketIdentifier) {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        parts.push(trimmed);
      }
      current = "";
      continue;
    }

    current += char;
  }

  if (inSingleQuote) throw new ToolError("Unterminated single quote string.");
  if (inDoubleQuote) throw new ToolError("Unterminated double quote identifier.");
  if (inBacktick) throw new ToolError("Unterminated backtick identifier.");
  if (inBracketIdentifier) throw new ToolError("Unterminated bracket identifier.");
  if (inBlockComment) throw new ToolError("Unterminated block comment.");

  const last = current.trim();
  if (last.length > 0) {
    parts.push(last);
  }

  if (parts.length !== 1) {
    throw new ToolError("Only a single SQL query is allowed per call.");
  }

  return parts[0];
}

/**
 * Recursively strips leading single-line and block comments from a SQL statement.
 */
function stripLeadingComments(sql: string): string {
  let result = sql.trim();

  while (true) {
    if (result.startsWith("--")) {
      const newlineIndex = result.indexOf("\n");
      if (newlineIndex === -1) {
        return "";
      }
      result = result.slice(newlineIndex + 1).trim();
      continue;
    }

    if (result.startsWith("/*")) {
      const endIndex = result.indexOf("*/");
      if (endIndex === -1) {
        throw new ToolError("Unterminated leading block comment.");
      }
      result = result.slice(endIndex + 2).trim();
      continue;
    }

    break;
  }

  return result;
}

/**
 * Validates the statement prefix and detects dangerous SQL patterns (hardening).
 */
export function validateStatement(statement: string, prefixes: string[]): void {
  const stripped = stripLeadingComments(statement);
  const match = stripped.match(/^([A-Z]+)/i);
  if (!match) {
    throw new ToolError("Unable to determine SQL statement type.");
  }

  const firstKeyword = match[1].toUpperCase();
  if (!prefixes.includes(firstKeyword)) {
    throw new ToolError(
      `SQL query is not allowed for this tool. Allowed statements: ${prefixes.join(", ")}`
    );
  }

  const dangerousPatterns: RegExp[] = [
    /\bXP_CMDSHELL\b/i,
    /\bEXEC\b/i,
    /\bEXECUTE\b/i,
    /\bPREPARE\b/i,
    /\bDEALLOCATE\b/i,
    /\bATTACH\s+DATABASE\b/i,
    /\bCOPY\s+.*\s+PROGRAM\b/i,
    /\bLOAD_FILE\s*\(/i,
    /\bINTO\s+OUTFILE\b/i,
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(statement)) {
      throw new ToolError(`Dangerous SQL pattern detected: ${pattern}`);
    }
  }
}
