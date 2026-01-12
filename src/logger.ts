import { createLogger, format, transports } from "winston";

export const logger = createLogger({
  transports: [
    new transports.Console({
      format: format.combine(
        format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        format.colorize(),
        format.simple(),
        format.printf((info) => {
          const { level, message, timestamp, ...meta } = info;
          return `${timestamp} ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ""
          }`;
        }),
      ),
      level: process.env.LOG_LEVEL ?? "info",
    }),
    new transports.File({
      filename: "vcp.log",
      format: format.combine(
        format.timestamp({format: "YYYY-MM-DD HH:mm:ss"}),
        format.simple(),
        format.printf((info) => {
          const { level, message, timestamp, ...meta } = info;
          return `${timestamp} ${level}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ""
          }`;
        }),
      ),
      level: process.env.LOG_LEVEL ?? "info",
    }),
  ],
});
