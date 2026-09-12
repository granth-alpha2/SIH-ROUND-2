const { spawn } = require("child_process");
const path = require("path");
const http = require("http");

const rootDir = path.resolve(__dirname, "..");
const isWin = process.platform === "win32";

console.log("\x1b[32m%s\x1b[0m", "=======================================================");
console.log("\x1b[32m%s\x1b[0m", "       🌾 AgriProfit — Unified Full-Stack Launcher       ");
console.log("\x1b[32m%s\x1b[0m", "=======================================================");
console.log("Starting Python ML Microservice (:8000) & Next.js (:3000)...\n");

// Helper to check if a port is already responding
function isPortOpen(port) {
  return new Promise((resolve) => {
    const req = http.get({ hostname: "127.0.0.1", port, path: "/health", timeout: 1000 }, (res) => {
      resolve(res.statusCode === 200 || res.statusCode === 401 || res.statusCode === 404);
    });
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function startAll() {
  const mlAlreadyRunning = await isPortOpen(8000);
  let mlProcess = null;

  if (mlAlreadyRunning) {
    console.log("\x1b[36m[ML-SERVICE]\x1b[0m Python ML microservice is already active on http://127.0.0.1:8000");
  } else {
    console.log("\x1b[36m[ML-SERVICE]\x1b[0m Launching FastAPI Python Microservice on port 8000...");
    const pythonCmd = isWin ? "python" : "python3";
    mlProcess = spawn(
      `${pythonCmd} -m uvicorn app.main:app --app-dir ml-service --host 0.0.0.0 --port 8000`,
      { cwd: rootDir, shell: true, stdio: ["inherit", "pipe", "pipe"] }
    );

    mlProcess.stdout.on("data", (data) => {
      process.stdout.write(`\x1b[36m[ML-SERVICE]\x1b[0m ${data}`);
    });

    mlProcess.stderr.on("data", (data) => {
      process.stderr.write(`\x1b[33m[ML-SERVICE]\x1b[0m ${data}`);
    });

    mlProcess.on("exit", (code) => {
      if (code !== 0 && code !== null) {
        console.log(`\x1b[31m[ML-SERVICE]\x1b[0m Exited with code ${code}`);
      }
    });
  }

  console.log("\x1b[32m[FRONTEND]\x1b[0m Launching Next.js 16 Web Application on port 3000...");
  const frontendProcess = spawn(
    "npm --prefix frontend run dev",
    { cwd: rootDir, shell: true, stdio: ["inherit", "pipe", "pipe"] }
  );


  frontendProcess.stdout.on("data", (data) => {
    process.stdout.write(`\x1b[32m[FRONTEND]\x1b[0m ${data}`);
  });

  frontendProcess.stderr.on("data", (data) => {
    process.stderr.write(`\x1b[35m[FRONTEND]\x1b[0m ${data}`);
  });

  frontendProcess.on("exit", (code) => {
    console.log(`\x1b[32m[FRONTEND]\x1b[0m Exited with code ${code}`);
    if (mlProcess) mlProcess.kill();
    process.exit(code || 0);
  });

  // Handle graceful exit
  function cleanup() {
    console.log("\n\x1b[33mShutting down all services...\x1b[0m");
    if (mlProcess) {
      try {
        mlProcess.kill();
      } catch (e) {}
    }
    if (frontendProcess) {
      try {
        frontendProcess.kill();
      } catch (e) {}
    }
    process.exit(0);
  }

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
}

startAll().catch(console.error);
