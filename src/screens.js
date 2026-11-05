import { studyOptions } from "./word-study.js";
import {
  splitOpening,
  chapter,
  pageForVerse,
  quranPage,
  PAGE_COUNT,
} from "./quran.js";
import { icon } from "./icons.js";
import { activitySummary } from "./activity.js";
export const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const labels = {
  incorrect: "Recognized different text",
  missed: "Not recognized",
  extra: "Extra recognized text",
};
export function readerScreen(state, surahs, renderWordList, feedback) {
  const surah = surahs.find((s) => s.number === state.surah);
  const page = quranPage(pageForVerse(state.surah, state.verse));
  return `<section class="reader-shell ${state.alertActive ? "has-mistake" : ""}"><div class="reader-toolbar"><button class="reader-icon" data-tab="Library" aria-label="Open surah library">${icon("menu")}</button><div class="reader-chapter"><label class="surah-picker"><span class="sr-only">Select surah</span><select id="surah-picker" aria-label="Select surah">${surahs.map((s) => `<option value="${s.number}" ${s.number === state.surah ? "selected" : ""}>${s.number}. ${escape(s.englishName)} · ${escape(s.name)}</option>`).join("")}</select></label><span>Page ${page.number} of ${PAGE_COUNT} · Ayah ${state.surah}:${state.verse + 1}</span></div><button class="reader-icon ${state.bookmark?.surah === state.surah && state.bookmark?.verse === state.verse ? "bookmarked" : ""}" id="bookmark" aria-label="Bookmark selected ayah">${icon("bookmark")}</button><button class="reader-icon" id="theme" aria-label="Switch to ${state.theme === "white" ? "black" : "white"} view" title="Switch to ${state.theme === "white" ? "black" : "white"} view">${icon(state.theme === "white" ? "moon" : "sun")}</button><button class="reader-icon" id="reader-settings" aria-expanded="${state.settingsOpen}" aria-label="Reader settings">${icon("settings")}</button><button class="reader-icon" id="focus" aria-label="${state.focusMode ? "Exit full screen reader" : "Expand Quran reader"}" aria-pressed="${state.focusMode}">${icon(state.focusMode ? "collapse" : "expand")}</button></div>
 ${state.settingsOpen ? `<div class="reader-settings"><div class="theme-choices" role="group" aria-label="Reading appearance"><button data-theme="white" aria-pressed="${state.theme === "white"}">${icon("sun")} White</button><button data-theme="black" aria-pressed="${state.theme === "black"}">${icon("moon")} Black</button></div><label>Text size<input id="font-size" type="range" min="24" max="46" value="${state.fontSize}"/></label><label>Quran page<input id="page-number" type="number" min="1" max="${PAGE_COUNT}" value="${page.number}"/></label><button id="page-go" class="secondary-button">Open page</button><label>Jump to ayah<input id="jump-ayah" type="number" min="1" max="${state.verses.length}" value="${state.verse + 1}"/></label><button class="secondary-button" id="jump">Go →</button><label>Repeat audio<select id="repeat-select">${[1, 3, 5, 10].map((n) => `<option value="${n}" ${state.repeats === n ? "selected" : ""}>${n} time${n > 1 ? "s" : ""}</option>`).join("")}</select></label><button class="sound-button" id="test-alert">Test red alert</button><details class="quran-attribution"><summary>About Quran text &amp; meanings</summary><p>Quran text: <a href="https://tanzil.net" target="_blank" rel="noopener">Tanzil Project</a>, Uthmani script. <a href="${import.meta.env.BASE_URL}licenses/tanzil.txt" target="_blank" rel="noopener">Text license</a>. Grammar: Quranic Arabic Corpus. English word meanings: Hablullah, via QuranicMorphology, <a href="${import.meta.env.BASE_URL}licenses/english-word-meanings.txt" target="_blank" rel="noopener">CC BY-NC-ND 4.0 source terms</a>.</p></details></div>` : ""}
 <div class="reader-mode"><div class="segmented">${["Read & reflect", "Recall & recite"].map((m) => `<button data-mode="${m}" class="${m === state.mode ? "selected" : ""}">${m === "Read & reflect" ? "Read" : "Memorize"}</button>`).join("")}</div><button class="sound-button ${state.sound ? "enabled" : ""}" id="sound" aria-label="${state.sound ? "Disable" : "Enable"} mistake sound" aria-pressed="${state.sound}">${icon("sound")} ${state.sound ? "Sound on" : "Sound off"}</button><span>${state.mode === "Recall & recite" ? "Recite to reveal words" : "Tap an ayah to practice"}</span></div>
 <div class="study-toolbar" role="group" aria-label="Quran word study"><button id="study-grammar-quick" aria-pressed="${studyOptions.grammar}">${icon("book")}Grammar ${studyOptions.grammar ? "on" : "off"}</button><button id="study-repeated-quick" aria-pressed="${studyOptions.repeated}">${icon("search")}Repeated words ${studyOptions.repeated ? "on" : "off"}</button><span>${studyOptions.grammar ? "Hover or tap a word" : "Roots & word types"}</span></div>
 ${locationPanel(state, surahs)}
 <div class="mushaf paged-mushaf ${state.challenge ? "challenge-active" : ""}" role="region" aria-label="${state.challenge ? "Ayah continuation exercise" : "Quran page " + page.number}" data-page="${page.number}" style="--quran-size:${state.fontSize}px">${
   state.challenge
     ? challengePage(state, surahs, renderWordList)
     : page.segments
         .map((segment) => {
           const starts = segment.verses[0].index === 0;
           const opening = starts
             ? splitOpening(segment.surah, chapter(segment.surah).verses[0])
             : null;
           const marker = (index) =>
             `<button class="verse-marker" data-verse="${index}" data-chapter="${segment.surah}" aria-label="Select ayah ${segment.surah}:${index + 1}" ${state.surah === segment.surah && state.verse === index ? 'aria-current="true"' : ""}>${(index + 1).toLocaleString("ar")}</button>`;
           return `<section class="page-surah" data-page-surah="${segment.surah}">${starts ? `<div class="chapter-ornament"><span>❧</span><h2 lang="ar">${escape(segment.metadata.name)}</h2><span>❧</span></div>` : ""}${opening?.bismillah ? `<div class="basmala ${segment.surah === 1 ? "mushaf-verse" : ""} ${state.surah === 1 && state.verse === 0 ? "current-verse" : ""}" lang="ar" dir="rtl">${segment.surah === 1 ? renderWordList(segment.verses[0].text, 0, 1) : escape(opening.bismillah)}${segment.surah === 1 ? marker(0) : ""}</div>` : ""}<div class="mushaf-text" lang="ar" dir="rtl">${segment.verses.map((row) => (segment.surah === 1 && row.index === 0 ? "" : `<span class="mushaf-verse ${state.surah === segment.surah && row.index === state.verse ? "current-verse" : ""}">${renderWordList(row.text, row.index, segment.surah)} ${marker(row.index)}</span> `)).join("")}</div></section>`;
         })
         .join("")
 }</div><div class="page-navigation" aria-label="Quran page navigation" ${state.challenge ? "hidden" : ""}><button id="page-prev" ${page.number === 1 ? "disabled" : ""} aria-label="Previous Quran page">${icon("arrowLeft")}<span>Previous</span></button><span class="page-counter" role="status" aria-live="polite">Page <strong>${page.number}</strong> / ${PAGE_COUNT}</span><button id="page-next" ${page.number === PAGE_COUNT ? "disabled" : ""} aria-label="Next Quran page"><span>Next</span>${icon("arrowRight")}</button></div>
 <div class="reader-controls">${state.listening || state.transcript ? `<p class="recitation-live-status" role="status">${escape(state.feedback)}</p>` : ""}${state.alertActive && !state.controlsOpen ? '<div class="recitation-flag" role="status">Experimental text mismatch. This is not a confirmed recitation error.</div>' : ""}<div class="controls-dropdown"><button id="check-recitation" aria-label="${state.listening ? "Pause recitation" : "Check my recitation"}" title="${state.listening ? "Pause recitation" : "Check my recitation"}" class="check-recitation" aria-pressed="${state.listening}">${icon(state.listening ? "stop" : "mic")}<span>${state.listening ? "Pause recitation" : "Check my recitation"}</span></button><button class="controls-toggle" id="controls-toggle" aria-label="${state.controlsOpen ? "Close recitation controls" : state.listening ? "Open controls · microphone active" : state.playing ? "Open controls · audio playing" : "Open recitation controls"}" title="Recitation controls" aria-expanded="${state.controlsOpen}" aria-controls="recitation-controls">${icon(state.listening ? "mic" : "menu")}</button><section class="controls-sheet" id="recitation-controls" aria-label="Recitation controls" ${state.controlsOpen ? "" : "hidden"}><div class="controls-sheet-heading"><strong>Recitation controls</strong><button id="close-controls" aria-label="Close controls">×</button></div><p class="controls-verse">${escape(surah?.englishName || "Surah " + state.surah)} · Ayah ${state.verse + 1} of ${state.verses.length}</p>${feedback()}<div class="controls-grid"><button id="locate-start" class="${!state.listening && !state.challenge ? "listen-button" : ""}">${icon("mic")}Start anywhere</button><button id="listen" class="${state.listening || state.challenge ? "listen-button" : "secondary-button"}" aria-pressed="${state.listening}">${icon(state.listening ? "stop" : "mic")}${state.listening ? "Pause recitation" : "Recite selected ayah"}</button><button id="open-challenge">${icon("book")}Ayah challenge</button><button id="play" class="secondary-button">${icon(state.playing ? "stop" : "play")}${state.playing ? "Stop audio" : "Listen to ayah"}</button><button id="prev" ${state.verse === 0 ? "disabled" : ""}>${icon("arrowLeft")}Previous ayah</button><button id="next" ${state.verse === state.verses.length - 1 ? "disabled" : ""}>${icon("arrowRight")}Next ayah</button>${state.mode === "Recall & recite" ? `<button id="hint">${icon("hint")}Word hint</button><button id="hide" aria-pressed="${state.revealAll}">${icon("eye")}${state.revealAll ? "Hide words" : "Reveal words"}</button>` : ""}<button id="retry">${icon("retry")}Retry ayah</button><button id="finish" ${!state.transcript ? "disabled" : ""}>${icon("check")}Finish & review</button><button id="mark">${icon("check")}${state.saved[`${state.surah}:${state.verse}`] ? "Memorized · undo" : "Mark memorized"}</button><button id="menu-sound" aria-pressed="${state.sound}">${icon("sound")}Sound ${state.sound ? "on" : "off"}</button><button id="test-sound">${icon("sound")}Test sound</button><button id="feedback-mode" aria-pressed="${state.feedbackMode === "safe"}">${icon("check")}${state.feedbackMode === "safe" ? "Red alerts off · enable" : "Red alerts on · disable"}</button><button id="study-grammar" aria-pressed="${studyOptions.grammar}">${icon("book")}Grammar ${studyOptions.grammar ? "on" : "off"}</button><button id="study-repeated" aria-pressed="${studyOptions.repeated}">${icon("search")}Repeated words ${studyOptions.repeated ? "on" : "off"}</button><button id="clear-marks">${icon("retry")}Clear session marks</button></div>${studyOptions.grammar || studyOptions.repeated ? `<p class="study-help">Study tools: hover or tap a visible word for details. Repeated-word colours group normalized spelling; different words can share a colour. Red marks remain recitation alerts.</p>` : ""}<p class="sound-help">${state.soundBlocked ? "Audio was blocked. Tap Test sound to enable it." : "If the warning is silent, turn up media volume and tap Test sound. Microphone audio routing can vary on iPhone."}</p><p class="recognition-note feedback-mode-note">${state.feedbackMode === "safe" ? "Safe feedback: browser text differences are unconfirmed. Confirm a mistake in Review to mark it red. Automatic recitation judging is unavailable." : "Experimental red alerts may flag correct recitation. Switch to safe feedback to avoid unverified error alerts."}</p><div class="controls-navigation" aria-label="App navigation">${[
   ["Reader", "Read"],
   ["Practice", "Memorize"],
   ["Challenge", "Challenge"],
   ["Library", "Surahs"],
   ["Mistakes", "Review"],
   ["Search", "Search"],
   ["Progress", "Progress"],
 ]
   .map(([tab, label]) => `<button data-tab="${tab}">${label}</button>`)
   .join("")}</div></section></div></div></section>`;
}
export function mistakesScreen(state) {
  return `<div class="screen-heading"><div><span class="kicker">LEARN, REPEAT, GROW</span><h2>Every mistake is a way forward.</h2><p>Review what the browser recognized. Confirm or dismiss text differences yourself.</p></div><span class="count-chip">${state.mistakes.length} attempts to review</span></div><div class="review-notice">Speech recognition can be wrong. These are possible text mismatches, not confirmed Quran mistakes. Transcripts stay on this device; delete them at any time.</div><div class="review-filters">${["all", "incorrect", "missed", "extra"].map((type) => `<button data-filter="${type}" class="${state.mistakeFilter === type ? "active" : ""}">${type === "all" ? "All feedback" : labels[type]}</button>`).join("")}</div>
 <div class="mistake-list">${
   state.mistakes
     .filter(
       (m) =>
         state.mistakeFilter === "all" ||
         m.details.some((d) => d.type === state.mistakeFilter),
     )
     .map(
       (m) =>
         `<article class="mistake-card" data-reviewed="${m.reviewStatus === "confirmed" ? "confirmed" : "unverified"}"><div class="mistake-card-heading"><div><span class="verse-chip">${m.surah}:${m.verse + 1}</span><strong>${escape(m.surahName)}</strong><small>${escape(new Date(m.at).toLocaleString())}</small></div><button class="delete-button" data-delete="${escape(m.id)}" aria-label="Delete feedback for ${m.surah}:${m.verse + 1}">×</button></div><div class="mistake-types"><span class="review-status">${m.reviewStatus === "confirmed" ? "Mistake confirmed by you" : "Unconfirmed browser recognition"}</span>${[...new Set(m.details.map((d) => d.type))].map((t) => `<span>${labels[t]}</span>`).join("")}</div><div class="comparison"><div><label>Expected ayah</label><p lang="ar" dir="rtl">${m.expected
           .split(/\s+/)
           .map(
             (w, i) =>
               `<span class="${m.details.some((d) => d.position === i && d.type !== "extra") ? (m.reviewStatus === "confirmed" || state.feedbackMode === "experimental" ? "error-text" : "uncertain-text") : ""}">${escape(w)}</span>`,
           )
           .join(
             " ",
           )}</p></div><div><label>Browser recognized</label><p lang="ar" dir="rtl">${escape(m.recited)}</p></div></div><ul class="detail-list">${m.details.map((d) => `<li><span>${labels[d.type]}</span><span lang="ar" dir="rtl">${escape(d.expected || "—")} ${d.recited ? " ← " + escape(d.recited) : ""}</span></li>`).join("")}</ul><div class="verification-actions"><button data-confirm="${escape(m.id)}" ${m.reviewStatus === "confirmed" ? "disabled" : ""}>${m.reviewStatus === "confirmed" ? "Confirmed by you" : "Confirm actual mistake"}</button><button data-dismiss="${escape(m.id)}">I recited correctly · dismiss</button></div><div class="mistake-actions"><button class="listen-button" data-review="${escape(m.id)}">Practice this ayah ↗</button><button class="secondary-button" data-similar="${escape(m.id)}">Find matching phrases</button></div></article>`,
     )
     .join("") ||
   '<div class="empty-state"><span>✧</span><h3>A fresh page.</h3><p>No feedback in this category yet. Recite an ayah to collect possible mismatches for review.</p><button class="listen-button" data-tab="Reader">Open Quran reader →</button></div>'
 }</div>${state.mistakes.length ? '<button class="text-button" id="clear-history">Delete all saved feedback</button>' : ""}`;
}
export function searchScreen(state) {
  return `<div class="screen-heading"><div><span class="kicker">NOTICE THE CONNECTIONS</span><h2>Find matching Quran phrases.</h2><p>Explore verses containing the same Arabic phrase.</p></div></div><form id="verse-search" class="verse-search"><label for="search-query">Arabic word or phrase</label><div><input id="search-query" lang="ar" dir="rtl" placeholder="ابحث في القرآن" value="${escape(state.searchQuery)}" required maxlength="120"/><button class="listen-button" type="submit">Search</button></div></form><p class="search-explanation">Phrase search helps explore Mutashabihat. It finds text matches, not all verses with similar meanings. Search uses the bundled Tanzil Uthmani text and works without an external Quran API; no translation is shown.</p><p role="status" class="search-status">${escape(state.searchMessage)}</p><div class="search-results">${state.searchResults.map((r, i) => `<article class="search-result"><div><span class="verse-chip">${r.surah.number}:${r.numberInSurah}</span><h3>${escape(r.surah.englishName)}</h3></div><p lang="ar" dir="rtl">${escape(r.text)}</p><button class="text-button" data-result="${i}">Continue reading →</button></article>`).join("")}</div>`;
}
export function progressScreen(state, surahs) {
  const summary = activitySummary(state.activity),
    keys = Object.keys(state.saved);
  const seconds = Object.values(state.activity).reduce(
      (n, d) => n + d.seconds,
      0,
    ),
    sessions = Object.values(state.activity).reduce(
      (n, d) => n + d.sessions,
      0,
    );
  const max = Math.max(60, ...summary.week.map((d) => d.seconds));
  return `<div class="screen-heading"><div><span class="kicker">SHOW UP FOR YOURSELF</span><h2>Small steps. Lasting connection.</h2><p>Your real activity, saved on this device.</p></div></div><div class="progress-stats"><article><span>Current streak</span><strong>${summary.streak}<small> day${summary.streak === 1 ? "" : "s"}</small></strong><p>Practice today to keep going.</p></article><article><span>Memorized</span><strong>${keys.length}<small> ayahs</small></strong><p>Marked by you, at your pace.</p></article><article><span>Practice time</span><strong>${Math.floor(seconds / 60)}<small> min</small></strong><p>${sessions} recorded sessions</p></article></div><div class="progress-panels"><article class="activity-card"><div class="chart-heading"><h3>Quran activity</h3><span>Last 12 weeks</span></div><div class="activity-grid" role="group" aria-label="Daily Quran activity for the past 12 weeks">${summary.days.map((d) => `<div role="img" class="activity-cell level-${d.sessions ? Math.min(4, Math.ceil(d.seconds / 120)) : 0}" title="${d.date}: ${d.sessions} sessions, ${Math.round(d.seconds / 60)} min" aria-label="${d.date}: ${d.sessions} sessions, ${Math.round(d.seconds / 60)} minutes"></div>`).join("")}</div><div class="activity-legend"><span>Less</span>${[0, 1, 2, 3, 4].map((i) => `<i class="activity-cell level-${i}"></i>`).join("")}<span>More</span></div></article><article class="activity-card"><div class="chart-heading"><h3>Time with the Quran</h3><span>Past 7 days</span></div><div class="bar-chart">${summary.week.map((d) => `<div class="bar-column"><span>${Math.round(d.seconds / 60)}m</span><div class="bar" style="height:${d.seconds ? Math.max(3, (d.seconds / max) * 100) : 0}px"></div><label>${escape(d.label)}</label></div>`).join("")}</div></article></div><div class="manual-session"><div><h3>Practiced away from the app?</h3><p>Log your own reading or revision time.</p></div><form id="log-session"><label for="session-minutes">Minutes</label><input id="session-minutes" type="number" min="1" max="240" value="5" required/><button class="secondary-button" type="submit">+ Add session</button></form></div><article class="memorized-card"><h3>Your memorized ayahs</h3><div class="progress-list">${
    keys
      .map((k) => {
        const [s, v] = k.split(":").map(Number);
        return `<button data-memorized="${k}"><span>${escape(surahs.find((x) => x.number === s)?.englishName || "Surah " + s)} · Ayah ${v + 1}</span><span>Review →</span></button>`;
      })
      .join("") || "<p>Your first memorized ayah will appear here.</p>"
  }</div></article>`;
}

