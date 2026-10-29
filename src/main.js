import "@fontsource/amiri/arabic-400.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-700.css";
import "./style.css";
import { compareRecitation, normalize, followVerses } from "./recitation.js";
import { dateKey } from "./activity.js";
import {
  readerScreen,
  mistakesScreen,
  searchScreen,
  progressScreen,
} from "./screens.js";
import {
  chapter,
  surahs,
  practiceText,
  searchQuran,
  ayahTranscript,
} from "./quran.js";
const initialChapter = chapter(1);
let saved = {};
try {
  saved = JSON.parse(localStorage.getItem("hifdh-progress") || "{}") || {};
} catch {}
function readLocal(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}
let state = {
  surah: 1,
  verses: initialChapter.verses,
  ayahNumbers: initialChapter.ayahNumbers,
  verse: 0,
  hidden: false,
  tab: "Reader",
  mode: "Read & reflect",
  listening: false,
  statuses: [],
  feedback: "Take a breath. Begin when you’re ready.",
  saved,
  sound: true,
  hints: 0,
  transcript: "",
  repeats: 1,
  playing: false,
  extraWords: 0,
  revealAll: false,
  settingsOpen: false,
  fontSize: readLocal("hifdh-font-size", 32),
  bookmark: readLocal("hifdh-bookmark", null),
  mistakes: readLocal("hifdh-mistakes", []),
  activity: readLocal("hifdh-activity", {}),
  mistakeFilter: "all",
  searchQuery: "",
  searchResults: [],
  searchMessage: "Enter an Arabic phrase to search the Quran.",
  readerResults: {},
  attemptId: null,
  pendingDelete: false,
  loading: false,
  focusMode: false,
  theme: readLocal("hifdh-theme", "white") === "black" ? "black" : "white",
  recitationPage: false,
  controlsOpen: false,
  soundBlocked: false,
  alertActive: false,
};
let recognition,
  audio,
  requestId = 0,
  searchRequest = 0,
  activeSince = null,
  alertContext,
  alertAudio;
const icons = { leaf: "◈", home: "⌂", book: "▤", mic: "♩", chart: "◴" };
const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const current = () =>
  surahs.find((s) => s.number === state.surah) || {
    englishName: "Surah",
    name: "",
    numberOfAyahs: state.verses.length,
  };
