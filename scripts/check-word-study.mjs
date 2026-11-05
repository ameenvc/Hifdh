import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
const port = 4181,
  url = `http://127.0.0.1:${port}/Hifdh/`;
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
    "--base=/Hifdh/",
  ],
  { stdio: ["ignore", "ignore", "pipe"] },
);
let serverError = "";
server.stderr.on("data", (chunk) => (serverError += chunk));
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null)
      throw Error(serverError || "Preview server exited");
    try {
      const result = await fetch(url);
      if (result.ok) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.ok(ready, "Production preview did not start");
  const executablePath =
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined);
  browser = await chromium.launch({ executablePath, args: ["--no-sandbox"] });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  assert.ok(
    await page
      .locator("body")
      .evaluate((e) => e.classList.contains("focus-reading")),
  );
  assert.equal(await page.locator(".reader-mode").isVisible(), false);
  assert.equal(await page.locator('.reader-mode a[href*="tanzil"]').count(), 0);
  const selectMode = async (mode) => {
    await page.locator("#reader-settings").click();
    await page.locator(`[data-mode="${mode}"]`).click();
    await page.locator("#reader-settings").click();
  };
  const original = await page.locator(".mushaf-text").allTextContents();
  assert.equal(
    await page.locator("#study-grammar-quick").getAttribute("aria-pressed"),
    "true",
  );
  await page.keyboard.press("Escape");
  const word = page.locator('[data-study-word="1:5:0"]');
  await word.waitFor();
  await page.waitForFunction(
    () =>
      document
        .querySelector('[data-study-word="1:5:0"]')
        ?.getAttribute("role") === "button",
  );
  await word.tap();
  await page.waitForSelector("#word-study-panel");
  assert.match(
    await page.locator("#word-study-panel").textContent(),
    /Imperative/,
  );
  assert.match(await page.locator("#word-study-panel").textContent(), /هدي/);
  await page.waitForFunction(() =>
    document.querySelector(".study-meaning")?.textContent.includes("Guide us"),
  );
  const bounds = await page.locator("#word-study-panel").boundingBox();
  const reading = await page.locator(".mushaf").boundingBox();
  assert.ok(
    bounds.y >= reading.y &&
      bounds.y + bounds.height <= reading.y + reading.height + 1,
    "Study card must leave reader controls accessible",
  );
  assert.ok(
    bounds.x >= 0 &&
      bounds.x + bounds.width <= 390 &&
      bounds.y >= 0 &&
      bounds.y + bounds.height <= 844,
  );

  assert.equal(
    await page.locator(".study-attached").getAttribute("open"),
    null,
  );
  await page.locator("#word-study-panel>button").click();
  await page.locator('[data-study-word="1:2:0"]').tap();
  assert.equal(
    await page.locator("#word-study-panel > .study-segment").count(),
    1,
  );
  assert.equal(
    await page.locator(".study-attached .study-segment").isVisible(),
    false,
  );
  await page.locator(".study-attached summary").click();
  assert.equal(
    await page.locator(".study-attached .study-segment").isVisible(),
    true,
  );
  await page.locator("#word-study-panel>button").click();
  await page.locator('.verse-marker[data-chapter="1"][data-verse="5"]').tap();
  await page.waitForFunction(
    () =>
      document.querySelector(".verse-meaning-text")?.textContent ===
      "Show us the straight path",
  );
  assert.ok(
    (await page.locator(".verse-meaning-credit").textContent()).includes(
      "Pickthall",
    ),
  );
  await page.keyboard.press("ArrowRight");
  assert.equal(await page.locator(".mushaf").getAttribute("data-page"), "1");
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("#verse-meaning-panel").count(), 0);
  assert.equal(
    await page.evaluate(() => document.activeElement?.dataset.verse),
    "5",
  );
  assert.equal(
    await page.locator("#study-repeated-quick").getAttribute("aria-pressed"),
    "true",
  );
  await page.keyboard.press("Escape");
  assert.ok((await page.locator(".repeated-word").count()) > 0);
  assert.deepEqual(
    await page.locator(".mushaf-text").allTextContents(),
    original,
  );
  await page.locator("#theme").click();
  await word.tap();
  assert.match(
    await page.locator("#word-study-panel").textContent(),
    /base form/,
  );
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 1440, height: 900 });
  await word.hover();
  await page.waitForSelector("#word-study-panel");
  await page.keyboard.press("Escape");
  assert.ok(
    await page
      .locator(".repeated-word")
      .first()
      .evaluate((e) => {
        e.classList.add("mistake");
        const sample = document.createElement("span");
        sample.style.color = "var(--red)";
        document.body.append(sample);
        const equal =
          getComputedStyle(e).color === getComputedStyle(sample).color;
        sample.remove();
        e.classList.remove("mistake");
        return equal;
      }),
    "Red alert must override study colours",
  );
  await selectMode("Recall & recite");
  assert.equal(await page.locator(".masked-word[data-study-word]").count(), 0);
  await page.locator('.verse-marker[data-chapter="1"][data-verse="0"]').tap();
  assert.equal(await page.locator(".verse-meaning-arabic").count(), 0);
  await page.keyboard.press("Escape");
  await selectMode("Read & reflect");
  await page.locator("#reader-settings").click();
  await page.locator("#study-grammar-quick").click();
  await page.locator("#study-repeated-quick").click();
  await page.reload();
  assert.equal(
    await page.locator("#study-grammar-quick").getAttribute("aria-pressed"),
    "false",
  );
  assert.equal(
    await page.locator("#study-repeated-quick").getAttribute("aria-pressed"),
    "false",
  );
  assert.equal(await page.locator(".repeated-word").count(), 0);
  await word.tap();
  await page.waitForFunction(() =>
    document.querySelector(".study-meaning")?.textContent.includes("Guide us"),
  );
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#reader-settings").click();
  await page.locator("#font-size").evaluate((e) => {
    e.value = "30";
    e.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#reader-settings").click();
  for (const surah of ["1", "2", "19", "114"]) {
    await page.locator("#surah-picker").selectOption(surah);
    assert.equal(
      await page
        .locator(".mushaf-text")
        .first()
        .evaluate((e) => getComputedStyle(e).fontSize),
      "30px",
    );
  }
  await page.locator("#surah-picker").selectOption("2");
  await page.locator("#page-next").click();
  assert.equal(
    await page
      .locator(".mushaf-text")
      .first()
      .evaluate((e) => getComputedStyle(e).fontSize),
    "30px",
  );
  assert.equal(
    await page
      .locator(".paged-mushaf")
      .evaluate((e) => getComputedStyle(e).overflowY),
    "auto",
  );
  await page.setViewportSize({ width: 768, height: 1024 });
  assert.equal(
    await page
      .locator(".mushaf-text")
      .first()
      .evaluate((e) => getComputedStyle(e).fontSize),
    "30px",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: phone tap, desktop hover, corpus verb details, theme, word colours, unchanged Quran text, hidden-word protection, English meanings, minimal reader and consistent text size across pages/resizing.",
  );
} finally {
  await browser?.close();
  server.kill();
}
