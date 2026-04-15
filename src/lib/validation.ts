import { ethers } from "ethers";
import { canonicalMessage } from "./profile.js";
import type { Profile, ProfileData } from "../types.js";

const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;

export function validateSignature(
  data: ProfileData,
  signature: string,
): boolean {
  try {
    const message = canonicalMessage(data);
    const recovered = ethers.verifyMessage(message, signature);
    return recovered.toLowerCase() === data.evmAddress.toLowerCase();
  } catch {
    return false;
  }
}

export interface TimestampCheck {
  valid: boolean;
  expired: boolean;
  missing: boolean;
  message: string;
}

export function validateTimestamp(data: ProfileData): TimestampCheck {
  if (!data.signedAt || typeof data.signedAt !== "number") {
    return {
      valid: false,
      expired: false,
      missing: true,
      message: "signedAt timestamp is missing",
    };
  }

  const now = Math.floor(Date.now() / 1000);

  if (data.signedAt > now + 300) {
    return {
      valid: false,
      expired: false,
      missing: false,
      message: `signedAt is in the future (${new Date(data.signedAt * 1000).toISOString()})`,
    };
  }

  const age = now - data.signedAt;
  if (age > ONE_YEAR_SECONDS) {
    const signedDate = new Date(data.signedAt * 1000).toISOString().split("T")[0];
    return {
      valid: true,
      expired: true,
      missing: false,
      message: `Signature expired — signed on ${signedDate} (over 1 year ago). Please re-sign.`,
    };
  }

  return {
    valid: true,
    expired: false,
    missing: false,
    message: `signedAt ${new Date(data.signedAt * 1000).toISOString()}`,
  };
}

export function validateProfileSchema(profile: unknown): profile is Profile {
  if (typeof profile !== "object" || profile === null) return false;
  const p = profile as Record<string, unknown>;

  if (typeof p.data !== "object" || p.data === null) return false;
  const d = p.data as Record<string, unknown>;

  if (typeof d.displayName !== "string" || d.displayName.length === 0)
    return false;
  if (typeof d.githubName !== "string" || d.githubName.length === 0)
    return false;
  if (
    typeof d.evmAddress !== "string" ||
    !ethers.isAddress(d.evmAddress)
  )
    return false;

  if (typeof p.signature !== "string" || !p.signature.startsWith("0x"))
    return false;

  return true;
}
