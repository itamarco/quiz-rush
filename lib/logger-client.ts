type LogLevel = "error" | "warn" | "info" | "debug";

interface LogContext {
  [key: string]: unknown;
}

class ClientLogger {
  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorDetails =
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error;

    const fullContext = {
      ...context,
      error: errorDetails,
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : undefined,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };

    console.error(this.formatMessage("error", message, fullContext));
  }

  warn(message: string, context?: LogContext): void {
    const fullContext = {
      ...context,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };
    console.warn(this.formatMessage("warn", message, fullContext));
  }

  info(message: string, context?: LogContext): void {
    const fullContext = {
      ...context,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    };
    console.info(this.formatMessage("info", message, fullContext));
  }

  debug(message: string, context?: LogContext): void {
    if (process.env.NODE_ENV === "development") {
      const fullContext = {
        ...context,
        url: typeof window !== "undefined" ? window.location.href : undefined,
      };
      console.debug(this.formatMessage("debug", message, fullContext));
    }
  }
}

export const logger = new ClientLogger();
