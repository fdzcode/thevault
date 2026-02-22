import crypto from "crypto";

const CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export const DEFAULT_INVITE_LIMIT = 5;

/** Generate a cryptographically random 8-char alphanumeric invite code. */
export function generateInviteCode(): string {
  const bytes = crypto.randomBytes(8);
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += CHARSET[bytes[i]! % CHARSET.length];
  }
  return code;
}

/** Derive a 4-digit member number from an invite code via SHA-256 hash. */
export function deriveMemberNumber(code: string): string {
  const hash = crypto.createHash("sha256").update(code).digest("hex");
  const num = parseInt(hash.slice(0, 8), 16) % 10000;
  return num.toString().padStart(4, "0");
}
