/**
 * 구조화 로거 — pino.
 *
 * 운영 환경에서 ASO 분석/스크린샷 파이프라인 실패가 invisible하지 않도록.
 * 빌드 출력은 JSON 라인 → Vercel Logs / 외부 drain 으로 그대로 흘려보낼 수 있음.
 *
 * 사용 예:
 *   import { logger } from "@/lib/logger";
 *   logger.info({ orderId, model }, "stage8.start");
 *   logger.error({ err, orderId }, "stage8.failed");
 */

import "server-only";
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (process.env.NODE_ENV === "production" ? "info" : "debug"),
  base: {
    service: "blockbusterlab",
    env: process.env.NODE_ENV ?? "development",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