export function challengeScreen(state, surahs) {
  const selected =
    surahs.find((s) => s.number === state.quizSurah) || surahs[0];
  return `<section class="challenge-setup"><div class="screen-heading"><div><span class="kicker">CONTINUE FROM MEMORY</span><h2>One ayah. What comes next?</h2><p>Choose a prompt, read it, then continue the recitation from memory.</p></div></div><div class="challenge-form"><label for="quiz-surah">Surah</label><select id="quiz-surah">${surahs.map((s) => `<option value="${s.number}" ${s.number === selected.number ? "selected" : ""}>${s.number}. ${escape(s.englishName)} · ${escape(s.name)}</option>`).join("")}</select><div class="challenge-fields"><div><label for="quiz-ayah">Prompt ayah</label><input id="quiz-ayah" type="number" min="1" max="${selected.numberOfAyahs}" value="${state.quizAyah}"/></div><div><label for="quiz-style">Exercise</label><select id="quiz-style"><option value="next" ${state.quizStyle === "next" ? "selected" : ""}>Full ayah → continue after it</option><option value="finish" ${state.quizStyle === "finish" ? "selected" : ""}>Opening words → finish this ayah</option></select></div></div><div class="challenge-explainer">${state.quizStyle === "next" ? "The full prompt ayah stays visible. Following words stay hidden until recognized or revealed with a hint." : "Only the opening words stay visible. Recite the hidden remainder of the same ayah, then continue if you wish."}</div><p role="status" class="challenge-message">${escape(state.quizMessage)}</p><div class="challenge-setup-actions"><button class="listen-button" id="challenge-begin">${icon("play")}Show prompt</button><button class="secondary-button" id="challenge-random">${icon("retry")}Random ayah in this surah</button></div><p class="search-explanation">This is a recall exercise, not an automatic recitation grade. Browser recognition can mishear Arabic; use hints and reference audio when needed.</p></div></section>`;
}
function challengePage(state, surahs, renderWordList) {
  const exercise = state.challenge,
    name = surahs.find((s) => s.number === exercise.surah)?.englishName || "";
  const first = state.verse === exercise.targetVerse;
  return `<section class="challenge-page"><div class="challenge-page-header"><span class="kicker">AYAH CONTINUATION</span><button id="challenge-end" class="text-button">Return to Quran page</button></div><h2>${exercise.style === "next" ? "Read this ayah, then continue." : "Complete the hidden words."}</h2><p class="challenge-ref">${escape(name)} · Prompt ${exercise.surah}:${exercise.cueVerse + 1}</p>${exercise.style === "next" ? `<div class="challenge-cue" lang="ar" dir="rtl">${escape(exercise.cue)}</div>` : ""}<p class="challenge-instruction">${exercise.style === "finish" && first ? "Begin after the visible opening words." : "Recite the hidden continuation. Words appear when recognized."}</p><div class="challenge-answer current-verse" lang="ar" dir="rtl">${renderWordList(state.verses[state.verse], state.verse, state.surah)} <span class="challenge-ayah-number">﴿${(state.verse + 1).toLocaleString("ar")}﴾</span></div><p class="challenge-target">Continuing at ${state.surah}:${state.verse + 1}</p><div class="challenge-page-actions"><button id="challenge-listen" class="listen-button">${icon(state.listening ? "stop" : "mic")}${state.listening ? "Pause recitation" : "Recite continuation"}</button></div><p class="recognition-note">Use the bottom controls for a word hint, reveal, or reference audio. No recitation score is assigned.</p></section>`;
}
function locationPanel(state, surahs) {
  if (state.locationState === "idle") return "";
  return `<section class="locator-panel" aria-label="Find by reciting"><div class="locator-heading"><strong>${state.finding ? "Finding your place…" : "Passage finder"}</strong><button id="location-dismiss" class="text-button" aria-label="Dismiss passage finder">×</button></div><p role="status">${escape(state.locationMessage)}</p>${state.finding && state.transcript ? `<p class="locator-transcript" lang="ar" dir="rtl">${escape(state.transcript)}</p>` : ""}${state.locationCandidates.length > 1 ? `<div class="location-candidates">${state.locationCandidates.map((m, i) => `<button data-location="${i}"><span>${escape(surahs.find((s) => s.number === m.surah)?.englishName || "")} ${m.surah}:${m.verse + 1}</span><small>Page ${m.page}</small></button>`).join("")}</div>` : ""}<small>Matching recognized text only. Repeated phrases need more context; recognition errors may prevent a match.</small></section>`;
}
