import path from "path"
import fs from "fs"
import { createLogger, format, transports } from "winston";
const { combine, timestamp, colorize, printf } = format;

const logDir = path.join(__dirname, "..", "..", "logs")
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir)
}

// Retirar level de gravar em arquivo
const excludeLevel = (levelToExclude: string) => {
  return format((info) => {
    return info.level === levelToExclude ? false : info;
  })();
};

const logFormat = printf(({ level, message, timestamp, service }) => {
  return `[${timestamp}] [${service || "unknown service"}] ${level}: ${message}`;
});

const baseLogger = createLogger({
  level: "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), logFormat),
  transports: [
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),
    // Arquivo com todos os logs
    new transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      format: combine(
        excludeLevel('dev'),
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
      )
    }),
    //Logs de erro
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
});

const logger = {
  info: (service: string, message: string) => baseLogger.info({ service, message }),
  error: (service: string, message: string) => baseLogger.error({ service, message }),
  warn: (service: string, message: string) => baseLogger.warn({ service, message }),
  debug: (service: string, message: string) => baseLogger.debug({ service, message }),
};

export default logger;
