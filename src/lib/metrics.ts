import { collectDefaultMetrics, Counter, Gauge, Registry } from "prom-client";

export const registry = new Registry();

export const requestErrors = new Counter({
  name: "blog_request_errors_total",
  help: "Total number of server errors captured by Next.js",
  labelNames: ["route"] as const,
  registers: [registry],
});

export const lastRequestAt = new Gauge({
  name: "blog_last_request_timestamp_seconds",
  help: "Unix timestamp of the last captured server request",
  registers: [registry],
});

let defaultMetricsStarted = false;

export function startDefaultMetrics() {
  if (defaultMetricsStarted) return;
  defaultMetricsStarted = true;
  collectDefaultMetrics({ register: registry });
}
