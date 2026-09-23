import pino from "pino";
import { env, isProduction } from "./env";

export const logger = pino({
  level: env.LOG_LEVEL,
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname"
        }
      },
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "DATABASE_URL",
      "UPSTASH_REDIS_REST_TOKEN",
      "JWT_ACCESS_TOKEN_SECRET",
      "JWT_REFRESH_TOKEN_SECRET"
    ],
    censor: "[redacted]"
  }
});
