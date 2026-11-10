import { chromium } from "playwright";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
const svg = await readFile("public/icons/hifdh.svg", "utf8");
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ||
    (existsSync("/usr/bin/chromium") ? "/usr/bin/chromium" : undefined),
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  const render = async (path, size) => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      "<style>html,body{margin:0;width:100%;height:100%;}svg{display:block;width:100%;height:100%;}</style>" +
        svg,
    );
    await page.screenshot({ path });
  };
  for (const size of [180, 192, 512])
    await render(`public/icons/hifdh-${size}.png`, size);
  if (existsSync("android/app/src/main/res")) {
    const sizes = {
      "mipmap-mdpi": 48,
      "mipmap-hdpi": 72,
      "mipmap-xhdpi": 96,
      "mipmap-xxhdpi": 144,
      "mipmap-xxxhdpi": 192,
    };
    for (const [folder, size] of Object.entries(sizes))
      for (const name of [
        "ic_launcher",
        "ic_launcher_round",
        "ic_launcher_foreground",
      ])
        await render(
          `android/app/src/main/res/${folder}/${name}.png`,
          name.endsWith("foreground") ? size * 2.25 : size,
        );
  }
  if (existsSync("ios/App/App/Assets.xcassets/AppIcon.appiconset"))
    await render(
      "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png",
      1024,
    );
} finally {
  await browser.close();
}
