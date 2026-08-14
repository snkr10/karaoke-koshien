import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { createProxyMiddleware } from "http-proxy-middleware";
import { sessionsRouter } from "./rest/sessions";
import { songsRouter } from "./rest/songs";
import { registerSocketHandlers } from "./socket";
import { setIoInstance } from "./socket/ioInstance";

const app = express();
const corsOrigin = process.env.CORS_ORIGIN ?? "*";

app.use(cors({ origin: corsOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/api", sessionsRouter);
app.use("/api", songsRouter);

// フロント/バックを1つのサービスとしてデプロイする場合、Next.jsを別ポートの
// 内部プロセスとして起動し、このバックエンドが/api・/socket.io以外の
// リクエストをすべてNext.jsへプロキシする（scripts/start.js参照）。
// Socket.ioはengine.ioの仕組み上、自身のパスへのリクエストをExpressより
// 先に横取りするため、ここでの除外処理は不要。
const frontendProxyTarget = process.env.FRONTEND_PROXY_TARGET;
if (frontendProxyTarget) {
  app.use(createProxyMiddleware({ target: frontendProxyTarget, changeOrigin: true, ws: false }));
}

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: corsOrigin },
});

setIoInstance(io);
registerSocketHandlers(io);

const port = Number(process.env.PORT ?? 4000);
httpServer.listen(port, () => {
  console.log(`karaoke-koshien backend listening on :${port}`);
});
