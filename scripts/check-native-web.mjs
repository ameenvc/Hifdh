import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
import { chromium } from "playwright";
const url = "http://127.0.0.1:4183/";
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    "4183",
    "--strictPort",
    "--base=/",
    "--outDir",
    "native-dist",
  ],
  { stdio: "ignore" },
);
let browser;
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  browser = await chromium.launch({
    executablePath:
      process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
      (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  const ref = page.locator('[data-study-word="1:5:0"]');
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-study-word="1:5:0"]')
        ?.getAttribute("role") === "button",
  );
  await ref.tap();
  await page.waitForFunction(
    () =>
      document.querySelector(".study-meaning-value")?.textContent ===
      "Guide us",
  );
  assert.equal(
    await page.locator(".study-base .study-arabic-run").first().textContent(),
    "هَدَى",
  );
  await page.keyboard.press("Escape");
  await page.locator('.verse-marker[data-chapter="1"][data-verse="5"]').tap();
  await page.waitForFunction(
    () =>
      document.querySelector(".verse-meaning-text")?.textContent ===
      "Show us the straight path",
  );
  const manifest = await page.evaluate(() =>
    fetch("manifest.webmanifest").then((r) => r.json()),
  );
  assert.equal(manifest.display, "standalone");
  for (const icon of manifest.icons)
    assert.ok((await fetch(url + icon.src)).ok);
  assert.deepEqual(errors, []);
  console.log(
    "PASS: native root-relative bundle loads Quran, grammar, word meanings, ayah meanings and install icons.",
  );
} finally {
  await browser?.close();
  server.kill();
}
