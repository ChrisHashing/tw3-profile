#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  validateProfileSchema,
  validateSignature,
  validateTimestamp,
} from "../lib/validation.js";
import { detectGitHubOwner } from "../lib/git.js";

const PROFILE_PATH = resolve(process.cwd(), "profile.json");

async function main() {
  let exitCode = 0;
  const log = (line: string) => process.stdout.write(line + "\n");
  const fail = (msg: string) => {
    log(`  FAIL  ${msg}`);
    exitCode = 1;
  };
  const warn = (msg: string) => {
    log(`  WARN  ${msg}`);
  };
  const pass = (msg: string) => {
    log(`  OK    ${msg}`);
  };

  log("\nValidating profile.json…\n");

  // ── 1. Parse JSON ──────────────────────────────────────────────
  let raw: unknown;
  try {
    const text = await readFile(PROFILE_PATH, "utf-8");
    raw = JSON.parse(text);
  } catch {
    fail("Could not read or parse profile.json");
    process.exit(1);
  }

  // ── 2. Schema check ───────────────────────────────────────────
  if (!validateProfileSchema(raw)) {
    fail("Invalid profile schema (missing or malformed fields)");
    process.exit(1);
  }
  pass("Schema valid");

  const profile = raw;

  // ── 3. Not a template ─────────────────────────────────────────
  const isZeroAddr =
    profile.data.evmAddress ===
    "0x0000000000000000000000000000000000000000";
  if (isZeroAddr) {
    fail("evmAddress is the zero address (profile has not been signed)");
  } else {
    pass("evmAddress is non-zero");
  }

  // ── 4. Signature verification ─────────────────────────────────
  if (!isZeroAddr) {
    if (validateSignature(profile.data, profile.signature)) {
      pass("Signature valid — recovered address matches evmAddress");
    } else {
      fail("Signature does NOT match evmAddress");
    }
  }

  // ── 5. Timestamp check ────────────────────────────────────────
  const tsCheck = validateTimestamp(profile.data);
  if (tsCheck.missing) {
    warn(tsCheck.message + " — re-sign to add a timestamp");
  } else if (!tsCheck.valid) {
    warn(tsCheck.message);
  } else if (tsCheck.expired) {
    warn(tsCheck.message);
  } else {
    pass(`Timestamp valid — ${tsCheck.message}`);
  }

  // ── 6. GitHub owner match (local check) ───────────────────────
  const expectedOwner =
    process.env.EXPECTED_OWNER ?? (await detectGitHubOwner());

  if (expectedOwner) {
    const isOrgDefault =
      profile.data.githubName.toLowerCase() === "tw3-dao";
    if (
      profile.data.githubName.toLowerCase() ===
      expectedOwner.toLowerCase()
    ) {
      if (isOrgDefault) {
        warn(
          `Using "tw3-dao" repo — fork it to your personal GitHub and clone`,
        );
      } else {
        pass(
          `githubName "${profile.data.githubName}" matches expected owner "${expectedOwner}"`,
        );
      }
    } else {
      fail(
        `githubName "${profile.data.githubName}" does not match expected owner "${expectedOwner}"`,
      );
    }
  } else {
    log(
      "  SKIP  Could not determine expected GitHub owner (no git remote / EXPECTED_OWNER)",
    );
  }

  // ── Result ─────────────────────────────────────────────────────
  log("");
  if (exitCode === 0) {
    log("All checks passed.\n");
  } else {
    log("Some checks failed.\n");
  }
  process.exit(exitCode);
}

main();
