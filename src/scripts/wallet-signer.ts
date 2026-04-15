import open from "open";
import { startWalletServer } from "../server/index.js";
import type { ProfileData, SignResult } from "../types.js";

/**
 * Starts a local web server, opens the signing page in the user's
 * default browser, and waits for the wallet signature.
 */
export async function signWithWallet(
  data: Partial<ProfileData>,
): Promise<SignResult> {
  const { url, waitForResult, shutdown } =
    await startWalletServer(data);

  console.log(`\n  Wallet signing page: ${url}\n`);
  console.log("  Waiting for signature from browser…\n");

  try {
    await open(url);
  } catch {
    console.log(
      "  Could not open browser automatically. Please visit the URL above.\n",
    );
  }

  const result = await waitForResult();
  await shutdown();
  return result;
}
