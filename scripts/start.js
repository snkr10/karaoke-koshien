// フロントエンド（Next.js）を内部ポートで起動し、バックエンド（Express+Socket.io）を
// Renderが割り当てるPORTで起動する。バックエンドは/api・/socket.io以外のリクエストを
// すべて内部のNext.jsへプロキシするため、外部に見えるRenderサービスは1つだけになる。
const { spawn } = require("child_process");
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

require(path.join(__dirname, "..", "backend", "dist", "src", "index.js"));

function shutdown() {
  frontend.kill();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
