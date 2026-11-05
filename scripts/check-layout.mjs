import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
const port = 4180,
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
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.SpeechRecognition = class {
      start() {}
      abort() {
        this.onend?.();
      }
    };
  });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  const close = (actual, expected, message) =>
    assert.ok(
      Math.abs(actual - expected) <= 1,
      `${message}: ${actual} vs ${expected}`,
    );
  const box = (selector) => page.locator(selector).boundingBox();
  const viewports = [
    [320, 568],
    [390, 844],
    [520, 844],
    [521, 844],
    [768, 1024],
    [850, 844],
    [851, 844],
    [1024, 768],
    [1440, 900],
    [1920, 1080],
    [844, 390],
  ];
  for (const [width, height] of viewports) {
    await page.setViewportSize({ width, height });
    for (const theme of ["white", "black"]) {
      if ((await page.getAttribute("body", "data-theme")) !== theme)
        await page.locator("#theme").click();
      for (const view of ["reader", "reciting"]) {
        if (view === "reciting") {
          await page.locator("#controls-toggle").click();
          await page.locator("#listen").click();
        }
        const tag = `${width}x${height} ${theme} ${view}`;
        const header = await Promise.all(
          [
            '[aria-label="Open surah library"]',
            "#surah-picker",
            "#bookmark",
            "#theme",
            "#reader-settings",
            "#focus",
          ].map(box),
        );
        for (const item of header) {
          close(item.y, header[0].y, `${tag} header top`);
          close(item.height, header[0].height, `${tag} header height`);
          assert.ok(
            item.x >= 0 && item.x + item.width <= width,
            `${tag} clipped header control`,
          );
        }
        const pager = await box(".page-navigation"),
          previous = await box("#page-prev"),
          next = await box("#page-next"),
          counter = await box(".page-counter");
        close(previous.width, next.width, `${tag} page button widths`);
        close(previous.y, next.y, `${tag} page button tops`);
        close(
          counter.x + counter.width / 2,
          pager.x + pager.width / 2,
          `${tag} page counter center`,
        );
        const footer = await page.locator(".reader-controls").evaluate((e) => {
            const r = e.getBoundingClientRect(),
              s = getComputedStyle(e);
            return {
              right: r.right,
              padding: parseFloat(s.paddingRight),
              border: parseFloat(s.borderRightWidth),
            };
          }),
          toggle = await box("#controls-toggle");
        const check = await box("#check-recitation");
        assert.ok(check && check.x >= 0 && check.height >= 44 && check.y + check.height <= height, `${tag} main recitation button clipped`);
        assert.ok(check.x + check.width < toggle.x, `${tag} main action overlaps menu`);
        close(check.y, toggle.y, `${tag} main action alignment`);
        close(toggle.width, 44, `${tag} compact icon width`);
        close(toggle.height, 44, `${tag} compact icon height`);
        close(
          toggle.x + toggle.width,
          footer.right - footer.padding - footer.border,
          `${tag} bottom right alignment`,
        );
        assert.ok(
          toggle.y + toggle.height <= height,
          `${tag} bottom icon clipped`,
        );
        await page.locator("#controls-toggle").click();
        const sheet = await box(".controls-sheet");
        assert.ok(
          sheet.x >= 0 &&
            sheet.y >= 0 &&
            sheet.x + sheet.width <= width &&
            sheet.y + sheet.height <= height,
          `${tag} popup clipped`,
        );
        close(
          sheet.x + sheet.width,
          toggle.x + toggle.width,
          `${tag} popup anchor`,
        );
        const buttons = await page
          .locator(".controls-grid>button")
          .evaluateAll((items) =>
            items.map((item) => {
              const r = item.getBoundingClientRect();
              return { x: r.x, y: r.y, width: r.width, height: r.height };
            }),
          );
        for (let i = 0; i < buttons.length; i++) {
          const item = buttons[i];
          close(item.width, buttons[0].width, `${tag} dropdown width`);
          close(item.x, buttons[i % 2].x, `${tag} dropdown column`);
          assert.ok(item.height >= 52, `${tag} short dropdown action`);
          if (i % 2 === 1) {
            close(item.y, buttons[i - 1].y, `${tag} dropdown row`);
            close(
              item.height,
              buttons[i - 1].height,
              `${tag} dropdown row heights`,
            );
          }
        }
        await page.keyboard.press("Escape");
        assert.ok(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
          `${tag} horizontal overflow`,
        );
        if (view === "reciting") {
          await page.locator("#controls-toggle").click();
          await page.locator("#listen").click();
          await page.keyboard.press("Escape");
          await page.locator("#focus").click();
        }
      }
    }
  }
  for (const width of [320, 390, 400, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    await page.locator("#controls-toggle").click();
    await page.locator("#open-challenge").click();
    const actions = await page
      .locator(".challenge-setup-actions>button")
      .evaluateAll((items) =>
        items.map((e) => {
          const r = e.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        }),
      );
    close(actions[0].w, actions[1].w, `${width} challenge widths`);
    close(actions[0].h, actions[1].h, `${width} challenge heights`);
    if (width < 400)
      close(actions[0].x, actions[1].x, `${width} stacked actions`);
    else close(actions[0].y, actions[1].y, `${width} challenge row`);
    await page.locator('.sidebar [data-tab="Reader"]').click();
  }
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log(
    `PASS: exact header, pager, dropdown, footer and challenge alignment across ${viewports.length} sizes in both themes and reader/reciting modes.`,
  );
} finally {
  await browser?.close();
  server.kill();
}
