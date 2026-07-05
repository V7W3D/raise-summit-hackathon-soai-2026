import type { SearchTraceEvent, SearchWarning } from "./schemas";

export function createTraceCollector() {
  const events: SearchTraceEvent[] = [];

  return {
    events,
    add(step: string, message: string, metadata?: Record<string, unknown>) {
      events.push({
        timestamp: new Date().toISOString(),
        step,
        message,
        metadata,
      });
    },
  };
}

export function createWarningCollector() {
  const warnings: SearchWarning[] = [];

  return {
    warnings,
    add(
      code: string,
      message: string,
      severity: SearchWarning["severity"] = "warning",
      relatedLeadId?: string,
    ) {
      warnings.push({ code, message, severity, relatedLeadId });
    },
  };
}

export type TraceCollector = ReturnType<typeof createTraceCollector>;
export type WarningCollector = ReturnType<typeof createWarningCollector>;
