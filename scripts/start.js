// フロントエンド（Next.js）を内部ポートで起動し、バックエンド（Express+Socket.io）を
// Renderが割り当てるPORTで起動する。バックエンドは/api・/socket.io以外のリクエストを
// すべて内部のNext.jsへプロキシするため、外部に見えるRenderサービスは1つだけになる。
//
// Next.jsの起動が完了する前にバックエンドがリクエストを受け付け始めると、
// プロキシ先が繋がらずECONNREFUSEDになってしまう（特に無料プランのスリープ復帰直後）。
// そのためNext.jsが実際に応答するまで待ってからバックエンドをlistenさせる。
const { spawn } = require("child_process");
const http = require("http");
const path = require("path");

const frontendPort = process.env.FRONTEND_INTERNAL_PORT || "3001";
const frontendDir = path.join(__dirname, "..", "frontend");

const frontend = spawn("npx", ["next", "start", "-p", frontendPort], {
  cwd: frontendDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

frontend.on("exit", (code) => {
  console.error(`[frontend] process exited with code ${code}`);
  process.exit(code ?? 1);
});

process.env.FRONTEND_PROXY_TARGET = `http://localhost:${frontendPort}`;

function waitForFrontend(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      const req = http.get({ host: "localhost", port: frontendPort, path: "/", timeout: 2000 }, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() > deadline) return reject(new Error("frontend did not become ready in time"));
        setTimeout(tryOnce, 300);
      });
      req.on("timeout", () => {
        req.destroy();
        if (Date.now() > deadline) return reject(new Error("frontend did not become ready in time"));
        setTimeout(tryOnce, 300);
      });
    };
    tryOnce();
  });
}

waitForFrontend(60000)
  .then(() => {
    const { startServer } = require(path.join(__dirname, "..", "backend", "dist", "src", "index.js"));
    startServer();
  })
  .catch((err) => {
    console.error("[start] frontend failed to become ready:", err.message);
    process.exit(1);
  });

function shutdown() {
  frontend.kill();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
