import { createHash } from "node:crypto";

export type RepositoryAudit = {
  source: string;
  mode: "metadata-only";
  manualApprovalRequired: true;
  execution: "blocked";
  suspiciousFiles: string[];
  manifests: string[];
  filesScanned: number;
  digest: string;
};

export function validateRepositoryUrl(sourceUrl: string): string {
  const parsed = new URL(sourceUrl);
  if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('repository-url-protocol-not-allowed');
  if (!parsed.hostname) throw new Error('repository-url-host-required');
  return parsed.toString();
}

export function createRepositoryAudit(sourceUrl: string, filesScanned = 0, manifests: string[] = [], suspiciousFiles: string[] = []): RepositoryAudit {
  const source = validateRepositoryUrl(sourceUrl);
  return {
    source,
    mode: "metadata-only",
    manualApprovalRequired: true,
    execution: "blocked",
    suspiciousFiles: [...suspiciousFiles],
    manifests: [...manifests],
    filesScanned: Math.max(0, Math.trunc(filesScanned)),
    digest: createHash("sha256").update(source, "utf8").digest("hex"),
  };
}
