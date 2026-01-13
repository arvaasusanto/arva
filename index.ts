import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);
app.use(express.urlencoded({ extended: false }));

let inited = false;
let initPromise: Promise<void> | null = null;

async function init() {
  if (inited) return;
  if (!initPromise) {
    initPromise = (async () => {
      await registerRoutes(httpServer, app);

      app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ message });
      });

      // production: serve static build (kalau kamu memang build frontend ke folder static)
      if (process.env.NODE_ENV === "production") {
        serveStatic(app);
      } else {
        const { setupVite } = await import("./vite");
        await setupVite(httpServer, app);
      }

      inited = true;
    })();
  }
  await initPromise;
}

// ✅ Serverless handler untuk Vercel
export default async function handler(req: any, res: any) {
  await init();
  app(req, res);
}
