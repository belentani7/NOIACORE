import { createHash, createPublicKey, verify } from "node:crypto";

export type LedgerEntryPayload = {
  workspaceId: number;
  actorId: string;
  actorType: string;
  action: string;
  targetFiles: string[];
  prevHash: string | null;
  createdAt: string;
};

export type LedgerVerificationInput = LedgerEntryPayload & {
  walHash: string;
  signature: string;
};

export function canonicalLedgerPayload(input: LedgerEntryPayload): string {
  return JSON.stringify({
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    actorType: input.actorType,
    action: input.action,
    targetFiles: input.targetFiles,
    prevHash: input.prevHash,
    createdAt: input.createdAt,
  });
}

export function computeLedgerHash(input: LedgerEntryPayload): string {
  return createHash("sha256").update(canonicalLedgerPayload(input), "utf8").digest("hex");
}

function decodeSignature(signature: string): Buffer {
  if (/^[0-9a-f]{128}$/i.test(signature)) return Buffer.from(signature, "hex");
  return Buffer.from(signature, "base64");
}

export function verifyLedgerSignature(input: LedgerVerificationInput, publicKeyPem?: string) {
  const expectedHash = computeLedgerHash(input);
  const hashValid = expectedHash === input.walHash.toLowerCase();
  let signatureValid = false;
  if (publicKeyPem && input.signature) {
    try {
      signatureValid = verify(
        null,
        Buffer.from(canonicalLedgerPayload(input), "utf8"),
        createPublicKey(publicKeyPem),
        decodeSignature(input.signature),
      );
    } catch {
      signatureValid = false;
    }
  }
  return {
    hashValid,
    signatureValid,
    signatureStatus: hashValid && signatureValid ? "VERIFIED" as const : hashValid ? "PENDING" as const : "INVALID" as const,
  };
}
