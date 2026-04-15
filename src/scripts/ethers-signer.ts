import { ethers } from "ethers";
import { loadEthersEnv } from "../lib/env.js";
import { canonicalMessage, nowEpoch } from "../lib/profile.js";
import type { ProfileData, SignResult } from "../types.js";

function walletFromEnv(): ethers.HDNodeWallet | ethers.Wallet {
  const { mnemonic, privateKey } = loadEthersEnv();

  if (mnemonic) {
    return ethers.HDNodeWallet.fromPhrase(mnemonic);
  }
  return new ethers.Wallet(privateKey!);
}

export async function signWithEthers(
  data: Omit<ProfileData, "evmAddress" | "signedAt"> & {
    evmAddress?: string;
    signedAt?: number;
  },
): Promise<SignResult> {
  const wallet = walletFromEnv();
  const address = await wallet.getAddress();

  const profileData: ProfileData = {
    displayName: data.displayName,
    githubName: data.githubName,
    evmAddress: address,
    signedAt: nowEpoch(),
  };

  const message = canonicalMessage(profileData);
  const signature = await wallet.signMessage(message);

  return { data: profileData, signature, address };
}
