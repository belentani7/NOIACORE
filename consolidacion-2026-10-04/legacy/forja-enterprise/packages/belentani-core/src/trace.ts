import { randomUUID } from "node:crypto";

export const CORE_PROTOCOL_VERSION = "1.0.0";

export type ValidationLayer = "PRESENTATION" | "POLICY" | "INFRASTRUCTURE";
export type ValidationEnvelope = {
  traceId: string;
  status: "FAILED" | "WARNING";
  layer: ValidationLayer;
  errors: Array<{ code: string; message: string }>;
  clientVersion?: string;
};

export function createTraceId(candidate?: string): string {
  return candidate && /^[a-zA-Z0-9._:-]{8,128}$/.test(candidate) ? candidate : randomUUID();
}

export function createValidationEnvelope(input: Omit<ValidationEnvelope, "traceId"> & { traceId?: string }): ValidationEnvelope {
  return {
    traceId: createTraceId(input.traceId),
    status: input.status,
    layer: input.layer,
    errors: input.errors,
    ...(input.clientVersion ? { clientVersion: input.clientVersion } : {}),
  };
}
