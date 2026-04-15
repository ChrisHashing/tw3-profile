import express from "express";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { Server } from "node:http";
import type { ProfileData, SignResult } from "../types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface WalletServer {
  port: number;
  url: string;
  server: Server;
  waitForResult: () => Promise<SignResult>;
  shutdown: () => Promise<void>;
}

/**
 * Starts a local Express server that serves the wallet-signing page.
 * Resolves immediately with the port and a `waitForResult()` promise
 * that resolves when the browser POSTs the signed result.
 */
export function startWalletServer(
  initialData: Partial<ProfileData>,
): Promise<WalletServer> {
  return new Promise((resolveBoot, rejectBoot) => {
    let resolveResult!: (r: SignResult) => void;
    let rejectResult!: (e: Error) => void;

    const resultPromise = new Promise<SignResult>((res, rej) => {
      resolveResult = res;
      rejectResult = rej;
    });

    const app = express();
    app.use(express.json());
    app.use(express.static(resolve(__dirname, "public")));

    app.get("/api/profile-data", (_req, res) => {
      res.json(initialData);
    });

    app.post("/api/sign-result", (req, res) => {
      const body = req.body as SignResult | undefined;
      if (!body?.data || !body?.signature || !body?.address) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }
      res.json({ ok: true });
      resolveResult(body);
    });

    const server = app.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      const url = `http://localhost:${port}`;

      resolveBoot({
        port,
        url,
        server,
        waitForResult: () => resultPromise,
        shutdown: () =>
          new Promise<void>((r) => server.close(() => r())),
      });
    });

    server.on("error", (err) => {
      rejectBoot(err);
      rejectResult(err);
    });
  });
}
