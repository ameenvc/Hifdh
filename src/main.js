import "@fontsource/amiri/arabic-400.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-700.css";
import "./style.css";
import { compareRecitation, normalize } from "./recitation.js";
import { dateKey } from "./activity.js";
import {
  readerScreen,
  mistakesScreen,
  searchScreen,
  progressScreen,
} from "./screens.js";
const fatiha = [
  "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
  "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
  "الرَّحْمَٰنِ الرَّحِيمِ",
  "مَالِكِ يَوْمِ الدِّينِ",
  "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
  "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
  "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
];
const surahs = [
  { number: 1, englishName: "Al-Faatiha", name: "الفاتحة", numberOfAyahs: 7 },
  { number: 112, englishName: "Al-Ikhlaas", name: "الإخلاص", numberOfAyahs: 4 },
  { number: 113, englishName: "Al-Falaq", name: "الفلق", numberOfAyahs: 5 },
  { number: 114, englishName: "An-Naas", name: "الناس", numberOfAyahs: 6 },
];
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
  verses: fatiha,
  ayahNumbers: [1, 2, 3, 4, 5, 6, 7],
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
};
let recognition,
  audio,
  requestId = 0,
  searchRequest = 0,
  activeSince = null,
  alertContext;
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
<main class="${state.tab === "Reader" ? "reader-view" : ""}"><header><div class="breadcrumb">My workspace <span>/</span> ${state.tab === "Practice" ? "Memorization" : escape(state.tab)}</div><div class="header-right"><span class="today">☀ &nbsp; A good day to begin</span><div class="avatar mini">Y</div></div></header><section class="content ${state.tab === "Reader" ? "reader-content" : ""}">${state.tab === "Reader" ? '<div class="reader-intro"><span class="kicker">YOUR QURAN, CLOSE TO HEART</span><h1>Read. Remember. Return.</h1><button class="text-button" id="resume-bookmark">' + (state.bookmark ? "Resume bookmark →" : "Choose a surah →") + "</button></div>" : ""}<div class="eyebrow">السَّلَامُ عَلَيْكُمْ <span>PEACE BE UPON YOU</span></div><div class="page-title"><div><h1>A little closer, every ayah.</h1><p>Make room for the Quran. Let each verse settle in your heart.</p></div><span class="date-pill">✧ &nbsp; Your daily connection</span></div>
${state.tab === "Reader" ? readerScreen(state, surahs, readerWords, recitationFeedback) : state.tab === "Practice" ? practice(s) : state.tab === "Library" ? library() : state.tab === "Mistakes" ? mistakesScreen(state) : state.tab === "Search" ? searchScreen(state) : progressScreen(state, surahs)}
<footer><span>◈ &nbsp; A mindful journey with the words of Allah.</span><span>Consistency over perfection.</span></footer></section></main>`;
  bind();
  const mushaf = document.querySelector(".mushaf");
  if (mushaf) mushaf.scrollTop = scrollTop;
}
function practice(s) {
  return `<div class="overview"><div class="overview-card"><span class="stat-icon">▤</span><div><small>AYAH BY AYAH</small><strong>${Object.keys(state.saved).length} <span>memorized</span></strong></div></div><div class="overview-card"><span class="stat-icon gold">✧</span><div><small>YOUR DAILY INTENTION</small><strong>5 <span>ayahs a day</span></strong></div><div class="overview-card quote"><span>“</span><p>The best of you are those who learn<br>the Quran and teach it.<small>SAHIH AL-BUKHARI 5027</small></p></div></div>
