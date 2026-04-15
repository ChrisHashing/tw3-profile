#!/usr/bin/env node
import { readProfile, writeProfile } from "../lib/profile.js";
import { validateSignature } from "../lib/validation.js";
import { signWithEthers } from "../scripts/ethers-signer.js";
import { signWithWallet } from "../scripts/wallet-signer.js";
import type { SignResult } from "../types.js";

const useEthers = process.argv.includes("--ethers");

async function main() {
  try {
    const profile = await readProfile();
    let result: SignResult;

    if (useEthers) {
      console.log("\nSigning with ethers (local key)…\n");
      result = await signWithEthers(profile.data);
    } else {
      console.log("\nSigning with browser wallet…");
      result = await signWithWallet(profile.data);
    }

    if (!validateSignature(result.data, result.signature)) {
      console.error(
        "\nSignature verification FAILED. The signature does not match the address.",
      );
      process.exit(1);
    }

    await writeProfile({
      data: result.data,
      signature: result.signature,
    });

    console.log("Profile signed and saved!\n");
    console.log("  Display Name :", result.data.displayName);
    console.log("  GitHub Name  :", result.data.githubName);
    console.log("  EVM Address  :", result.data.evmAddress);
    console.log("  Signed At    :", new Date(result.data.signedAt * 1000).toISOString());
    console.log("  Signature    :", result.signature.slice(0, 20) + "…");
    console.log();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`\nError: ${msg}\n`);
    process.exit(1);
  }
}

main();
