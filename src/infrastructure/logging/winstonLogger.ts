import winston from 'winston';

export const logger = winston.createLogger({
  format: winston.format.combine(winston.format.timestamp(), winston.format.errors({ stack: true }), winston.format.json()),
  level: process.env.LOG_LEVEL ?? 'info',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ level, message, stack, timestamp }) => {
          return stack
            ? `${String(timestamp)} [${level}] ${String(message)}\n${stack as string}`
            : `${String(timestamp)} [${level}] ${String(message)}`;
        })
      ),
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
  ],
});
