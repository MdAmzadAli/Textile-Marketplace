type Level = "info" | "warn" | "error";

function log(level: Level, msg: string, meta?: unknown) {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${msg}`;
  if (meta !== undefined) {
    // eslint-disable-next-line no-console
    console[level === "error" ? "error" : "log"](line, meta);
  } else {
    // eslint-disable-next-line no-console
    console[level === "error" ? "error" : "log"](line);
  }
}

export const logger = {
  info: (msg: string, meta?: unknown) => log("info", msg, meta),
  warn: (msg: string, meta?: unknown) => log("warn", msg, meta),
  error: (msg: string, meta?: unknown) => log("error", msg, meta),
};
