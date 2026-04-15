import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export interface EthersEnv {
  mnemonic?: string;
  privateKey?: string;
}

export function loadEthersEnv(): EthersEnv {
  const envPath = resolve(process.cwd(), ".env");

  if (!existsSync(envPath)) {
    throw new Error(
      "No .env file found.\n\n" +
        "Create a .env file with ONE of the following:\n" +
        '  ETHERS_MNEMONIC="your twelve word mnemonic phrase ..."\n' +
        '  ETHERS_KEY="0xYourPrivateKeyHex"\n\n' +
        "See .env.example for reference.",
    );
  }

  config({ path: envPath });

  const mnemonic = process.env.ETHERS_MNEMONIC?.trim();
  const privateKey = process.env.ETHERS_KEY?.trim();

  if (mnemonic && privateKey) {
    throw new Error(
      "Both ETHERS_MNEMONIC and ETHERS_KEY are set in .env.\n" +
        "Please set only ONE to avoid ambiguity.",
    );
  }

  if (!mnemonic && !privateKey) {
    throw new Error(
      "Neither ETHERS_MNEMONIC nor ETHERS_KEY is set in .env.\n\n" +
        "Set ONE of the following:\n" +
        '  ETHERS_MNEMONIC="your twelve word mnemonic phrase ..."\n' +
        '  ETHERS_KEY="0xYourPrivateKeyHex"',
    );
  }

  return { mnemonic, privateKey };
}
