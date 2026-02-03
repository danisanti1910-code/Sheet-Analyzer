import "dotenv/config";
import { createApp } from "../server/app";

export default async function handler(req: import("express").Request, res: import("express").Response) {
  try {
    const app = await createApp();
    return app(req, res);
  } catch (err) {
    console.error("[api] Handler error:", err);
    res.status(500).json({
      error: "Server error",
      details: err instanceof Error ? err.message : String(err),
    });
  }
}
