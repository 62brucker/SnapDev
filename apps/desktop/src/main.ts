import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { app as electronApp, BrowserWindow, dialog, shell } from "electron";
import { createAgent } from "../../agent/src/server/app.js";

const WEB_PORT = 3000;
const AGENT_PORT = 4177;
const WEB_ORIGIN = `http://localhost:${WEB_PORT}`;
const DASHBOARD_URL = `${WEB_ORIGIN}/dashboard`;

let mainWindow: BrowserWindow | undefined;
let webProcess: ChildProcess | undefined;
let localAgent: ReturnType<typeof createAgent>["app"] | undefined;
let isQuitting = false;

electronApp.setName("SnapDev");

if (!electronApp.requestSingleInstanceLock()) {
  electronApp.quit();
} else {
  electronApp.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  electronApp.whenReady().then(startDesktop).catch(showStartupFailure);
  electronApp.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) void createWindow();
  });
  electronApp.on("before-quit", () => { isQuitting = true; });
  electronApp.on("window-all-closed", () => {
    if (process.platform !== "darwin") electronApp.quit();
  });
  electronApp.on("will-quit", () => {
    webProcess?.kill();
    if (localAgent) void localAgent.close();
  });
}

async function startDesktop() {
  await ensureAgent();
  await ensureWebDashboard();
  await createWindow();
}

async function ensureAgent() {
  if (await isReachable(`http://127.0.0.1:${AGENT_PORT}/api/health`)) return;

  const created = createAgent({
    HOST: "0.0.0.0",
    PORT: AGENT_PORT,
    WEB_ORIGIN,
    MAX_CAPTURE_BYTES: 20 * 1024 * 1024
  });
  await created.app.listen({ host: "0.0.0.0", port: AGENT_PORT });
  localAgent = created.app;
}

async function ensureWebDashboard() {
  if (await isReachable(DASHBOARD_URL)) return;

  const environment = {
    ...process.env,
    HOSTNAME: "0.0.0.0",
    PORT: String(WEB_PORT),
    NODE_ENV: electronApp.isPackaged ? "production" : "development"
  };

  if (electronApp.isPackaged) {
    const serverEntry = join(process.resourcesPath, "web", "apps", "web", "server.js");
    if (!existsSync(serverEntry)) throw new Error(`The bundled dashboard is missing: ${serverEntry}`);
    webProcess = spawn(process.execPath, [serverEntry], {
      env: { ...environment, ELECTRON_RUN_AS_NODE: "1" },
      stdio: "ignore",
      windowsHide: true
    });
  } else {
    const repositoryRoot = resolve(__dirname, "../../..");
    webProcess = spawn("pnpm", ["--filter", "@snapdev/web", "dev"], {
      cwd: repositoryRoot,
      env: environment,
      stdio: "inherit",
      windowsHide: true
    });
  }

  webProcess.once("exit", (code) => {
    webProcess = undefined;
    if (!isQuitting && code && code !== 0) void showStartupFailure(new Error(`Dashboard process exited with code ${code}.`));
  });

  await waitUntilReachable(DASHBOARD_URL, 30_000);
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    title: "SnapDev",
    width: 1440,
    height: 960,
    minWidth: 960,
    minHeight: 700,
    backgroundColor: "#f6f7f9",
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) void shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => { mainWindow = undefined; });
  await mainWindow.loadURL(DASHBOARD_URL);
}

async function isReachable(url: string) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1_000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitUntilReachable(url: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isReachable(url)) return;
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 250));
  }
  throw new Error("The SnapDev dashboard did not start in time.");
}

async function showStartupFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  await dialog.showMessageBox({
    type: "error",
    title: "SnapDev could not start",
    message: "SnapDev could not start its local relay.",
    detail: `${message}\n\nQuit any service using ports 3000 or 4177, then reopen SnapDev.`
  });
  electronApp.quit();
}
