import { cp, mkdir, rm, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const desktopRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const webRoot = resolve(desktopRoot, "../web");
const standaloneRoot = join(webRoot, ".next", "standalone");
const targetRoot = join(desktopRoot, "resources", "web");
const bundledWebRoot = join(targetRoot, "apps", "web");

await assertDirectory(standaloneRoot, "Build @snapdev/web before packaging the desktop app.");
await rm(targetRoot, { recursive: true, force: true });
await mkdir(dirname(targetRoot), { recursive: true });
await cp(standaloneRoot, targetRoot, { recursive: true });
await mkdir(join(bundledWebRoot, ".next"), { recursive: true });
await cp(join(webRoot, ".next", "static"), join(bundledWebRoot, ".next", "static"), { recursive: true });

try {
  await assertDirectory(join(webRoot, "public"));
  await cp(join(webRoot, "public"), join(bundledWebRoot, "public"), { recursive: true });
} catch {
  // A public directory is optional for the dashboard bundle.
}

async function assertDirectory(path, message = `Missing directory: ${path}`) {
  try {
    if ((await stat(path)).isDirectory()) return;
  } catch {
    // Fall through to the descriptive error below.
  }
  throw new Error(message);
}
