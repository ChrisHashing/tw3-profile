#!/usr/bin/env node
import inquirer from "inquirer";
import { readProfile, writeProfile } from "../lib/profile.js";
import { detectGitHubOwner } from "../lib/git.js";
import { validateSignature } from "../lib/validation.js";
import { signWithEthers } from "../scripts/ethers-signer.js";
import { signWithWallet } from "../scripts/wallet-signer.js";
import type { SignResult } from "../types.js";

const ORG_NAME = "tw3-dao";
const useEthers = process.argv.includes("--ethers");

async function main() {
  try {
    const profile = await readProfile();

    // ── Step 1: Detect GitHub username ──────────────────────────
    const detectedOwner = await detectGitHubOwner();
    const isOrgRepo =
      detectedOwner?.toLowerCase() === ORG_NAME.toLowerCase();

    let defaultGithub = "";
    if (detectedOwner && !isOrgRepo) {
      defaultGithub = detectedOwner;
      console.log(`\nDetected GitHub owner: ${detectedOwner}`);
    } else if (isOrgRepo) {
      console.log(
        "\n" +
          "  WARNING: This repo's remote points to the tw3-dao org, not a personal fork.\n" +
          "  To use tw3-profile you must:\n" +
          "    1. Fork tw3-dao/tw3-profile on GitHub\n" +
          "    2. Clone YOUR fork:  git clone https://github.com/YOUR_USERNAME/tw3-profile.git\n" +
          "    3. Run this command again from the cloned fork\n" +
          "\n" +
          "  If you have already forked and just need to update the remote, run:\n" +
          "    git remote set-url origin https://github.com/YOUR_USERNAME/tw3-profile.git\n" +
          "\n" +
          "  Continuing anyway — you can still enter your GitHub username manually.\n",
      );
    }

    // Fall back to existing profile value if no auto-detect
    if (
      !defaultGithub &&
      profile.data.githubName &&
      profile.data.githubName !== ORG_NAME
    ) {
      defaultGithub = profile.data.githubName;
    }

    // ── Step 2: Prompt for profile fields ──────────────────────
    const existingDisplay =
      profile.data.displayName !== "TW3 DAO"
        ? profile.data.displayName
        : undefined;

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "githubName",
        message: "GitHub username:",
        default: defaultGithub || undefined,
        validate: (v: string) =>
          v.trim().length > 0 || "GitHub username is required",
      },
      {
        type: "input",
        name: "displayName",
        message: "Display name:",
        default: (ans: { githubName: string }) =>
          existingDisplay || ans.githubName,
        validate: (v: string) =>
          v.trim().length > 0 || "Display name is required",
      },
    ]);

    const githubName = answers.githubName.trim();
    const displayName = answers.displayName.trim();

    // ── Step 3: Confirm ────────────────────────────────────────
    console.log("\nProfile data to sign:");
    console.log(`  Display Name : ${displayName}`);
    console.log(`  GitHub Name  : ${githubName}`);
    if (useEthers) {
      console.log("  EVM Address  : (will be derived from .env key)");
    } else {
      console.log("  EVM Address  : (will be set by your wallet)");
    }
    console.log("  Signed At    : (set automatically to current time)");

    const { confirmed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmed",
        message: "Proceed to signing?",
        default: true,
      },
    ]);

    if (!confirmed) {
      console.log("Aborted.\n");
      process.exit(0);
    }

    // ── Step 4: Sign ───────────────────────────────────────────
    const profileData = {
      displayName,
      githubName,
      evmAddress: "",
      signedAt: 0,
    };
    let result: SignResult;

    if (useEthers) {
      console.log("\nSigning with ethers (local key)…\n");
      result = await signWithEthers(profileData);
    } else {
      console.log("\nSigning with browser wallet…");
      result = await signWithWallet(profileData);
    }

    // ── Step 5: Validate ───────────────────────────────────────
    if (!validateSignature(result.data, result.signature)) {
      console.error(
        "\nSignature verification FAILED. The signature does not match the address.",
      );
      process.exit(1);
    }

    // ── Step 6: Write ──────────────────────────────────────────
    await writeProfile({
      data: result.data,
      signature: result.signature,
    });

    console.log("\nProfile created and signed successfully!\n");
    console.log("  Display Name :", result.data.displayName);
    console.log("  GitHub Name  :", result.data.githubName);
    console.log("  EVM Address  :", result.data.evmAddress);
    console.log("  Signed At    :", new Date(result.data.signedAt * 1000).toISOString());
    console.log(
      "  Signature    :",
      result.signature.slice(0, 20) + "…",
    );
    console.log(
      "\nRun `npm run validate` to verify, then commit and push.\n",
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\nError: ${msg}\n`);
    process.exit(1);
  }
}

main();
