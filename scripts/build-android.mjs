import { spawn } from "node:child_process";
import { mkdir, copyFile, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const windows = process.platform === "win32";
const child = spawn(
  windows ? "gradlew.bat" : "./gradlew",
  ["assembleDebug", "--no-daemon"],
  { cwd: "android", stdio: "inherit", shell: windows },
);
const code = await new Promise((resolve, reject) => {
  child.once("error", reject);
  child.once("exit", resolve);
});
if (code !== 0) process.exit(code || 1);
await mkdir("artifacts", { recursive: true });
const target = "artifacts/Hifdh-preview.apk";
await copyFile("android/app/build/outputs/apk/debug/app-debug.apk", target);
const digest = createHash("sha256")
  .update(await readFile(target))
  .digest("hex");
await writeFile(target + ".sha256", `${digest}  Hifdh-preview.apk\n`);
console.log(`Installable Android preview: ${target}\nSHA-256: ${digest}`);
