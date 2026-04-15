import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

/**
 * Returns the GitHub owner/org parsed from the `origin` remote URL,
 * or `null` if it can't be determined.
 */
export async function detectGitHubOwner(): Promise<string | null> {
  try {
    const { stdout } = await exec("git", [
      "remote",
      "get-url",
      "origin",
    ]);
    const url = stdout.trim();

    // HTTPS: https://github.com/OWNER/REPO.git
    const httpsMatch = url.match(
      /github\.com\/([^/]+)\/[^/]+?(?:\.git)?$/,
    );
    if (httpsMatch) return httpsMatch[1];

    // SSH: git@github.com:OWNER/REPO.git
    const sshMatch = url.match(
      /github\.com:([^/]+)\/[^/]+?(?:\.git)?$/,
    );
    if (sshMatch) return sshMatch[1];

    return null;
  } catch {
    return null;
  }
}
