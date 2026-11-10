import { test } from "node:test";
import assert from "node:assert/strict";
import { createNativeRecognition } from "../src/native-speech.js";
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
function harness(permission = { granted: true }) {
  const listeners = new Map(),
    starts = [],
    stops = [];
  const plugin = {
    requestPermissions: async () => permission,
    available: async () => ({ available: true }),
    addListener: async (name, fn) => {
      const list = listeners.get(name) || new Set();
      list.add(fn);
      listeners.set(name, list);
      return { remove: async () => list.delete(fn) };
    },
    start: async (options) => {
      starts.push(options);
    },
    stop: async (options) => {
      stops.push(options);
    },
  };
  const Recognition = createNativeRecognition(plugin),
    speech = new Recognition();
  return {
    plugin,
    speech,
    starts,
    stops,
    send(name, event) {
      for (const fn of listeners.get(name) || []) fn(event);
    },
    count() {
      return [...listeners.values()].reduce((n, set) => n + set.size, 0);
    },
  };
}
test("native Arabic partials reveal live text but only native final callbacks are final", async () => {
  const h = harness(),
    results = [];
  let ended = 0;
  h.speech.onresult = (e) => results.push(e.results[0]);
  h.speech.onend = () => ended++;
  h.speech.start();
  await tick();
  const id = h.starts[0].sessionId;
  assert.equal(h.starts[0].language, "ar-SA");
  assert.equal(h.starts[0].partialResults, true);
  h.send("speechResult", {
    sessionId: id,
    transcript: "الحمد لله",
    isFinal: false,
  });
  assert.equal(results[0].isFinal, false);
  assert.equal(ended, 0);
  h.send("speechResult", {
    sessionId: id,
    transcript: "الحمد لله رب العالمين",
    isFinal: true,
  });
  assert.equal(results[1].isFinal, true);
  assert.equal(results[1][0].transcript, "الحمد لله رب العالمين");
  h.send("speechEnded", { sessionId: id });
  assert.equal(ended, 1);
  assert.equal(h.count(), 0);
});
test("native permission denial surfaces an error without starting or leaving listeners", async () => {
  const h = harness({ granted: false }),
    errors = [];
  let ended = 0;
  h.speech.onerror = (e) => errors.push(e.error);
  h.speech.onend = () => ended++;
  h.speech.start();
  await tick();
  assert.deepEqual(errors, ["not-allowed"]);
  assert.equal(ended, 1);
  assert.equal(h.starts.length, 0);
  assert.equal(h.count(), 0);
});
test("native pause ignores stale results and a new recognition session has a new ID", async () => {
  const h = harness(),
    results = [];
  h.speech.onresult = (e) => results.push(e);
  h.speech.start();
  await tick();
  const first = h.starts[0].sessionId;
  h.speech.abort();
  h.speech.start();
  await tick();
  const second = h.starts[1].sessionId;
  assert.notEqual(first, second);
  h.send("speechResult", {
    sessionId: first,
    transcript: "stale",
    isFinal: true,
  });
  assert.equal(results.length, 0);
  h.send("speechResult", {
    sessionId: second,
    transcript: "جديد",
    isFinal: false,
  });
  assert.equal(results.length, 1);
  h.speech.abort();
  assert.equal(h.count(), 0);
});
test("pausing while native permission is pending never starts the microphone later", async () => {
  const h = harness();
  let allow;
  h.plugin.requestPermissions = () =>
    new Promise((resolve) => (allow = resolve));
  h.speech.start();
  h.speech.abort();
  allow({ granted: true });
  await tick();
  assert.equal(h.starts.length, 0);
  assert.equal(h.count(), 0);
});
test("native start failures are visible and remove listeners", async () => {
  const h = harness(),
    errors = [];
  h.plugin.start = async () => {
    throw Error("hardware unavailable");
  };
  h.speech.onerror = (e) => errors.push(e.error);
  h.speech.start();
  await tick();
  assert.deepEqual(errors, ["audio-capture"]);
  assert.equal(h.count(), 0);
});
