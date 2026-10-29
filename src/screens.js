import { splitOpening } from "./quran.js";
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
  incorrect: "Different word",
  missed: "Missed word",
  extra: "Extra / repeated word",
};
export function readerScreen(state, surahs, renderWordList, feedback) {
  const surah = surahs.find((s) => s.number === state.surah);
  const opening = splitOpening(state.surah, state.verses[0]);
  return `<section class="reader-shell ${state.alertActive ? "has-mistake" : ""}"><div class="reader-toolbar"><button class="reader-icon" data-tab="Library" aria-label="Open surah library">${icon("menu")}</button><div class="reader-chapter"><strong>${escape(surah?.englishName || "Surah " + state.surah)}</strong><span>Surah ${state.surah} · Ayah ${state.verse + 1} of ${state.verses.length}</span></div><button class="reader-icon ${state.bookmark?.surah === state.surah && state.bookmark?.verse === state.verse ? "bookmarked" : ""}" id="bookmark" aria-label="Bookmark selected ayah">${icon("bookmark")}</button><button class="reader-icon" id="theme" aria-label="Switch to ${state.theme === "white" ? "black" : "white"} view" title="Switch to ${state.theme === "white" ? "black" : "white"} view">${icon(state.theme === "white" ? "moon" : "sun")}</button><button class="reader-icon" id="reader-settings" aria-expanded="${state.settingsOpen}" aria-label="Reader settings">${icon("settings")}</button><button class="reader-icon" id="focus" aria-label="${state.focusMode ? "Exit full screen reader" : "Expand Quran reader"}" aria-pressed="${state.focusMode}">${icon(state.focusMode ? "collapse" : "expand")}</button></div>
 ${state.settingsOpen ? `<div class="reader-settings"><div class="theme-choices" role="group" aria-label="Reading appearance"><button data-theme="white" aria-pressed="${state.theme === "white"}">${icon("sun")} White</button><button data-theme="black" aria-pressed="${state.theme === "black"}">${icon("moon")} Black</button></div><label>Text size<input id="font-size" type="range" min="24" max="46" value="${state.fontSize}"/></label><label>Jump to ayah<input id="jump-ayah" type="number" min="1" max="${state.verses.length}" value="${state.verse + 1}"/></label><button class="secondary-button" id="jump">Go →</button><label>Repeat audio<select id="repeat-select">${[1, 3, 5, 10].map((n) => `<option value="${n}" ${state.repeats === n ? "selected" : ""}>${n} time${n > 1 ? "s" : ""}</option>`).join("")}</select></label><button class="sound-button" id="test-alert">Test red alert</button></div>` : ""}
 <div class="reader-mode"><div class="segmented">${["Read & reflect", "Recall & recite"].map((m) => `<button data-mode="${m}" class="${m === state.mode ? "selected" : ""}">${m === "Read & reflect" ? "Read" : "Memorize"}</button>`).join("")}</div><button class="sound-button ${state.sound ? "enabled" : ""}" id="sound" aria-label="${state.sound ? "Disable" : "Enable"} mistake sound" aria-pressed="${state.sound}">${icon("sound")} ${state.sound ? "Alerts on" : "Alerts off"}</button><span>${state.mode === "Recall & recite" ? "Recite to reveal words" : "Tap an ayah to practice"} · <a href="https://tanzil.net" target="_blank" rel="noopener">Tanzil</a></span></div>
 <div class="mushaf" style="--quran-size:${state.fontSize}px"><div class="chapter-ornament"><span>❧</span><h2 lang="ar">${escape(surah?.name || "")}</h2><span>❧</span></div>${opening.bismillah ? `<div class="basmala ${state.surah === 1 ? "mushaf-verse" : ""} ${state.surah === 1 && state.verse === 0 ? "current-verse" : ""}" lang="ar" dir="rtl">${state.surah === 1 ? renderWordList(state.verses[0], 0) : escape(opening.bismillah)}${state.surah === 1 ? ` <button class="verse-marker" data-verse="0" aria-label="Select ayah 1" ${state.verse === 0 ? 'aria-current="true"' : ""}>١</button>` : ""}</div>` : ""}<div class="mushaf-text" lang="ar" dir="rtl">${state.verses.map((verse, i) => (state.surah === 1 && i === 0 ? "" : `<span class="mushaf-verse ${i === state.verse ? "current-verse" : ""}">${renderWordList(verse, i)} <button class="verse-marker" data-verse="${i}" aria-label="Select ayah ${i + 1}" ${i === state.verse ? 'aria-current="true"' : ""}>${(i + 1).toLocaleString("ar")}</button></span> `)).join("")}</div></div>
 <div class="reader-controls">${state.alertActive && !state.controlsOpen ? '<div class="recitation-flag" role="status">Possible mismatch marked red. Keep reciting.</div>' : ""}<div class="controls-dropdown"><button class="controls-toggle" id="controls-toggle" aria-expanded="${state.controlsOpen}" aria-controls="recitation-controls">${icon(state.listening ? "mic" : "menu")}<span>${state.listening ? "Listening · Controls" : state.playing ? "Playing · Controls" : "Recitation & navigation"}</span><span aria-hidden="true">${state.controlsOpen ? "⌄" : "⌃"}</span></button><section class="controls-sheet" id="recitation-controls" aria-label="Recitation controls" ${state.controlsOpen ? "" : "hidden"}><div class="controls-sheet-heading"><strong>Recitation controls</strong><button id="close-controls" aria-label="Close controls">×</button></div><p class="controls-verse">${escape(surah?.englishName || "Surah " + state.surah)} · Ayah ${state.verse + 1} of ${state.verses.length}</p>${feedback()}<div class="controls-grid"><button id="listen" class="listen-button" aria-pressed="${state.listening}">${icon(state.listening ? "stop" : "mic")}${state.listening ? "Pause recitation" : "Start reciting"}</button><button id="play" class="secondary-button">${icon(state.playing ? "stop" : "play")}${state.playing ? "Stop audio" : "Listen to ayah"}</button><button id="prev" ${state.verse === 0 ? "disabled" : ""}>${icon("arrowLeft")}Previous ayah</button><button id="next" ${state.verse === state.verses.length - 1 ? "disabled" : ""}>${icon("arrowRight")}Next ayah</button>${state.mode === "Recall & recite" ? `<button id="hint">${icon("hint")}Word hint</button><button id="hide" aria-pressed="${state.revealAll}">${icon("eye")}${state.revealAll ? "Hide words" : "Reveal words"}</button>` : ""}<button id="retry">${icon("retry")}Retry ayah</button><button id="finish" ${!state.transcript ? "disabled" : ""}>${icon("check")}Finish & review</button><button id="mark">${icon("check")}${state.saved[`${state.surah}:${state.verse}`] ? "Memorized · undo" : "Mark memorized"}</button><button id="menu-sound" aria-pressed="${state.sound}">${icon("sound")}Sound ${state.sound ? "on" : "off"}</button><button id="test-sound">${icon("sound")}Test sound</button><button id="clear-marks">${icon("retry")}Clear session marks</button></div><p class="sound-help">${state.soundBlocked ? "Audio was blocked. Tap Test sound to enable it." : "If the warning is silent, turn up media volume and tap Test sound. Microphone audio routing can vary on iPhone."}</p><p class="recognition-note">Browser recognition may mishear Arabic. Red marks indicate possible text mismatches, not a tajweed assessment.</p><div class="controls-navigation" aria-label="App navigation">${[
   ["Reader", "Read"],
   ["Practice", "Memorize"],
   ["Library", "Surahs"],
   ["Mistakes", "Review"],
   ["Search", "Search"],
   ["Progress", "Progress"],
 ]
   .map(([tab, label]) => `<button data-tab="${tab}">${label}</button>`)
   .join("")}</div></section></div></div></section>`;
}
export function mistakesScreen(state) {
  return `<div class="screen-heading"><div><span class="kicker">LEARN, REPEAT, GROW</span><h2>Every mistake is a way forward.</h2><p>Review possible mismatches from your practice sessions.</p></div><span class="count-chip">${state.mistakes.length} attempts to review</span></div><div class="review-notice">Speech recognition can be wrong. These are possible text mismatches, not confirmed Quran mistakes. Transcripts stay on this device; delete them at any time.</div><div class="review-filters">${["all", "incorrect", "missed", "extra"].map((type) => `<button data-filter="${type}" class="${state.mistakeFilter === type ? "active" : ""}">${type === "all" ? "All feedback" : labels[type]}</button>`).join("")}</div>
 <div class="mistake-list">${
   state.mistakes
     .filter(
       (m) =>
         state.mistakeFilter === "all" ||
         m.details.some((d) => d.type === state.mistakeFilter),
     )
     .map(
       (m) =>
         `<article class="mistake-card"><div class="mistake-card-heading"><div><span class="verse-chip">${m.surah}:${m.verse + 1}</span><strong>${escape(m.surahName)}</strong><small>${escape(new Date(m.at).toLocaleString())}</small></div><button class="delete-button" data-delete="${escape(m.id)}" aria-label="Delete feedback for ${m.surah}:${m.verse + 1}">×</button></div><div class="mistake-types">${[...new Set(m.details.map((d) => d.type))].map((t) => `<span>${labels[t]}</span>`).join("")}</div><div class="comparison"><div><label>Expected ayah</label><p lang="ar" dir="rtl">${m.expected
           .split(/\s+/)
           .map(
             (w, i) =>
               `<span class="${m.details.some((d) => d.position === i && d.type !== "extra") ? "error-text" : ""}">${escape(w)}</span>`,
           )
           .join(
             " ",
           )}</p></div><div><label>Browser recognized</label><p lang="ar" dir="rtl">${escape(m.recited)}</p></div></div><ul class="detail-list">${m.details.map((d) => `<li><span>${labels[d.type]}</span><span lang="ar" dir="rtl">${escape(d.expected || "—")} ${d.recited ? " ← " + escape(d.recited) : ""}</span></li>`).join("")}</ul><div class="mistake-actions"><button class="listen-button" data-review="${escape(m.id)}">Practice this ayah ↗</button><button class="secondary-button" data-similar="${escape(m.id)}">Find matching phrases</button></div></article>`,
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
  return `<div class="screen-heading"><div><span class="kicker">SHOW UP FOR YOURSELF</span><h2>Small steps. Lasting connection.</h2><p>Your real activity, saved on this device.</p></div></div><div class="progress-stats"><article><span>Current streak</span><strong>${summary.streak}<small> day${summary.streak === 1 ? "" : "s"}</small></strong><p>Practice today to keep going.</p></article><article><span>Memorized</span><strong>${keys.length}<small> ayahs</small></strong><p>Marked by you, at your pace.</p></article><article><span>Practice time</span><strong>${Math.floor(seconds / 60)}<small> min</small></strong><p>${sessions} recorded sessions</p></article></div><div class="progress-panels"><article class="activity-card"><div class="chart-heading"><h3>Quran activity</h3><span>Last 12 weeks</span></div><div class="activity-grid">${summary.days.map((d) => `<div class="activity-cell level-${d.sessions ? Math.min(4, Math.ceil(d.seconds / 120)) : 0}" title="${d.date}: ${d.sessions} sessions, ${Math.round(d.seconds / 60)} min" aria-label="${d.date}: ${d.sessions} sessions"></div>`).join("")}</div><div class="activity-legend"><span>Less</span>${[0, 1, 2, 3, 4].map((i) => `<i class="activity-cell level-${i}"></i>`).join("")}<span>More</span></div></article><article class="activity-card"><div class="chart-heading"><h3>Time with the Quran</h3><span>Past 7 days</span></div><div class="bar-chart">${summary.week.map((d) => `<div class="bar-column"><span>${Math.round(d.seconds / 60)}m</span><div class="bar" style="height:${d.seconds ? Math.max(3, (d.seconds / max) * 100) : 0}px"></div><label>${escape(d.label)}</label></div>`).join("")}</div></article></div><div class="manual-session"><div><h3>Practiced away from the app?</h3><p>Log your own reading or revision time.</p></div><form id="log-session"><label for="session-minutes">Minutes</label><input id="session-minutes" type="number" min="1" max="240" value="5" required/><button class="secondary-button" type="submit">+ Add session</button></form></div><article class="memorized-card"><h3>Your memorized ayahs</h3><div class="progress-list">${
    keys
      .map((k) => {
        const [s, v] = k.split(":").map(Number);
        return `<button data-memorized="${k}"><span>${escape(surahs.find((x) => x.number === s)?.englishName || "Surah " + s)} · Ayah ${v + 1}</span><span>Review →</span></button>`;
      })
      .join("") || "<p>Your first memorized ayah will appear here.</p>"
  }</div></article>`;
}
