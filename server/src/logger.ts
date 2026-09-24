import pino from 'pino';

// Structured JSON logging. In production, logs go to stdout so they can be
// collected by cloud loggers (Render/CloudWatch etc.).
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  base: { service: 'amazon-clone-server' },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export default logger;