function persist() {
  try {
    localStorage.setItem("hifdh-progress", JSON.stringify(state.saved));
  } catch {
    state.feedback =
      "Your browser could not save progress. Keep this session open.";
  }
}
function render() {
  const s = current();
  const reading = state.tab === "Reader" || state.tab === "Practice";
  document.body.classList.toggle("focus-reading", reading && state.focusMode);
  document.body.classList.toggle(
    "reciting-page",
    reading && state.recitationPage,
  );
  document.body.dataset.theme = state.theme;
  document.body.classList.toggle("quran-open", reading);
  document.documentElement.dataset.theme = state.theme;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", state.theme === "white" ? "#ffffff" : "#000000");
  const scrollTop = document.querySelector(".mushaf")?.scrollTop || 0;
  document.querySelector("#app").innerHTML =
    `<aside class="sidebar"><a class="brand" href="#">◈ <span>hifdh<span class="brand-dot">.</span></span></a><div class="workspace-label">YOUR PERSONAL SANCTUARY</div><nav>${[
      ["Reader", "book", "Quran reader"],
      ["Practice", "mic", "Memorize"],
      ["Mistakes", "leaf", "Review"],
      ["Search", "home", "Similar verses"],
      ["Progress", "chart", "Progress"],
    ]
      .map(
        ([t, i, l]) =>
          `<button class="nav-item ${state.tab === t ? "active" : ""}" data-tab="${t}"><span>${icons[i]}</span>${l}${t === "Practice" ? "<small>01</small>" : ""}</button>`,
      )
      .join(
        "",
      )}</nav><div class="sidebar-bottom"><div class="small-flower">✧</div><p>Little by little,<br>the heart remembers.</p><span>YOUR JOURNEY, YOUR PACE</span></div><div class="profile"><div class="avatar">Y</div><div>Your journey<small>Growing every day</small></div><span>↗</span></div></aside>
<main class="${reading ? "reader-view" : ""}"><header><div class="breadcrumb">My workspace <span>/</span> ${state.tab === "Practice" ? "Memorization" : escape(state.tab)}</div><div class="header-right"><span class="today">☀ &nbsp; A good day to begin</span><div class="avatar mini">Y</div></div></header><section class="content ${reading ? "reader-content" : ""}">${reading ? '<div class="reader-intro"><span class="kicker">YOUR QURAN, CLOSE TO HEART</span><h1>Read. Remember. Return.</h1><button class="text-button" id="resume-bookmark">' + (state.bookmark ? "Resume bookmark →" : "Choose a surah →") + "</button></div>" : ""}<div class="eyebrow">السَّلَامُ عَلَيْكُمْ <span>PEACE BE UPON YOU</span></div><div class="page-title"><div><h1>A little closer, every ayah.</h1><p>Make room for the Quran. Let each verse settle in your heart.</p></div><span class="date-pill">✧ &nbsp; Your daily connection</span></div>
${reading ? readerScreen(state, surahs, readerWords, recitationFeedback) : state.tab === "Library" ? library() : state.tab === "Mistakes" ? mistakesScreen(state) : state.tab === "Search" ? searchScreen(state) : progressScreen(state, surahs)}
<footer><span>◈ &nbsp; Quran text: <a href="https://tanzil.net" target="_blank" rel="noopener">Tanzil Project</a> · Uthmani</span><span>Consistency over perfection.</span></footer></section></main>`;
  bind();
  const mushaf = document.querySelector(".mushaf");
  if (mushaf) mushaf.scrollTop = scrollTop;
}
function library() {
  return `<div class="section-heading"><h2>Find your next surah</h2><span>114 chapters · one journey</span></div><div class="library-grid">${surahs.map((s) => `<button class="library-card" data-surah="${s.number}"><span class="chapter-number">${s.number}</span><h2>${escape(s.englishName)}</h2><p lang="ar">${escape(s.name)}</p><small>${s.numberOfAyahs} AYAHS &nbsp; →</small></button>`).join("")}</div><p class="library-note">All 114 surahs are bundled. Quran text: Tanzil Project · Uthmani, Hafs numbering.</p>`;
}
function stop() {
  const previous = recognition;
  recognition = null;
  previous?.abort();
  state.listening = false;
  if (audio) {
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio = null;
  }
  state.playing = false;
  endActivity();
}
function resetAttempt() {
  state.statuses = [];
  state.hints = 0;
  state.transcript = "";
  state.extraWords = 0;
  state.revealAll = false;
  state.attemptId = null;
  state.alertActive = false;
}
function activeText() {
  return practiceText(state.surah, state.verse, state.verses[state.verse]);
}
function renderWords() {
  return activeText()
    .split(/\s+/)
    .map((word, i) => {
      const status = state.statuses[i] || "pending";
      const masked =
        state.mode === "Recall & recite" &&
        !state.revealAll &&
        status === "pending" &&
        i >= state.hints;
      return `<span class="word ${status} ${masked ? "masked-word" : ""}" ${masked ? 'aria-label="Hidden word"' : ""}>${masked ? "•••" : escape(word)}</span>`;
    })
    .join(" ");
}
function playAyah() {
  if (state.loading) return;
  if (state.playing) {
    stop();
    state.feedback = "Audio paused.";
    render();
    return;
  }
  stop();
  const player = new Audio(
    `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${state.ayahNumbers[state.verse]}.mp3`,
  );
  audio = player;
  let played = 0;
  const total = state.repeats;
  state.playing = true;
  state.controlsOpen = false;
  activeSince = Date.now();
  const play = () => {
    if (audio !== player) return;
    state.feedback = `Playing recitation · repeat ${played + 1} of ${total}`;
    render();
    player.play().catch(() => {
      if (audio !== player) return;
      state.playing = false;
      endActivity();
      state.feedback =
        "Audio could not start. Check your connection and try again.";
      render();
    });
  };
  player.onended = () => {
    if (audio !== player) return;
    played++;
    if (played < total) {
      player.currentTime = 0;
      play();
    } else {
      state.playing = false;
      endActivity();
      state.feedback = "Listening complete. Try reciting from memory.";
      render();
    }
  };
  player.onerror = () => {
    if (audio !== player) return;
    state.playing = false;
    endActivity();
    state.feedback = "Audio unavailable. Check your connection and try again.";
    render();
  };
  play();
}
function changeVerse(offset) {
  if (state.loading) return;
  stop();
  state.verse = Math.max(
    0,
    Math.min(state.verses.length - 1, state.verse + offset),
  );
  resetAttempt();
  state.hidden = false;
  state.feedback = "Take a breath. Begin when you’re ready.";
  render();
  scrollToSelected();
}
function scrollToSelected() {
  const panel = document.querySelector(".mushaf"),
    verse = document.querySelector(".current-verse");
  if (!panel || !verse) return;
  const p = panel.getBoundingClientRect(),
    v = verse.getBoundingClientRect();
  if (v.bottom > p.bottom) panel.scrollTop += v.bottom - p.bottom + 15;
  else if (v.top < p.top) panel.scrollTop -= p.top - v.top + 15;
}
async function loadSurah(n, verse = 0, destination = "Reader") {
  stop();
  requestId++;
  state.loading = false;
  try {
    const loaded = chapter(n);
    state.surah = n;
    state.verses = loaded.verses;
    state.ayahNumbers = loaded.ayahNumbers;
    state.verse = Math.max(0, Math.min(loaded.verses.length - 1, verse));
    resetAttempt();
    state.hidden = false;
    state.tab = destination;
    state.feedback =
      "Ready to recite. Quran text: Tanzil Project, Uthmani script.";
  } catch {
    state.feedback =
      "This surah could not be opened. Please select another surah.";
  }
  render();
  scrollToSelected();
}
function prepareAlertSound() {
  if (!state.sound) return;
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (Context) {
      if (!alertContext || alertContext.state === "closed")
        alertContext = new Context();
      // Must run directly in the Start/Test sound tap on iOS.
      Promise.resolve(alertContext.resume()).catch(() => {
        state.soundBlocked = true;
      });
      if (alertContext.createBuffer && alertContext.createBufferSource) {
        const source = alertContext.createBufferSource();
        source.buffer = alertContext.createBuffer(1, 1, 22050);
        source.connect(alertContext.destination);
        source.start(0);
      }
    }
    if (!Context)
      alertAudio ||= new Audio(`${import.meta.env.BASE_URL}mistake-alert.wav`);
  } catch {
    state.soundBlocked = true;
  }
}
function tone() {
  if (!state.sound) return;
  const fallback = () => {
    try {
      alertAudio ||= new Audio(`${import.meta.env.BASE_URL}mistake-alert.wav`);
      alertAudio.currentTime = 0;
      Promise.resolve(alertAudio.play())
        .then(() => {
          state.soundBlocked = false;
        })
        .catch(() => {
          state.soundBlocked = true;
        });
    } catch {
      state.soundBlocked = true;
    }
  };
  const play = () => {
    try {
      if (
        !alertContext ||
        alertContext.state === "suspended" ||
        alertContext.state === "interrupted"
      ) {
        fallback();
        return;
      }
      const ctx = alertContext,
        o = ctx.createOscillator(),
        g = ctx.createGain(),
        now = ctx.currentTime;
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = 740;
      g.gain.setValueAtTime(0.001, now);
      g.gain.exponentialRampToValueAtTime(0.32, now + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.19);
      g.gain.setValueAtTime(0.001, now + 0.27);
      g.gain.exponentialRampToValueAtTime(0.32, now + 0.285);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.48);
      o.start();
      o.stop(now + 0.5);
      state.soundBlocked = false;
    } catch {
      fallback();
    }
  };
  if (
    alertContext &&
    (alertContext.state === "suspended" || alertContext.state === "interrupted")
  )
    Promise.resolve(alertContext.resume()).then(play).catch(fallback);
  else play();
}
function startReciting() {
  if (state.loading) return;
  prepareAlertSound();
  if (state.listening) {
    stop();
    state.feedback = "Session paused. Take your time.";
    render();
    return;
  }
  const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Speech) {
    state.feedback =
      "Speech recognition is unavailable. Use a supported browser with microphone access, or practice with hints and audio.";
    state.controlsOpen = true;
    render();
    return;
  }
  stop();
  resetAttempt();
  state.hidden = false;
  const session = new Speech();
  recognition = session;
  session.lang = "ar-SA";
  session.continuous = true;
  session.interimResults = true;
  let lastFinal = "",
    consumedWords = 0;
  const startVerse = state.verse;
  const passage = state.verses.map((verse, index) =>
    practiceText(state.surah, index, verse),
  );
  const words = (text) =>
    ayahTranscript(state.surah, startVerse, text, normalize)
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  session.onresult = (e) => {
    if (recognition !== session) return;
    let transcript = "",
      finalTranscript = "";
    for (let i = 0; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript + " ";
      if (e.results[i].isFinal)
        finalTranscript += e.results[i][0].transcript + " ";
    }
    const allWords = words(transcript),
      finalWords = words(finalTranscript);
    const progression = followVerses(
      passage,
      state.verse,
      finalWords.slice(consumedWords).join(" "),
    );
    if (progression.completed.length) {
      let hadMistake = false;
      const originalVerse = state.verse;
      for (const completed of progression.completed) {
        state.verse = completed.verse;
        if (completed.verse !== originalVerse) state.attemptId = null;
        state.readerResults[`${state.surah}:${completed.verse}`] =
          completed.statuses;
        if (completed.details.length || state.attemptId)
          saveAttempt(completed.text, completed);
        hadMistake ||= completed.details.length > 0;
      }
      if (hadMistake) tone();
      consumedWords += progression.consumed;
      state.verse = Math.min(progression.verse, state.verses.length - 1);
      resetAttempt();
      lastFinal = "";
      if (progression.ended) {
        const last = progression.completed.at(-1);
        state.transcript = last.text;
        state.extraWords = last.extraWords;
        state.alertActive = last.details.length > 0;
        state.statuses = state.readerResults[`${state.surah}:${state.verse}`];
        stop();
        state.feedback = Object.values(state.readerResults).some((statuses) =>
          statuses.includes("mistake"),
        )
          ? "Session complete. Possible mistakes remain red for review; pronunciation and tajweed are not assessed."
          : "All remaining ayahs matched. Session complete; pronunciation and tajweed are not assessed.";
        render();
        scrollToSelected();
        return;
      }
    }
    const remaining = allWords.slice(consumedWords).join(" ");
    const finalRemaining = finalWords.slice(consumedWords).join(" ");
    const result = compareRecitation(activeText(), remaining);
    const confirmed = compareRecitation(activeText(), finalRemaining);
    // Browser interim hypotheses often revise words. Keep uncertain words
    // hidden until corrected/final rather than flashing false red mistakes.
    state.statuses = result.statuses.map((status, index) =>
      confirmed.statuses[index] === "mistake"
        ? "mistake"
        : status === "mistake"
          ? "pending"
          : status,
    );
    state.transcript = remaining;
    state.extraWords = confirmed.extraWords;
    state.readerResults[`${state.surah}:${state.verse}`] = state.statuses;
    state.alertActive = Boolean(
      confirmed.extraWords || confirmed.statuses.includes("mistake"),
    );
    if (finalRemaining && finalRemaining !== lastFinal) {
      if (state.alertActive) tone();
      saveAttempt(finalRemaining, confirmed);
      lastFinal = finalRemaining;
    }
    state.feedback = state.alertActive
      ? "Possible mismatch marked red. Keep reciting; the reader will follow the next words."
      : remaining
        ? "Listening… keep reciting. Uncertain words wait for recognition to settle."
        : progression.completed.length
          ? "Continue reciting. Earlier possible mistakes remain red for review."
          : "Listening… begin the selected ayah.";
    render();
    if (progression.completed.length) scrollToSelected();
  };

  session.onerror = (e) => {
    if (recognition !== session) return;
    state.feedback =
      e.error === "not-allowed"
        ? "Microphone access was denied. Allow it in browser settings to recite."
        : `Speech recognition stopped (${e.error}). Try again or practice using audio and hints.`;
    state.listening = false;
    state.controlsOpen = true;
    endActivity();
    render();
  };
  session.onend = () => {
    if (recognition !== session) return;
    state.listening = false;
    recognition = null;
    endActivity();
    render();
  };
  try {
    session.start();
    state.recitationPage = true;
    state.focusMode = true;
    state.controlsOpen = false;
    state.settingsOpen = false;
    activeSince = Date.now();
    state.listening = true;
    state.feedback = "Listening in Arabic… begin the current ayah.";
  } catch {
    recognition = null;
    endActivity();
    state.feedback = "Could not start the microphone. Please try again.";
  }
  render();
}
function bind() {
  document.querySelectorAll("[data-tab]").forEach(
    (b) =>
      (b.onclick = () => {
        stop();
        requestId++;
        state.loading = false;
        state.tab = b.dataset.tab;
        if (state.tab === "Practice" || state.tab === "Reader") {
          state.mode =
            state.tab === "Practice" ? "Recall & recite" : "Read & reflect";
          resetAttempt();
        }
        state.pendingDelete = false;
        state.controlsOpen = false;
        render();
      }),
  );
  document.querySelectorAll("[data-mode]").forEach(
    (b) =>
      (b.onclick = () => {
        stop();
        state.mode = b.dataset.mode;
        state.hidden = false;
        state.readerResults = {};
        resetAttempt();
        render();
      }),
  );
  document
    .querySelectorAll("[data-surah]")
    .forEach((b) => (b.onclick = () => loadSurah(+b.dataset.surah)));
  const on = (id, fn) => {
    const el = document.getElementById(id);
    if (el) el.onclick = fn;
  };
  on("prev", () => changeVerse(-1));
  on("next", () => changeVerse(1));
  on("hide", () => {
    if (state.mode === "Recall & recite") {
      state.revealAll = !state.revealAll;
      state.hidden = false;
    } else state.hidden = !state.hidden;
    render();
  });
  on("reveal", () => {
    state.hidden = false;
    render();
  });
  on("sound", () => {
    state.sound = !state.sound;
    render();
  });
  on("listen", startReciting);
  on("retry", () => {
    stop();
    delete state.readerResults[`${state.surah}:${state.verse}`];
    resetAttempt();
    state.hidden = false;
    state.feedback =
      "A fresh start. Recite again, or reveal a word for a hint.";
    render();
  });
  on("hint", () => {
    state.hidden = false;
    const words = activeText().split(/\s+/);
    let i = state.hints;
    while (
      i < words.length &&
      state.statuses[i] &&
      state.statuses[i] !== "pending"
    )
      i++;
    state.hints = Math.min(words.length, i + 1);
    render();
  });
  const repeat = document.getElementById("repeat-select");
  if (repeat)
    repeat.onchange = (e) => {
      state.repeats = +e.target.value;
    };
  on("mark", () => {
    const key = `${state.surah}:${state.verse}`;
    if (state.saved[key]) delete state.saved[key];
    else state.saved[key] = true;
    persist();
    render();
  });
  const select = document.querySelector("#surah-select");
  if (select)
    select.onchange = (e) => loadSurah(+e.target.value, 0, "Practice");
  on("play", playAyah);
  bindScreens();
}
function writeLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    state.feedback =
      "Device storage is full or unavailable. Changes may not survive closing this page.";
  }
}
function logActivity(seconds) {
  if (seconds < 1) return;
  const key = dateKey();
  const day = state.activity[key] || { seconds: 0, sessions: 0 };
  state.activity[key] = {
    seconds: day.seconds + seconds,
    sessions: day.sessions + 1,
  };
  writeLocal("hifdh-activity", state.activity);
}
function endActivity() {
  if (activeSince === null) return;
  const seconds = Math.max(0, Math.round((Date.now() - activeSince) / 1000));
  activeSince = null;
  logActivity(seconds);
}
function saveAttempt(transcript, result) {
  if (!state.attemptId)
    state.attemptId =
      globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
  state.mistakes = state.mistakes.filter((m) => m.id !== state.attemptId);
  if (result.details.length)
    state.mistakes.unshift({
      id: state.attemptId,
      at: new Date().toISOString(),
      surah: state.surah,
      verse: state.verse,
      surahName: current().englishName,
      expected: activeText(),
      recited: ayahTranscript(
        state.surah,
        state.verse,
        transcript,
        normalize,
      ).trim(),
      details: result.details,
    });
  state.mistakes = state.mistakes.slice(0, 200);
  writeLocal("hifdh-mistakes", state.mistakes);
}
function recitationFeedback() {
  return `<div class="recitation-status ${state.statuses.includes("mistake") || state.extraWords ? "has-error" : ""} ${state.alertActive ? "mistake-alert-active" : ""}" role="status"><span>${state.alertActive ? "⚠" : state.listening ? '<i class="live-dot"></i>' : "✧"}</span>${state.alertActive ? '<strong class="alert-label">CHECK RECITATION</strong>' : ""}${escape(state.feedback)}</div>${state.transcript ? `<details class="transcript"><summary>What your browser heard</summary><p lang="ar" dir="rtl">${escape(state.transcript)}</p><small>Possible mismatches are saved on this device for review.</small></details>` : ""}`;
}
function readerWords(verse, index) {
  if (index === state.verse) return renderWords();
  const statuses = state.readerResults[`${state.surah}:${index}`] || [];
  return practiceText(state.surah, index, verse)
    .split(/\s+/)
    .map((word, i) => {
      const masked =
        state.mode === "Recall & recite" &&
        (!statuses[i] || statuses[i] === "pending");
      return `<span class="word ${statuses[i] || ""} ${masked ? "masked-word" : ""}" ${masked ? 'aria-label="Hidden word"' : ""}>${masked ? "•••" : escape(word)}</span>`;
    })
    .join(" ");
}
async function searchVerses(query) {
  stop();
  state.searchQuery = query;
  state.tab = "Search";
  if (normalize(query).length < 2) {
    state.searchResults = [];
    state.searchMessage = "Enter at least two Arabic letters.";
    render();
    return;
  }
  const matches = searchQuran(query, normalize);
  state.searchResults = matches.slice(0, 100);
  state.searchMessage = matches.length
    ? `${matches.length} matching verses${matches.length > 100 ? " · showing first 100" : ""}.`
    : "No matching phrases found. Try fewer words.";
  render();
}
function bindScreens() {
  const on = (id, fn) => {
    const element = document.getElementById(id);
    if (element) element.onclick = fn;
  };
  document
    .querySelectorAll("[data-verse]")
    .forEach(
      (b) => (b.onclick = () => changeVerse(+b.dataset.verse - state.verse)),
    );
  on("focus", () => {
    state.focusMode = !state.focusMode;
    if (!state.focusMode) state.recitationPage = false;
    render();
  });
  const testSound = () => {
    state.sound = true;
    prepareAlertSound();
    tone();
    state.feedback =
      "Mistake alert preview. This is a test, not a detected mistake.";
    state.alertActive = true;
    render();
  };
  on("test-alert", testSound);
  on("test-sound", testSound);
  on("menu-sound", () => {
    state.sound = !state.sound;
    if (state.sound) prepareAlertSound();
    render();
  });
  on("clear-marks", () => {
    stop();
    state.readerResults = {};
    resetAttempt();
    state.feedback = "Session highlights cleared. Saved feedback is unchanged.";
    render();
  });
  on("theme", () => {
    state.theme = state.theme === "white" ? "black" : "white";
    writeLocal("hifdh-theme", state.theme);
    render();
  });
  document.querySelectorAll("[data-theme]").forEach(
    (b) =>
      (b.onclick = () => {
        state.theme = b.dataset.theme;
        writeLocal("hifdh-theme", state.theme);
        render();
      }),
  );
  on("controls-toggle", () => {
    state.controlsOpen = !state.controlsOpen;
    render();
  });
  on("close-controls", () => {
    state.controlsOpen = false;
    render();
    document.getElementById("controls-toggle")?.focus();
  });
  on("reader-settings", () => {
    state.settingsOpen = !state.settingsOpen;
    render();
  });
  const font = document.getElementById("font-size");
  if (font)
    font.oninput = (e) => {
      state.fontSize = +e.target.value;
      document
        .querySelector(".mushaf")
        .style.setProperty("--quran-size", state.fontSize + "px");
      writeLocal("hifdh-font-size", state.fontSize);
    };
  on("jump", () => {
    const n = Number(document.getElementById("jump-ayah").value);
    if (Number.isInteger(n) && n >= 1 && n <= state.verses.length)
      changeVerse(n - 1 - state.verse);
  });
  on("bookmark", () => {
    state.bookmark = { surah: state.surah, verse: state.verse };
    writeLocal("hifdh-bookmark", state.bookmark);
    state.feedback = `Bookmarked ayah ${state.surah}:${state.verse + 1}.`;
    render();
  });
  on("resume-bookmark", () => {
    if (state.bookmark) loadSurah(state.bookmark.surah, state.bookmark.verse);
    else {
      state.tab = "Library";
      render();
    }
  });
  on("finish", () => {
    if (!state.transcript) return;
    stop();
    const result = compareRecitation(
      activeText(),
      ayahTranscript(state.surah, state.verse, state.transcript, normalize),
      { finished: true },
    );
    state.statuses = result.statuses;
    state.extraWords = result.extraWords;
    state.readerResults[`${state.surah}:${state.verse}`] = result.statuses;
    state.alertActive = result.details.length > 0;
    if (state.alertActive) {
      prepareAlertSound();
      tone();
    }
    saveAttempt(state.transcript, result);
    state.feedback = result.details.length
      ? "Attempt finished. Possible mismatches are saved in Review. Unrecited ending words count as missed when you finish."
      : "All words matched. This does not assess pronunciation or tajweed.";
    render();
  });
  document.querySelectorAll("[data-filter]").forEach(
    (b) =>
      (b.onclick = () => {
        state.mistakeFilter = b.dataset.filter;
        render();
      }),
  );
  document.querySelectorAll("[data-delete]").forEach(
    (b) =>
      (b.onclick = () => {
        state.mistakes = state.mistakes.filter(
          (m) => m.id !== b.dataset.delete,
        );
        writeLocal("hifdh-mistakes", state.mistakes);
        render();
      }),
  );
  on("clear-history", () => {
    if (!state.pendingDelete) {
      state.pendingDelete = true;
      document.getElementById("clear-history").textContent =
        "Tap again to permanently delete all feedback";
      return;
    }
    state.mistakes = [];
    state.pendingDelete = false;
    writeLocal("hifdh-mistakes", []);
    render();
  });
  document.querySelectorAll("[data-review]").forEach(
    (b) =>
      (b.onclick = () => {
        const m = state.mistakes.find((m) => m.id === b.dataset.review);
        if (m) {
          state.mode = "Recall & recite";
          loadSurah(m.surah, m.verse);
        }
      }),
  );
  document.querySelectorAll("[data-similar]").forEach(
    (b) =>
      (b.onclick = () => {
        const m = state.mistakes.find((m) => m.id === b.dataset.similar);
        if (!m) return;
        const position = m.details.find((d) => d.expected)?.position ?? 0;
        const phrase = m.expected
          .split(/\s+/)
          .slice(Math.max(0, position - 1), position + 2)
          .join(" ");
        searchVerses(phrase);
      }),
  );
  const search = document.getElementById("verse-search");
  if (search)
    search.onsubmit = (e) => {
      e.preventDefault();
      searchVerses(document.getElementById("search-query").value.trim());
    };
  document.querySelectorAll("[data-result]").forEach(
    (b) =>
      (b.onclick = () => {
        const r = state.searchResults[+b.dataset.result];
        state.mode = "Read & reflect";
        loadSurah(r.surah.number, r.numberInSurah - 1);
      }),
  );
  document.querySelectorAll("[data-memorized]").forEach(
    (b) =>
      (b.onclick = () => {
        const [s, v] = b.dataset.memorized.split(":").map(Number);
        state.mode = "Recall & recite";
        loadSurah(s, v);
      }),
  );
  const log = document.getElementById("log-session");
  if (log)
    log.onsubmit = (e) => {
      e.preventDefault();
      const minutes = +document.getElementById("session-minutes").value;
      if (Number.isInteger(minutes) && minutes >= 1 && minutes <= 240) {
        logActivity(minutes * 60);
        render();
      }
    };
}
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stop();
    render();
  }
});
window.addEventListener("pagehide", stop);

render();

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.controlsOpen) {
    state.controlsOpen = false;
    render();
    document.getElementById("controls-toggle")?.focus();
  }
});
