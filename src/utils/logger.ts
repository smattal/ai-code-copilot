/**
 * Simple logging utility to replace console.log statements
 * Provides consistent logging across the application
 */

export enum LogLevel {
  INFO = 'INFO',
  SUCCESS = 'SUCCESS',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}

export class Logger {
  private static instance: Logger;
  private enabled: boolean = true;
  private level: LogLevel = LogLevel.INFO;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  info(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.log(`ℹ️  ${message}`, ...args);
    }
  }

  success(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.log(`✅ ${message}`, ...args);
    }
  }

  warning(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.log(`⚠️  ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.enabled) {
      console.error(`❌ ${message}`, ...args);
    }
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.enabled && this.level === LogLevel.DEBUG) {
      console.log(`🔍 ${message}`, ...args);
    }
  }

  table(data: Record<string, unknown>): void {
    if (this.enabled) {
      console.table(data);
    }
  }

  json(data: unknown): void {
    if (this.enabled) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
