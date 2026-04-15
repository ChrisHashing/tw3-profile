# tw3-profile

Cryptographically signed identity profiles for the TW3 DAO community.

Each member forks this repo, signs their profile data with an EVM wallet, and
pushes. The community server and GitHub Actions can then verify that the
`githubName` matches the repo owner and the signature matches the claimed
`evmAddress`.

## Quick start

```bash
# 1. Fork tw3-dao/tw3-profile on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/tw3-profile.git
cd tw3-profile

# 2. Install dependencies
npm install

# 3. Run the interactive profile wizard
npm run create-profile            # browser wallet
npm run create-profile -- --ethers  # local key from .env

# 4. Verify locally
npm run validate

# 5. Commit and push
git add profile.json
git commit -m "Sign profile"
git push
```

## Commands

### `npm run create-profile`

Guided wizard that detects your GitHub username from the git remote, prompts for
a display name, then signs your profile.

| Flag | Description |
| --- | --- |
| _(none)_ | Opens a browser page with a multi-wallet connector |
| `--ethers` | Signs with a local private key or mnemonic from `.env` |

### `npm run sign-data`

Re-sign an existing `profile.json` without changing the display name or GitHub
username. Useful after rotating keys.

| Flag | Description |
| --- | --- |
| `--wallet` _(default)_ | Browser wallet signing |
| `--ethers` | Local ethers signing |

### `npm run validate`

Checks `profile.json` for:

- Valid schema (all required fields present)
- Non-zero EVM address
- EIP-191 signature recovers to the claimed `evmAddress`
- `signedAt` timestamp is present and not older than 1 year (warns if expired or missing)
- `githubName` matches the git remote owner (or `EXPECTED_OWNER` env var)

Exits `0` on success, `1` on failure. Timestamp issues produce warnings but do
not fail the check. Used by CI and can be run locally.

## Ethers mode setup

Create a `.env` file (see `.env.example`):

```bash
# Option A: mnemonic phrase
ETHERS_MNEMONIC="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"

# Option B: hex private key
ETHERS_KEY="0xabc123..."
```

Set **one**, not both. The `.env` file is git-ignored.

When using `--ethers`, the script derives the EVM address from your key
automatically — you do not need to enter it.

## Browser wallet mode

When run without `--ethers`, a local web server starts on a random port and
opens in your default browser. The page discovers all injected EVM wallets
(MetaMask, Coinbase Wallet, Brave, Rabby, etc.) via EIP-6963.

1. Connect your wallet
2. Review and optionally edit the profile fields
3. Click **Review & Sign**, then **Confirm & Sign**
4. The wallet prompts for an EIP-191 `personal_sign`
5. The signed result is sent back to the CLI, which writes `profile.json`

## How validation works

`profile.json` stores two top-level keys:

```json
{
  "data": {
    "displayName": "Alice",
    "githubName": "alice",
    "evmAddress": "0x...",
    "signedAt": 1744675200
  },
  "signature": "0x..."
}
```

The `data` object is serialised as canonical JSON (alphabetically sorted keys,
no whitespace) and signed using EIP-191 `personal_sign`. Verification recovers
the signer address from the signature and compares it to `data.evmAddress`.

`signedAt` is a Unix epoch timestamp set at the moment of signing. Signatures
older than 1 year produce a warning during validation, encouraging users to
re-sign periodically.

## GitHub Actions

The included workflow (`.github/workflows/validate-profile.yml`) runs
automatically when `profile.json` changes on push or pull request. It:

1. Installs dependencies
2. Runs `npm run validate` with `EXPECTED_OWNER` set to the repo owner
3. Fails the check if the signature is invalid or `githubName` does not match
   the fork owner (case-insensitive)

This runs on your fork — just make sure GitHub Actions are enabled in your
fork's settings.

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `No .env file found` | Create `.env` from `.env.example` (only needed for `--ethers`) |
| `Both ETHERS_MNEMONIC and ETHERS_KEY are set` | Remove one from `.env` |
| `githubName does not match expected owner` | Your `githubName` must match your GitHub username (the fork owner) |
| Browser doesn't open | Visit the URL printed in the terminal manually |
| `No wallet detected` | Install MetaMask or another EVM browser wallet |
| Signature verification failed | Make sure you signed with the same wallet address shown in the profile |
| `Signature expired` warning | Re-run `npm run sign-data` to refresh the timestamp |

## License

AGPL-3.0
