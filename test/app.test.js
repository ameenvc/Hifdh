import { test, before } from "node:test";
import assert from "node:assert/strict";
import { build } from "vite";
import { JSDOM } from "jsdom";
let bundle;
before(async () => {
  const result = await build({
    logLevel: "silent",
    build: { write: false, minify: false },
  });
  bundle = result.output.find(
    (asset) => asset.type === "chunk" && asset.isEntry,
  ).code;
});
function app(fetchImpl = () => Promise.reject(Error("offline"))) {
  const dom = new JSDOM('<div id="app"></div>', {
    url: "https://example.test/Hifdh/",
    runScripts: "outside-only",
    pretendToBeVisual: true,
  });
  const w = dom.window;
  w.fetch = fetchImpl;
  let speech, player;
  w.SpeechRecognition = class {
    constructor() {
      speech = this;
    }
    start() {}
    abort() {
      this.onend?.();
    }
  };
  w.Audio = class {
    constructor() {
      player = this;
      this.calls = 0;
    }
    play() {
      this.calls++;
      return Promise.resolve();
    }
    pause() {}
  };
  w.eval(bundle);
  const click = (id) => {
    const element = w.document.getElementById(id);
    assert.ok(element, `Missing #${id}`);
    element.click();
  };
  const tab = (name) => {
    const element = w.document.querySelector(`[data-tab="${name}"]`);
    assert.ok(element);
    element.click();
  };
  const say = (text) =>
    speech.onresult({
      results: [Object.assign([{ transcript: text }], { isFinal: true })],
    });
  return {
    w,
    click,
    tab,
    say,
    get player() {
      return player;
    },
    get speech() {
      return speech;
    },
    close: () => dom.window.close(),
  };
}
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
test("reader offers continuous ayahs, word hints, bookmarks and correct reveal states", async () => {
  const a = app();
  await tick();
  const { w, click } = a;
  assert.equal(w.document.querySelectorAll(".mushaf-verse").length, 7);
  w.document.querySelector('[data-mode="Recall & recite"]').click();
  const count = () =>
    w.document.querySelector(".current-verse").querySelectorAll(".masked-word")
      .length;
  assert.equal(count(), 4);
  click("hint");
  assert.equal(count(), 3);
  click("listen");
  a.say("بسم الله");
  assert.equal(count(), 2);
  click("bookmark");
  assert.equal(JSON.parse(w.localStorage.getItem("hifdh-bookmark")).verse, 0);
  click("next");
  assert.ok(w.document.querySelector('[data-verse="1"][aria-current="true"]'));
  assert.equal(
    w.document.querySelector(".mushaf-verse").querySelectorAll(".masked-word")
      .length,
    2,
  );
  a.close();
});
test("final recognized mismatches persist with classifications and can be removed", async () => {
  const a = app();
  await tick();
  a.click("listen");
  a.say("بسم نور الرحمن الرحيم");
  const history = JSON.parse(a.w.localStorage.getItem("hifdh-mistakes"));
  assert.equal(history.length, 1);
  assert.equal(history[0].details[0].type, "incorrect");
  assert.ok(a.w.document.querySelector(".word.mistake"));
  a.tab("Mistakes");
  assert.equal(a.w.document.querySelectorAll(".mistake-card").length, 1);
  assert.match(a.w.document.querySelector(".comparison").textContent, /نور/);
  a.w.document.querySelector("[data-delete]").click();
  assert.equal(
    JSON.parse(a.w.localStorage.getItem("hifdh-mistakes")).length,
    0,
  );
  a.close();
});
test("finish explicitly records unspoken ending while retry clears the visible attempt", async () => {
  const a = app();
  await tick();
  a.click("listen");
  a.say("بسم الله");
  assert.equal(
    JSON.parse(a.w.localStorage.getItem("hifdh-mistakes")).length,
    0,
  );
  a.click("finish");
  assert.equal(
    JSON.parse(a.w.localStorage.getItem("hifdh-mistakes"))[0].details.length,
    2,
  );
  a.click("retry");
  assert.equal(a.w.document.querySelector(".transcript"), null);
  a.close();
});
test("manual sessions update real activity and progress without invented data", async () => {
  const a = app();
  await tick();
  a.tab("Progress");
  assert.match(
    a.w.document.querySelector(".progress-stats").textContent,
    /0 recorded sessions/,
  );
  a.w.document.getElementById("session-minutes").value = "12";
  a.w.document
    .getElementById("log-session")
    .dispatchEvent(new a.w.Event("submit", { cancelable: true }));
  assert.equal(
    Object.values(JSON.parse(a.w.localStorage.getItem("hifdh-activity")))[0]
      .seconds,
    720,
  );
  assert.match(
    a.w.document.querySelector(".progress-stats").textContent,
    /1 recorded sessions/,
  );
  assert.equal(
    a.w.document.querySelectorAll(".activity-cell.level-4").length,
    2,
  ); // Actual day + legend.
  a.close();
});
test("search handles matched Arabic phrases and opens the selected verse", async () => {
  const a = app(async (url) => {
    if (url.includes("/search/"))
      return {
        ok: true,
        json: async () => ({
          data: {
            count: 1,
            matches: [
              {
                surah: { number: 1, englishName: "Al-Faatiha" },
                numberInSurah: 2,
                text: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
              },
            ],
          },
        }),
      };
    throw Error("offline");
  });
  await tick();
  a.tab("Search");
  a.w.document.getElementById("search-query").value = "الحمد";
  a.w.document
    .getElementById("verse-search")
    .dispatchEvent(new a.w.Event("submit", { cancelable: true }));
  await tick();
  assert.equal(a.w.document.querySelectorAll(".search-result").length, 1);
  a.w.document.querySelector("[data-result]").click();
  assert.ok(
    a.w.document.querySelector('[data-verse="1"][aria-current="true"]'),
  );
  a.close();
});
test("offline search fails visibly and old speech cannot change another verse", async () => {
  const a = app();
  await tick();
  a.click("listen");
  const old = a.speech;
  a.click("next");
  old.onresult({
    results: [Object.assign([{ transcript: "بسم نور" }], { isFinal: true })],
  });
  assert.equal(
    a.w.document.querySelector(".current-verse .word.mistake"),
    null,
  );
  a.tab("Search");
  a.w.document.getElementById("search-query").value = "الحمد";
  a.w.document
    .getElementById("verse-search")
    .dispatchEvent(new a.w.Event("submit", { cancelable: true }));
  await tick();
  assert.match(
    a.w.document.querySelector(".search-status").textContent,
    /unavailable/,
  );
  a.close();
});
test("audio repeat stops after the requested count", async () => {
  const a = app();
  await tick();
  a.click("reader-settings");
  const select = a.w.document.getElementById("repeat-select");
  select.value = "3";
  select.dispatchEvent(new a.w.Event("change"));
  a.click("play");
  a.player.onended();
  a.player.onended();
  assert.equal(a.player.calls, 3);
  a.player.onended();
  assert.match(
    a.w.document.querySelector("[role=status]").textContent,
    /Listening complete/,
  );
  a.close();
});