<div class="section-heading"><h2>Your memorization space</h2><span><i></i> A moment of focus</span></div><div class="practice-layout"><article class="quran-card"><div class="card-toolbar"><div class="segmented">${["Read & reflect", "Recall & recite"].map((m) => `<button data-mode="${m}" class="${m === state.mode ? "selected" : ""}">${m === "Read & reflect" ? "▤" : "♩"} &nbsp; ${m}</button>`).join("")}</div><button class="icon-button" id="sound" aria-label="${state.sound ? "Disable" : "Enable"} mistake sound" title="Mistake sound">${state.sound ? "♫" : "♩"} ${state.sound ? "On" : "Off"}</button></div><div class="surah-heading"><span class="surah-tag">SURAH ${state.surah} · ${state.verses.length} AYAHS</span><h2>${escape(s.englishName)}</h2><p lang="ar">${escape(s.name)}</p><span class="ornament">──── ✧ ────</span></div><div class="ayah-area ${state.hidden ? "concealed" : ""}" lang="ar" dir="rtl">${state.hidden ? '<button id="reveal" class="reveal">Tap to reveal the ayah</button>' : renderWords()} ${state.hidden ? "" : `<span class="ayah-number">${(state.verse + 1).toLocaleString("ar")}</span>`}</div><div class="verse-meta">AYAH ${state.verse + 1} OF ${state.verses.length}<span>•</span>${state.saved[`${state.surah}:${state.verse}`] ? "MEMORIZED" : "ONE VERSE, ONE STEP CLOSER"}</div><div class="recitation-status ${state.statuses.includes("mistake") ? "has-error" : ""}" role="status"><span>${state.listening ? '<i class="live-dot"></i>' : "✧"}</span>${escape(state.feedback)}</div>${state.transcript ? `<div class="transcript"><span>YOUR BROWSER HEARD</span><p lang="ar" dir="rtl">${escape(state.transcript)}</p><small>Recognition can be inaccurate. Compare before correcting your recitation.</small></div>` : ""}<div class="recall-tools">${state.mode === "Recall & recite" ? '<button id="hint">✧ Reveal next word</button>' : ""}<button id="retry">↺ Start ayah again</button><button id="finish" ${!state.transcript ? "disabled" : ""}>Finish & review</button></div><div class="primary-actions"><button class="listen-button" id="listen">${state.listening ? "■ Stop reciting" : "♩ Start reciting"}</button><button class="secondary-button" id="play">${state.playing ? "■ Stop audio" : "▷ Listen to ayah"}</button></div><div class="verse-controls"><button id="prev" ${state.verse === 0 ? "disabled" : ""}>← Previous</button><button id="hide">${state.mode === "Recall & recite" ? (state.revealAll ? "◉ Conceal" : "◉ Reveal all") : state.hidden ? "◉ Reveal" : "◉ Hide"} ${state.mode === "Recall & recite" ? "" : "ayah"}</button><button id="next" ${state.verse === state.verses.length - 1 ? "disabled" : ""}>Next ayah →</button></div></article>
<aside class="right-panel"><div class="session-card"><div class="panel-label">YOUR SESSION <span>↗</span></div><label for="surah-select">Practicing today</label><select id="surah-select">${surahs.map((s) => `<option value="${s.number}" ${state.surah === s.number ? "selected" : ""}>${s.number}. ${escape(s.englishName)}</option>`).join("")}</select><label class="repeat-label" for="repeat-select">Repeat audio</label><select id="repeat-select">${[1, 3, 5, 10].map((n) => `<option value="${n}" ${state.repeats === n ? "selected" : ""}>${n === 1 ? "Once" : n + " times"}</option>`).join("")}</select><div class="session-progress"><span>Surah progress</span><strong>${Math.round((state.verses.filter((_, i) => state.saved[`${state.surah}:${i}`]).length / state.verses.length) * 100)}%</strong></div><div class="progress-track"><div style="width:${(state.verses.filter((_, i) => state.saved[`${state.surah}:${i}`]).length / state.verses.length) * 100}%"></div></div><button class="mark-button" id="mark">${state.saved[`${state.surah}:${state.verse}`] ? "✓ Memorized · undo" : "✓ Mark ayah as memorized"}</button><p class="session-note">A small step today.<br>A lasting connection tomorrow.</p></div><div class="tip-card"><span class="tip-icon">✧</span><h3>Let your heart listen.</h3><p>Read the ayah slowly. Listen, repeat, then try reciting from memory.</p><div class="tip-divider"></div><strong>A GENTLE REMINDER</strong><p class="technical-note">Recitation uses experimental browser speech recognition. Hidden words appear as you recite in Recall mode. Red words and alerts flag possible text mismatches, not tajweed errors. Check with a qualified teacher.</p></div><div class="privacy-note">♧ <span>Progress stays on this device.<br>Speech may be processed by your browser’s provider.</span></div></aside></div>`;
}
function library() {
  return `<div class="section-heading"><h2>Find your next surah</h2><span>114 chapters · one journey</span></div><div class="library-grid">${surahs.map((s) => `<button class="library-card" data-surah="${s.number}"><span class="chapter-number">${s.number}</span><h2>${escape(s.englishName)}</h2><p lang="ar">${escape(s.name)}</p><small>${s.numberOfAyahs} AYAHS &nbsp; →</small></button>`).join("")}</div><p class="library-note">Al-Faatiha is available offline. Other chapters load from AlQuran Cloud when connected.</p>`;
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
}
function renderWords() {
  return state.verses[state.verse]
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
  state.loading = false;
  const ticket = ++requestId;
  if (n === 1) {
    state.surah = 1;
    state.verses = fatiha;
    state.ayahNumbers = [1, 2, 3, 4, 5, 6, 7];
    state.verse = Math.max(0, Math.min(state.verses.length - 1, verse));
    resetAttempt();
    state.hidden = false;
    state.feedback = "Take a breath. Begin when you’re ready.";
    state.tab = destination;
    render();
    scrollToSelected();
    return;
  }
  state.loading = true;
  state.tab = destination;
  state.feedback = "Loading your surah…";
  render();
  try {
    const r = await fetch(
      `https://api.alquran.cloud/v1/surah/${n}/quran-uthmani`,
    );
    if (!r.ok) throw Error();
    const d = await r.json();
    if (!Array.isArray(d.data?.ayahs) || !d.data.ayahs.length) throw Error();
    if (ticket !== requestId) return;
    state.loading = false;
    stop();
    state.surah = n;
    state.verses = d.data.ayahs.map((a) => a.text);
    state.ayahNumbers = d.data.ayahs.map((a) => a.number);
    state.verse = Math.max(0, Math.min(state.verses.length - 1, verse));
    resetAttempt();
    state.hidden = false;
    state.feedback = "Your surah is ready. Begin at your own pace.";
    state.tab = destination;
    render();
    scrollToSelected();
  } catch {
    if (ticket !== requestId) return;
    state.loading = false;
    state.feedback =
      "Could not load this surah. Check your connection; Al-Faatiha works offline.";
    render();
  }
}
function prepareAlertSound() {
  if (!state.sound) return;
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return;
    alertContext ||= new Context();
    alertContext.resume()?.catch(() => {});
  } catch {}
}
function tone() {
  if (!state.sound || !alertContext || alertContext.state === "suspended")
    return;
  try {
    const ctx = alertContext;
    const o = ctx.createOscillator(),
      g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.value = 440;
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    o.start();
    o.stop(ctx.currentTime + 0.22);
  } catch {}
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
  let lastFinal = "";
  session.onresult = (e) => {
    if (recognition !== session) return;
    let transcript = "",
      finalTranscript = "";
    for (let i = 0; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript + " ";
      if (e.results[i].isFinal)
        finalTranscript += e.results[i][0].transcript + " ";
    }
    state.transcript = transcript.trim();
    const result = compareRecitation(state.verses[state.verse], transcript);
    state.statuses = result.statuses;
    state.extraWords = result.extraWords;
    state.readerResults[`${state.surah}:${state.verse}`] = result.statuses;
    if (finalTranscript && finalTranscript !== lastFinal) {
      const confirmed = compareRecitation(
        state.verses[state.verse],
        finalTranscript,
      );
      if (confirmed.extraWords || confirmed.statuses.includes("mistake"))
        tone();
      saveAttempt(finalTranscript, confirmed);
      lastFinal = finalTranscript;
    }
    state.feedback = result.extraWords
      ? `Possible extra or repeated words: ${result.extraWords}. Check the recognized text below.`
      : result.statuses.includes("mistake")
        ? "Possible mismatch. Red words may be missed or different; check the recognized text."
        : result.complete
          ? "All ayah words matched. Pronunciation and tajweed still need a teacher’s review."
          : "Listening… words appear as your browser recognizes them.";
    render();
  };
  session.onerror = (e) => {
    if (recognition !== session) return;
    state.feedback =
      e.error === "not-allowed"
        ? "Microphone access was denied. Allow it in browser settings to recite."
        : `Speech recognition stopped (${e.error}). Try again or practice using audio and hints.`;
    state.listening = false;
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
        state.pendingDelete = false;
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
    const words = state.verses[state.verse].split(/\s+/);
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
      expected: state.verses[state.verse],
      recited: transcript.trim(),
      details: result.details,
    });
  state.mistakes = state.mistakes.slice(0, 200);
  writeLocal("hifdh-mistakes", state.mistakes);
}
function recitationFeedback() {
  return `<div class="recitation-status ${state.statuses.includes("mistake") || state.extraWords ? "has-error" : ""}" role="status"><span>${state.listening ? '<i class="live-dot"></i>' : "✧"}</span>${escape(state.feedback)}</div>${state.transcript ? `<details class="transcript"><summary>What your browser heard</summary><p lang="ar" dir="rtl">${escape(state.transcript)}</p><small>Possible mismatches are saved on this device for review.</small></details>` : ""}`;
}
function readerWords(verse, index) {
  if (index === state.verse) return renderWords();
  const statuses = state.readerResults[`${state.surah}:${index}`] || [];
  return verse
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
  const normalized = normalize(query),
    ticket = ++searchRequest;
  state.searchQuery = query;
  state.searchResults = [];
  state.tab = "Search";
  if (normalized.length < 2) {
    state.searchMessage = "Enter at least two Arabic letters.";
    render();
    return;
  }
  state.searchMessage = "Searching Quran text…";
  render();
  try {
    const r = await fetch(
      `https://api.alquran.cloud/v1/search/${encodeURIComponent(normalized)}/all/ar`,
    );
    if (r.status === 404) {
      if (ticket !== searchRequest) return;
      state.searchMessage = "No matching phrases found. Try fewer words.";
      render();
      return;
    }
    if (!r.ok) throw Error();
    const data = await r.json();
    if (ticket !== searchRequest) return;
    if (!Array.isArray(data.data?.matches)) throw Error();
    state.searchResults = data.data.matches
      .filter(
        (v) => v.surah?.number && v.numberInSurah && typeof v.text === "string",
      )
      .slice(0, 100);
    state.searchMessage = state.searchResults.length
      ? `${data.data.count || state.searchResults.length} matches found${data.data.matches.length > 100 ? " · showing first 100" : ""}.`
      : "No matching phrases found. Try fewer words.";
  } catch {
    if (ticket !== searchRequest) return;
    state.searchMessage =
      "Search is unavailable. Check your connection and try again.";
  }
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
      state.verses[state.verse],
      state.transcript,
      { finished: true },
    );
    state.statuses = result.statuses;
    state.extraWords = result.extraWords;
    state.readerResults[`${state.surah}:${state.verse}`] = result.statuses;
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
// Populate the complete library while keeping the starter chapters available offline.
fetch("https://api.alquran.cloud/v1/surah")
  .then((r) => (r.ok ? r.json() : Promise.reject()))
  .then((d) => {
    if (!Array.isArray(d.data)) return;
    surahs.splice(0, surahs.length, ...d.data);
    if (state.tab === "Library" || state.tab === "Reader") render();
  })
  .catch(() => {});
