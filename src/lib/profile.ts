import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { Profile, ProfileData } from "../types.js";

const PROFILE_PATH = resolve(process.cwd(), "profile.json");

export function canonicalMessage(data: ProfileData): string {
  const ordered: Record<string, string | number> = {
    displayName: data.displayName,
    evmAddress: data.evmAddress,
    githubName: data.githubName,
    signedAt: data.signedAt,
  };
  return JSON.stringify(ordered);
}

export async function readProfile(): Promise<Profile> {
  const raw = await readFile(PROFILE_PATH, "utf-8");
  const parsed = JSON.parse(raw) as Profile;
  return parsed;
}

export async function writeProfile(profile: Profile): Promise<void> {
  const json = JSON.stringify(profile, null, 4) + "\n";
  await writeFile(PROFILE_PATH, json, "utf-8");
}

const ZERO_ADDR = "0x0000000000000000000000000000000000000000";
const ZERO_SIG =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

export function isTemplateProfile(profile: Profile): boolean {
  return (
    profile.data.evmAddress === ZERO_ADDR && profile.signature === ZERO_SIG
  );
}

export function nowEpoch(): number {
  return Math.floor(Date.now() / 1000);
}
