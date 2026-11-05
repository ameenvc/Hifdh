import "@fontsource/amiri/arabic-400.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-700.css";
import "./style.css";
import {
  compareRecitation,
  normalize,
  followVerses,
  spokenTokens,
} from "./recitation.js";
import { dateKey } from "./activity.js";
import {
  readerScreen,
  mistakesScreen,
  searchScreen,
  progressScreen,
  challengeScreen,
} from "./screens.js";
import {
  chapter,
  surahs,
  practiceText,
  searchQuran,
  ayahTranscript,
  pageForVerse,
  quranPage,
  PAGE_COUNT,
} from "./quran.js";
import { locatePassage } from "./locator.js";
import { makeChallenge } from "./challenge.js";
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
  fontSize: readLocal("hifdh-font-size", 36),
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
  feedbackMode:
    readLocal("hifdh-feedback-mode", "safe") === "experimental"
      ? "experimental"
      : "safe",
  uncertaintyActive: false,
  alertActive: false,
  finding: false,
  locationState: "idle",
  locationMessage: "",
  locationCandidates: [],
  recitationOffset: 0,
  challenge: null,
  quizSurah: 1,
  quizAyah: 1,
  quizStyle: "next",
  quizMessage: "",
};
let recognition,
  audio,
  requestId = 0,
  searchRequest = 0,
  activeSince = null,
  alertContext,
  alertAudio,
  chooseLocated;
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
  const oldPanel = document.querySelector(".mushaf");
  const oldPage = oldPanel?.dataset.page;
  const scrollTop = oldPanel?.scrollTop || 0;
  document.querySelector("#app").innerHTML =
    `<aside class="sidebar"><a class="brand" href="#">◈ <span>hifdh<span class="brand-dot">.</span></span></a><div class="workspace-label">YOUR PERSONAL SANCTUARY</div><nav>${[
      ["Reader", "book", "Quran reader"],
      ["Practice", "mic", "Memorize"],
      ["Challenge", "leaf", "Challenge"],
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
<main class="${reading ? "reader-view" : ""}"><header><div class="breadcrumb">My workspace <span>/</span> ${state.tab === "Practice" ? "Memorization" : escape(state.tab)}</div><div class="header-right"><span class="today">☀ &nbsp; A good day to begin</span><div class="avatar mini">Y</div></div></header><section class="content ${reading ? "reader-content" : ""}"><h1 class="sr-only">${reading ? escape(current().englishName) + " Quran reader" : escape(state.tab)}</h1>${reading ? '<div class="reader-intro"><span class="kicker">YOUR QURAN, CLOSE TO HEART</span><h1>Read. Remember. Return.</h1><button class="text-button" id="resume-bookmark">' + (state.bookmark ? "Resume bookmark →" : "Choose a surah →") + "</button></div>" : ""}<div class="eyebrow">السَّلَامُ عَلَيْكُمْ <span>PEACE BE UPON YOU</span></div><div class="page-title"><div><h2 class="workspace-title">A little closer, every ayah.</h2><p>Make room for the Quran. Let each verse settle in your heart.</p></div><span class="date-pill">✧ &nbsp; Your daily connection</span></div>
${reading ? readerScreen(state, surahs, readerWords, recitationFeedback) : state.tab === "Challenge" ? challengeScreen(state, surahs) : state.tab === "Library" ? library() : state.tab === "Mistakes" ? mistakesScreen(state) : state.tab === "Search" ? searchScreen(state) : progressScreen(state, surahs)}
<footer><span>◈ &nbsp; Quran text: <a href="https://tanzil.net" target="_blank" rel="noopener">Tanzil Project</a> · Uthmani</span><span>Consistency over perfection.</span></footer></section></main>`;
  bind();
  const mushaf = document.querySelector(".mushaf");
  if (mushaf)
    mushaf.scrollTop = oldPage === mushaf.dataset.page ? scrollTop : 0;
  fitQuranPage();
}
function library() {
  return `<div class="section-heading"><h2>Find your next surah</h2><span>114 chapters · one journey</span></div><div class="library-grid">${surahs.map((s) => `<button class="library-card" data-surah="${s.number}"><span class="chapter-number">${s.number}</span><h2>${escape(s.englishName)}</h2><p lang="ar">${escape(s.name)}</p><small>${s.numberOfAyahs} AYAHS &nbsp; →</small></button>`).join("")}</div><p class="library-note">All 114 surahs are bundled. Quran text: Tanzil Project · Uthmani, Hafs numbering.</p>`;
}
function stop() {
  const previous = recognition;
  recognition = null;
  state.finding = false;
  chooseLocated = null;
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
  state.recitationOffset =
    state.challenge?.style === "finish" &&
    state.challenge.surah === state.surah &&
    state.challenge.targetVerse === state.verse
      ? state.challenge.cueWords
      : 0;
  state.hints = state.recitationOffset;
  state.transcript = "";
  state.extraWords = 0;
  state.revealAll = false;
  state.attemptId = null;
  state.alertActive = false;
  state.uncertaintyActive = false;
}
function withWordOffset(result, offset) {
  return {
    ...result,
    statuses: [...Array(offset).fill("pending"), ...result.statuses],
    details: result.details.map((d) => ({
      ...d,
      position: d.position + offset,
    })),
  };
}
function compareCurrent(spoken, options) {
  const offset = state.recitationOffset;
  return withWordOffset(
    compareRecitation(
      activeText().split(/\s+/).slice(offset).join(" "),
      spoken,
      options,
    ),
    offset,
  );
}
function presentationStatuses(statuses) {
  return statuses.map((status) =>
    status === "mistake" && state.feedbackMode !== "experimental"
      ? "uncertain"
      : status,
  );
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
      return `<span class="word ${status} ${masked ? "masked-word" : ""}" ${masked ? 'role="img" aria-label="Hidden word"' : ""}>${masked ? "•••" : escape(word)}</span>`;
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
  state.challenge = null;
  state.locationState = "idle";
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
  state.challenge = null;
  state.locationState = "idle";
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
function startReciting(findAnywhere = false) {
  if (state.loading) return;
  prepareAlertSound();
  if (state.listening && !findAnywhere) {
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
  if (findAnywhere) state.challenge = null;
  resetAttempt();
  state.hidden = false;
  const session = new Speech();
  recognition = session;
  session.lang = "ar-SA";
  session.continuous = true;
  session.interimResults = true;
  session.maxAlternatives = 1;
  let priorTranscript = "", sessionFinal = "", restarts = 0, fatalError = false;
  let lastFinal = "",
    consumedWords = 0;
  const transcriptSurah = state.surah,
    transcriptStartVerse = state.verse;
  let anchorVerse = state.verse,
    anchorOffset = state.recitationOffset;
  let passage = state.verses.map((verse, index) =>
    practiceText(state.surah, index, verse),
  );
  if (anchorOffset)
    passage[anchorVerse] = passage[anchorVerse]
      .split(/\s+/)
      .slice(anchorOffset)
      .join(" ");
  const words = (text) =>
    spokenTokens(
      ayahTranscript(transcriptSurah, transcriptStartVerse, text, normalize),
    );
  let lastEvent;
  const acceptLocation = (match) => {
    if (recognition !== session) return;
    const loaded = chapter(match.surah);
    state.surah = match.surah;
    state.verses = loaded.verses;
    state.ayahNumbers = loaded.ayahNumbers;
    state.verse = match.verse;
    resetAttempt();
    state.recitationOffset = match.wordIndex;
    state.hints = match.wordIndex;
    anchorVerse = match.verse;
    anchorOffset = match.wordIndex;
    passage = loaded.verses.map((verse, index) =>
      practiceText(match.surah, index, verse),
    );
    if (anchorOffset)
      passage[anchorVerse] = passage[anchorVerse]
        .split(/\s+/)
        .slice(anchorOffset)
        .join(" ");
    consumedWords = match.ignoredWords;
    lastFinal = "";
    state.finding = false;
    state.locationCandidates = [];
    state.locationState = "matched";
    state.locationMessage = `Recognized text located ${current().englishName} ${match.surah}:${match.verse + 1} · page ${match.page}.`;
    if (lastEvent) session.onresult(lastEvent);
    else render();
  };
  chooseLocated = acceptLocation;
  session.onresult = (e) => {
    if (recognition !== session) return;
    lastEvent = e;
    let transcript = "",
      finalTranscript = "";
    for (let i = 0; i < e.results.length; i++) {
      transcript += e.results[i][0].transcript + " ";
      if (e.results[i].isFinal)
        finalTranscript += e.results[i][0].transcript + " ";
    }
    sessionFinal = finalTranscript;
    transcript = priorTranscript + transcript;
    finalTranscript = priorTranscript + finalTranscript;
    if (sessionFinal.trim()) restarts = 0;
    const allWords = words(transcript),
      finalWords = words(finalTranscript);
    if (state.finding) {
      const located = locatePassage(finalWords.join(" "));
      state.locationMessage = located.message;
      state.locationState = located.status;
      state.locationCandidates = located.candidates.slice(0, 6);
      state.transcript = transcript.trim();
      state.feedback = located.message;
      if (located.status === "matched") {
        acceptLocation(located.match);
        return;
      }
      render();
      return;
    }
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
        const rebased = withWordOffset(
          completed,
          completed.verse === anchorVerse ? anchorOffset : 0,
        );
        state.readerResults[`${state.surah}:${completed.verse}`] =
          presentationStatuses(rebased.statuses);
        if (completed.details.length || state.attemptId)
          saveAttempt(completed.text, rebased);
        hadMistake ||= completed.details.length > 0;
      }
      if (hadMistake && state.feedbackMode === "experimental") tone();
      consumedWords += progression.consumed;
      state.verse = Math.min(progression.verse, state.verses.length - 1);
      resetAttempt();
      lastFinal = "";
      if (progression.ended) {
        const last = progression.completed.at(-1);
        state.transcript = last.text;
        state.extraWords = last.extraWords;
        state.uncertaintyActive = last.details.length > 0;
        state.alertActive =
          last.details.length > 0 && state.feedbackMode === "experimental";
        state.statuses = state.readerResults[`${state.surah}:${state.verse}`];
        stop();
        state.feedback = Object.values(state.readerResults).some(
          (statuses) =>
            statuses.includes("mistake") || statuses.includes("uncertain"),
        )
          ? "Session complete. Unconfirmed recognition differences are available in Review; this is not a recitation assessment."
          : "All remaining ayahs matched. Session complete; pronunciation and tajweed are not assessed.";
        render();
        scrollToSelected();
        return;
      }
    }
    const remaining = allWords.slice(consumedWords).join(" ");
    const finalRemaining = finalWords.slice(consumedWords).join(" ");
    const result = compareCurrent(remaining);
    const confirmed = compareCurrent(finalRemaining);
    // Browser interim hypotheses often revise words. Keep uncertain words
    // hidden until corrected/final rather than flashing false red mistakes.
    state.statuses = presentationStatuses(
      result.statuses.map((status, index) =>
        confirmed.statuses[index] === "mistake"
          ? "mistake"
          : status === "mistake"
            ? "pending"
            : status,
      ),
    );
    state.transcript = remaining;
    state.extraWords = confirmed.extraWords;
    state.readerResults[`${state.surah}:${state.verse}`] = state.statuses;
    state.uncertaintyActive = Boolean(
      confirmed.extraWords || confirmed.statuses.includes("mistake"),
    );
    state.alertActive =
      state.feedbackMode === "experimental" && state.uncertaintyActive;
    if (finalRemaining && finalRemaining !== lastFinal) {
      if (state.alertActive) tone();
      saveAttempt(finalRemaining, confirmed);
      lastFinal = finalRemaining;
    }
    state.feedback =
      state.uncertaintyActive && state.feedbackMode !== "experimental"
        ? "Some words were not recognized clearly. Keep reciting; no recitation error has been confirmed."
        : state.alertActive
          ? "Possible mismatch marked red. Keep reciting; the reader will follow the next words."
          : remaining
            ? "Listening… keep reciting. Uncertain words wait for recognition to settle."
            : progression.completed.length
              ? "Continue reciting. Unconfirmed recognition differences can be checked in Review."
              : "Listening… begin the selected ayah.";
    render();
    if (progression.completed.length) scrollToSelected();
  };

  session.onerror = (e) => {
    if (recognition !== session) return;
    if (e.error === "no-speech") {
      state.feedback = "No speech heard yet. Listening again… move closer to the microphone.";
      render();
      return;
    }
    fatalError = true;
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
    // Mobile browsers end recognition after pauses. Preserve finalized words
    // and the passage cursor when restarting instead of resetting the attempt.
    if (!fatalError && state.listening && restarts < 3) {
      priorTranscript += sessionFinal;
      sessionFinal = "";
      restarts++;
      state.feedback = "Reconnecting microphone… keep your place.";
      render();
      setTimeout(() => {
        if (recognition !== session || !state.listening) return;
        try {
          session.start();
          state.feedback = "Listening in Arabic… continue reciting.";
        } catch {
          fatalError = true;
          state.feedback = "Microphone could not reconnect. Tap Check my recitation to retry.";
          session.onend();
        }
        render();
      }, 350);
      return;
    }
    state.listening = false;
    if (!fatalError) state.feedback = "Microphone paused after repeated silence. Tap Check my recitation to resume.";
    state.controlsOpen = true;
    if (state.finding) {
      state.finding = false;
      state.locationMessage =
        "Microphone stopped. Choose a listed passage or restart Start anywhere.";
    }
    chooseLocated = null;
    recognition = null;
    endActivity();
    render();
  };
  try {
    session.start();
    state.finding = findAnywhere;
    state.locationState = findAnywhere ? "waiting" : "idle";
    state.locationCandidates = [];
    state.locationMessage = findAnywhere
      ? "Recite a few words from anywhere in the Quran."
      : "";
    state.recitationPage = true;
    state.focusMode = true;
    state.controlsOpen = false;
    state.settingsOpen = false;
    activeSince = Date.now();
    state.listening = true;
    state.feedback = findAnywhere
      ? "Listening in Arabic… recite a few words to find your page."
      : "Listening in Arabic… begin the current ayah.";
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
        if (state.tab !== "Practice") state.challenge = null;
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
        if (state.mode === "Read & reflect") state.challenge = null;
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
  on("check-recitation", () => startReciting(false));
  on("listen", () => startReciting(false));
  on("locate-start", () => startReciting(true));
  on("challenge-listen", () => startReciting(false));
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
      reviewStatus: "unverified",
      source: "browser-speech",
    });
  state.mistakes = state.mistakes.slice(0, 200);
  writeLocal("hifdh-mistakes", state.mistakes);
}
function recitationFeedback() {
  return `<div class="recitation-status ${state.alertActive ? "has-error" : state.uncertaintyActive ? "has-uncertainty" : ""} ${state.alertActive ? "mistake-alert-active" : ""}" role="status"><span>${state.alertActive ? "⚠" : state.listening ? '<i class="live-dot"></i>' : "✧"}</span>${state.alertActive ? '<strong class="alert-label">CHECK RECITATION</strong>' : ""}${escape(state.feedback)}</div>${state.transcript ? `<details class="transcript"><summary>What your browser heard</summary><p lang="ar" dir="rtl">${escape(state.transcript)}</p><small>Possible mismatches are saved on this device for review.</small></details>` : ""}`;
}
function readerWords(verse, index, number = state.surah) {
  if (number === state.surah && index === state.verse) return renderWords();
  const statuses = state.readerResults[`${number}:${index}`] || [];
  return practiceText(number, index, verse)
    .split(/\s+/)
    .map((word, i) => {
      const masked =
        state.mode === "Recall & recite" &&
        (!statuses[i] || statuses[i] === "pending");
      return `<span class="word ${statuses[i] || ""} ${masked ? "masked-word" : ""}" ${masked ? 'role="img" aria-label="Hidden word"' : ""}>${masked ? "•••" : escape(word)}</span>`;
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
  document.querySelectorAll("[data-verse]").forEach(
    (b) =>
      (b.onclick = () => {
        const number = +b.dataset.chapter,
          index = +b.dataset.verse;
        if (number === state.surah) changeVerse(index - state.verse);
        else loadSurah(number, index, state.tab);
      }),
  );
  on("page-prev", () => turnPage(-1));
  on("page-next", () => turnPage(1));
  on("page-go", () => {
    const number = +document.getElementById("page-number").value;
    if (Number.isInteger(number) && number >= 1 && number <= PAGE_COUNT)
      openPage(number);
  });
  on("location-dismiss", () => {
    if (state.finding) stop();
    state.locationState = "idle";
    render();
  });
  document.querySelectorAll("[data-location]").forEach(
    (b) =>
      (b.onclick = () => {
        const match = state.locationCandidates[+b.dataset.location];
        if (!match) return;
        if (chooseLocated) chooseLocated(match);
        else loadSurah(match.surah, match.verse);
      }),
  );
  on("open-challenge", () => {
    stop();
    state.quizSurah = state.surah;
    state.quizAyah = Math.min(state.verse + 1, state.verses.length - 1);
    state.quizMessage = "";
    state.tab = "Challenge";
    state.controlsOpen = false;
    render();
  });
  const quizSurah = document.getElementById("quiz-surah");
  if (quizSurah)
    quizSurah.onchange = (e) => {
      state.quizSurah = +e.target.value;
      state.quizAyah = 1;
      state.quizMessage = "";
      render();
    };
  const quizStyle = document.getElementById("quiz-style");
  if (quizStyle)
    quizStyle.onchange = (e) => {
      state.quizStyle = e.target.value;
      state.quizMessage = "";
      render();
    };
  const quizAyah = document.getElementById("quiz-ayah");
  if (quizAyah)
    quizAyah.oninput = (e) => {
      state.quizAyah = +e.target.value;
    };
  on("challenge-begin", () => beginChallenge(false));
  on("challenge-random", () => beginChallenge(true));
  on("challenge-end", () => {
    stop();
    state.challenge = null;
    state.mode = "Read & reflect";
    resetAttempt();
    render();
  });
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
  on("feedback-mode", () => {
    stop();
    state.feedbackMode =
      state.feedbackMode === "safe" ? "experimental" : "safe";
    writeLocal("hifdh-feedback-mode", state.feedbackMode);
    state.readerResults = {};
    resetAttempt();
    state.feedback =
      state.feedbackMode === "safe"
        ? "Safe feedback: recognition differences are unconfirmed, without red error alerts."
        : "Experimental text alerts enabled. Browser errors can mark correct recitation red.";
    render();
  });
  document.querySelectorAll("[data-confirm]").forEach(
    (b) =>
      (b.onclick = () => {
        const m = state.mistakes.find((m) => m.id === b.dataset.confirm);
        if (!m) return;
        m.reviewStatus = "confirmed";
        writeLocal("hifdh-mistakes", state.mistakes);
        const key = `${m.surah}:${m.verse}`;
        const statuses =
          state.readerResults[key] ||
          m.expected.split(/\s+/).map(() => "pending");
        for (const d of m.details)
          if (d.type !== "extra" && d.position < statuses.length)
            statuses[d.position] = "mistake";
        state.readerResults[key] = statuses;
        if (state.surah === m.surah && state.verse === m.verse)
          state.statuses = statuses;
        prepareAlertSound();
        tone();
        render();
      }),
  );
  document.querySelectorAll("[data-dismiss]").forEach(
    (b) =>
      (b.onclick = () => {
        const m = state.mistakes.find((m) => m.id === b.dataset.dismiss);
        if (!m) return;
        const key = `${m.surah}:${m.verse}`;
        state.readerResults[key] = (state.readerResults[key] || []).map((s) =>
          s === "uncertain" || s === "mistake" ? "correct" : s,
        );
        if (state.surah === m.surah && state.verse === m.verse) {
          state.statuses = state.readerResults[key];
          state.alertActive = false;
          state.uncertaintyActive = false;
        }
        state.mistakes = state.mistakes.filter((x) => x.id !== m.id);
        writeLocal("hifdh-mistakes", state.mistakes);
        render();
      }),
  );
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
  document.querySelectorAll("button[data-theme]").forEach(
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
  const surahPicker = document.getElementById("surah-picker");
  if (surahPicker)
    surahPicker.onchange = (event) => {
      const number = Number(event.target.value);
      loadSurah(number, 0, state.tab === "Practice" ? "Practice" : "Reader");
      document.getElementById("surah-picker")?.focus();
    };
  const font = document.getElementById("font-size");
  if (font)
    font.oninput = (e) => {
      state.fontSize = +e.target.value;
      document
        .querySelector(".mushaf")
        .style.setProperty("--quran-size", state.fontSize + "px");
      writeLocal("hifdh-font-size", state.fontSize);
      fitQuranPage();
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
    const result = compareCurrent(
      ayahTranscript(state.surah, state.verse, state.transcript, normalize),
      { finished: true },
    );
    state.statuses = presentationStatuses(result.statuses);
    state.extraWords = result.extraWords;
    state.readerResults[`${state.surah}:${state.verse}`] = state.statuses;
    state.uncertaintyActive = result.details.length > 0;
    state.alertActive =
      state.feedbackMode === "experimental" && state.uncertaintyActive;
    if (state.alertActive) {
      prepareAlertSound();
      tone();
    }
    saveAttempt(state.transcript, result);
    state.feedback = result.details.length
      ? "Attempt finished. Unconfirmed browser text differences are saved in Review, including any unrecited ending. No recitation mistake has been confirmed."
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

function openPage(number) {
  const page = quranPage(number);
  loadSurah(
    page.first.surah,
    page.first.index,
    state.tab === "Practice" ? "Practice" : "Reader",
  );
}
function turnPage(direction) {
  const number = pageForVerse(state.surah, state.verse) + direction;
  if (number >= 1 && number <= PAGE_COUNT) openPage(number);
}
function fitQuranPage() {
  const panel = document.querySelector(".paged-mushaf");
  if (!panel || panel.clientHeight < 1) return;
  if (panel.classList.contains("challenge-active")) {
    panel.style.setProperty("--quran-size", state.fontSize + "px");
    return;
  }
  const requested = state.fontSize;
  const fits = (size) => {
    panel.style.setProperty("--quran-size", size + "px");
    return panel.scrollHeight <= panel.clientHeight + 1;
  };
  let low = 11,
    high = requested,
    best = 11;
  while (high - low > 0.3) {
    const mid = (low + high) / 2;
    if (fits(mid)) {
      best = mid;
      low = mid;
    } else high = mid;
  }
  panel.style.setProperty(
    "--quran-size",
    (fits(requested) ? requested : best) + "px",
  );
  panel.classList.toggle(
    "page-overflow",
    panel.scrollHeight > panel.clientHeight + 1,
  );
  panel.scrollTop = 0;
}
window.addEventListener("resize", fitQuranPage);
if (document.fonts?.ready) document.fonts.ready.then(fitQuranPage);
document.addEventListener("keydown", (event) => {
  if (
    !document.querySelector(".paged-mushaf") ||
    state.controlsOpen ||
    event.target?.matches?.("input,select,textarea") ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey
  )
    return;
  if (event.key === "ArrowRight") {
    event.preventDefault();
    turnPage(1);
  } else if (event.key === "ArrowLeft") {
    event.preventDefault();
    turnPage(-1);
  }
});
let pageTouch = null;
document.addEventListener(
  "touchstart",
  (event) => {
    if (
      event.target?.closest?.(".paged-mushaf") &&
      !event.target.closest("button,input,select") &&
      event.touches.length === 1
    )
      pageTouch = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    else pageTouch = null;
  },
  { passive: true },
);
document.addEventListener(
  "touchend",
  (event) => {
    if (!pageTouch) return;
    const touch = event.changedTouches[0],
      dx = touch.clientX - pageTouch.x,
      dy = touch.clientY - pageTouch.y;
    pageTouch = null;
    if (Math.abs(dx) > 65 && Math.abs(dx) > Math.abs(dy) * 1.6)
      turnPage(dx < 0 ? 1 : -1);
  },
  { passive: true },
);

document.addEventListener(
  "touchcancel",
  () => {
    pageTouch = null;
  },
  { passive: true },
);

async function beginChallenge(random) {
  let verse = state.quizAyah - 1;
  if (random) {
    const eligible = [];
    for (let i = 0; i < chapter(state.quizSurah).verses.length; i++) {
      try {
        makeChallenge(state.quizSurah, i, state.quizStyle);
        eligible.push(i);
      } catch {}
    }
    if (!eligible.length) {
      state.quizMessage = "No suitable ayah in this surah for this exercise.";
      render();
      return;
    }
    verse = eligible[Math.floor(Math.random() * eligible.length)];
    state.quizAyah = verse + 1;
  }
  try {
    const exercise = makeChallenge(state.quizSurah, verse, state.quizStyle);
    await loadSurah(exercise.surah, exercise.targetVerse, "Practice");
    state.challenge = exercise;
    state.mode = "Recall & recite";
    state.readerResults = {};
    resetAttempt();
    state.feedback =
      exercise.style === "next"
        ? "Read the prompt ayah, then recite what follows."
        : "Read the visible opening, then recite the hidden remainder.";
    render();
  } catch (error) {
    state.quizMessage = error.message;
    render();
  }
}
