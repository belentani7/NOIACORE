export const AGENT_LIMITS = {
  maxMessageChars: 4000,
  maxHistoryMessages: 12,
  requireHumanReviewForExternalActions: true,
} as const;

const SENSITIVE_TERMS = [
  "legal", "jurídic", "medic", "salud", "financ", "pago", "comprar", "contrato",
  "contraseña", "credencial", "publicar", "enviar", "correo", "email", "contactar", "extern",
] as const;

export function requiresHumanReview(message: string, category: string): boolean {
  const normalized = `${category} ${message}`.toLocaleLowerCase("es-ES");
  return SENSITIVE_TERMS.some((term) => normalized.includes(term));
}

export function enforceAgentReview(message: string, category: string, modelRequestedReview: boolean): boolean {
  return AGENT_LIMITS.requireHumanReviewForExternalActions
    ? modelRequestedReview || requiresHumanReview(message, category)
    : modelRequestedReview;
}

export function validateAgentInput(message: string, historyLength = 0): { valid: boolean; reason?: "empty-message" | "message-too-long" | "history-too-long" } {
  if (message.trim().length === 0) return { valid: false, reason: "empty-message" };
  if (message.length > AGENT_LIMITS.maxMessageChars) return { valid: false, reason: "message-too-long" };
  if (historyLength > AGENT_LIMITS.maxHistoryMessages) return { valid: false, reason: "history-too-long" };
  return { valid: true };
}
