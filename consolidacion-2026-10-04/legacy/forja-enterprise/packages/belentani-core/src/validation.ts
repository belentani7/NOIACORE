export type ValidationRule = {
  id: string;
  name: string;
  type: "required" | "max_length" | "contains" | "regex" | "forbidden";
  field: string;
  value?: string | number;
  severity?: "low" | "medium" | "high" | "critical";
  enabled?: boolean;
};

export type ValidationResult = {
  result: "pass" | "fail";
  riskLevel: "low" | "medium" | "high" | "critical";
  triggeredRules: Array<ValidationRule & { reason: string }>;
  score: number;
};

function readField(payload: unknown, field: string): unknown {
  return field.split(".").reduce((acc: unknown, key) => {
    if (!acc || typeof acc !== "object") return undefined;
    return (acc as Record<string, unknown>)[key];
  }, payload);
}

export function evaluateRules(input: unknown, output: unknown, rules: ValidationRule[]): ValidationResult {
  const triggeredRules: Array<ValidationRule & { reason: string }> = [];
  for (const rule of rules.filter((item) => item.enabled !== false)) {
    const source = rule.field.startsWith("output.") ? output : input;
    const field = rule.field.replace(/^(input|output)\./, "");
    const value = readField(source, field);
    let failed = false;
    let reason = "";
    if (rule.type === "required") {
      failed = value === undefined || value === null || value === "";
      reason = `Campo requerido ausente: ${rule.field}`;
    }
    if (rule.type === "max_length") {
      failed = typeof value === "string" && value.length > Number(rule.value);
      reason = `Longitud superior a ${rule.value} caracteres`;
    }
    if (rule.type === "contains") {
      failed = typeof value === "string" && !value.includes(String(rule.value));
      reason = `No contiene el valor requerido: ${rule.value}`;
    }
    if (rule.type === "forbidden") {
      failed = typeof value === "string" && value.toLowerCase().includes(String(rule.value).toLowerCase());
      reason = `Contiene el patrón prohibido: ${rule.value}`;
    }
    if (rule.type === "regex") {
      try {
        failed = typeof value === "string" && !new RegExp(String(rule.value)).test(value);
        reason = "No cumple la expresión regular";
      } catch {
        failed = true;
        reason = "Expresión regular inválida";
      }
    }
    if (failed) triggeredRules.push({ ...rule, reason });
  }
  const rank = { low: 1, medium: 2, high: 3, critical: 4 } as const;
  const riskLevel = triggeredRules.reduce<ValidationResult["riskLevel"]>((highest, rule) => {
    const current = rule.severity ?? "low";
    return rank[current] > rank[highest] ? current : highest;
  }, "low");
  return {
    result: triggeredRules.length ? "fail" : "pass",
    riskLevel,
    triggeredRules,
    score: Math.max(0, 100 - triggeredRules.length * 15),
  };
}

export function scrubModelText(text: string, patterns: RegExp[] = [/sk-[A-Za-z0-9_-]{12,}/g, /Bearer\s+[A-Za-z0-9._-]+/gi]): string {
  return patterns.reduce((value, pattern) => value.replace(pattern, "[REDACTED]"), text);
}
