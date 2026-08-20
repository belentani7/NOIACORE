import crypto from "node:crypto";

export type ValidationRule = { id: string; name: string; type: "required" | "max_length" | "contains" | "regex" | "forbidden"; field: string; value?: string | number; severity?: "low" | "medium" | "high" | "critical"; enabled?: boolean };
export type ValidationResult = { result: "pass" | "fail"; riskLevel: "low" | "medium" | "high" | "critical"; triggeredRules: Array<ValidationRule & { reason: string }>; score: number };

function readField(payload: unknown, field: string): unknown {
  return field.split(".").reduce((acc: any, key) => acc?.[key], payload as any);
}

export function evaluateRules(input: unknown, output: unknown, rules: ValidationRule[]): ValidationResult {
  const triggeredRules: Array<ValidationRule & { reason: string }> = [];
  for (const rule of rules.filter((r) => r.enabled !== false)) {
    const source = rule.field.startsWith("output.") ? output : input;
    const field = rule.field.replace(/^(input|output)\./, "");
    const value = readField(source, field);
    let failed = false; let reason = "";
    if (rule.type === "required") { failed = value === undefined || value === null || value === ""; reason = `Campo requerido ausente: ${rule.field}`; }
    if (rule.type === "max_length") { failed = typeof value === "string" && value.length > Number(rule.value); reason = `Longitud superior a ${rule.value} caracteres`; }
    if (rule.type === "contains") { failed = typeof value === "string" && !value.includes(String(rule.value)); reason = `No contiene el valor requerido: ${rule.value}`; }
    if (rule.type === "forbidden") { failed = typeof value === "string" && value.toLowerCase().includes(String(rule.value).toLowerCase()); reason = `Contiene el patrón prohibido: ${rule.value}`; }
    if (rule.type === "regex") { try { failed = typeof value === "string" && !new RegExp(String(rule.value)).test(value); reason = `No cumple la expresión regular`; } catch { failed = true; reason = `Expresión regular inválida`; } }
    if (failed) triggeredRules.push({ ...rule, reason });
  }
  const rank = { low: 1, medium: 2, high: 3, critical: 4 } as const;
  const riskLevel = triggeredRules.reduce((highest, rule) => rank[rule.severity ?? "low"] > rank[highest] ? (rule.severity ?? "low") : highest, "low" as ValidationResult["riskLevel"]);
  return { result: triggeredRules.length ? "fail" : "pass", riskLevel, triggeredRules, score: Math.max(0, 100 - triggeredRules.length * 15) };
}

export function hashLedgerEntry(payload: { eventId: string; inputJson: string; outputJson: string; result: string; previousHash?: string | null }) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
