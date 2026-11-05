import { chapter, practiceText } from "./quran.js";
export const studyKey = (text) =>
  text
    .replace(/ٰ/g, "ا")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[^\u0621-\u064a]/g, "")
    .replace(/ـ/g, "");
export function describeSegments(segments) {
  const names = {
    V: "Verb · فعل",
    N: "Noun · اسم",
    PN: "Proper noun · اسم علم",
    ADJ: "Adjective · صفة",
    PRON: "Pronoun · ضمير",
    P: "Preposition · حرف جر",
    DET: "Definite article · ال",
    CONJ: "Conjunction · حرف عطف",
    REL: "Relative pronoun · اسم موصول",
    DEM: "Demonstrative · اسم إشارة",
    NEG: "Negative particle · حرف نفي",
    INL: "Disconnected letters · حروف مقطعة",
  };
  const labels = {
    PERF: "Past · ماضٍ",
    IMPF: "Imperfect · مضارع",
    IMPV: "Imperative · أمر",
    PASS: "Passive · مبني للمجهول",
    ACT: "Active participle component",
    PCPL: "Participle · اسم مشتق",
    NOM: "Nominative · مرفوع",
    ACC: "Accusative · منصوب",
    GEN: "Genitive · مجرور",
    "MOOD:IND": "Indicative · مرفوع",
    "MOOD:SUBJ": "Subjunctive · منصوب",
    "MOOD:JUS": "Jussive · مجزوم",
  };
  return segments.map(([text, tag, features]) => ({
    text,
    type: names[tag] || `Corpus tag: ${tag}`,
    root: features.find((f) => f.startsWith("ROOT:"))?.slice(5),
    lemma: features.find((f) => f.startsWith("LEM:"))?.slice(4),
    details: features
      .filter((f) => labels[f] || /^\([IVX]+\)$/.test(f))
      .map((f) => labels[f] || `Verb form ${f}`),
    features: features
      .filter((f) => !f.startsWith("ROOT:") && !f.startsWith("LEM:"))
      .join(" · "),
  }));
}
const options = { grammar: false, repeated: false };
try {
  Object.assign(
    options,
    JSON.parse(localStorage.getItem("hifdh-word-study") || "{}"),
  );
} catch {}
export const studyOptions = options;
const cache = new Map();
let counts,
  generation = 0,
  activeWord;
function frequencies() {
  if (counts) return counts;
  counts = new Map();
  for (let s = 1; s <= 114; s++)
    chapter(s).verses.forEach((v, i) =>
      practiceText(s, i, v)
        .split(/\s+/)
        .forEach((w) => {
          const k = studyKey(w);
          if (k) counts.set(k, (counts.get(k) || 0) + 1);
        }),
    );
  return counts;
}
export function wordFrequency(word) {
  return frequencies().get(studyKey(word)) || 0;
}
export function repeatColour(word) {
  let h = 0;
  for (const c of studyKey(word)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % 4;
}
export function toggleStudy(option) {
  options[option] = !options[option];
  try {
    localStorage.setItem("hifdh-word-study", JSON.stringify(options));
  } catch {}
}
export function closeWordStudy(restoreFocus = false) {
  document.getElementById("word-study-panel")?.remove();
  if (restoreFocus && activeWord?.isConnected) activeWord.focus();
}
function showWord(element, segments, focus = false) {
  closeWordStudy();
  activeWord = element;
  const panel = document.createElement("aside");
  panel.id = "word-study-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Quran word details");
  const close = document.createElement("button");
  close.textContent = "×";
  close.setAttribute("aria-label", "Close word details");
  close.onclick = () => closeWordStudy(true);
  panel.append(close);
  const add = (text, cls = "") => {
    const p = document.createElement("p");
    p.textContent = text;
    if (cls) p.className = cls;
    panel.append(p);
  };
  add(element.textContent, "study-arabic");
  const [s, v] = element.dataset.studyWord.split(":");
  add(`Surah ${s} · Ayah ${Number(v) + 1}`);
  if (options.grammar) {
    if (!segments)
      add(
        "No matching corpus annotation for this word. No grammar has been inferred.",
      );
    else
      for (const segment of describeSegments(segments)) {
        add(`${segment.text} — ${segment.type}`, "study-segment");
        if (segment.root) add(`Root · الجذر: ${segment.root}`);
        if (segment.lemma)
          add(`Corpus lemma / base form · الصيغة المعجمية: ${segment.lemma}`);
        if (segment.details.length) add(segment.details.join(" · "));
        add(segment.features, "study-features");
      }
  }
  add(
    `Appears ${wordFrequency(element.textContent)} times in the Quran (same normalized word spelling; opening unnumbered Bismillah excluded).`,
  );
  add(
    "Word morphology (ṣarf) and supplied case/mood tags; not a full sentence iʿrāb analysis.",
  );
  const link = document.createElement("a");
  link.href = `https://corpus.quran.com/wordbyword.jsp?chapter=${s}&verse=${Number(v) + 1}`;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Source: Quranic Arabic Corpus · view ayah";
  panel.append(link);
  document.body.append(panel);
  // Place the card above or below its word so hover never blocks the tap target.
  const rect = element.getBoundingClientRect();
  const below = innerHeight - rect.bottom - 12,
    above = rect.top - 12;
  const space = Math.max(below, above);
  panel.style.maxHeight = `${Math.min(520, Math.max(100, space - 12))}px`;
  panel.style.bottom = "auto";
  if (focus) close.focus({ preventScroll: true });
  panel.style.top = `${Math.max(8, below >= above ? rect.bottom + 8 : rect.top - panel.getBoundingClientRect().height - 8)}px`;
}
async function load(s) {
  if (!cache.has(s))
    cache.set(
      s,
      fetch(`${import.meta.env.BASE_URL}data/grammar/${s}.json`)
        .then((r) => {
          if (!r.ok) throw Error("Grammar unavailable");
          return r.json();
        })
        .catch(() => {
          cache.delete(s);
          return null;
        }),
    );
  return cache.get(s);
}
export async function bindWordStudy() {
  const run = ++generation;
  closeWordStudy();
  const nodes = [...document.querySelectorAll("[data-study-word]")];
  let datasets = {};
  if (options.grammar) {
    const surahs = [
      ...new Set(nodes.map((e) => e.dataset.studyWord.split(":")[0])),
    ];
    await Promise.all(surahs.map(async (s) => (datasets[s] = await load(s))));
  }
  if (run !== generation) return;
  for (const e of nodes) {
    if (!e.isConnected) continue;
    if (options.repeated && wordFrequency(e.textContent) > 1)
      e.classList.add("repeated-word", `repeat-${repeatColour(e.textContent)}`);
    if (!options.grammar && !options.repeated) continue;
    const [s, v, w] = e.dataset.studyWord.split(":");
    const segments = datasets[s]?.[v]?.[w];
    e.setAttribute("tabindex", "0");
    e.setAttribute("role", "button");
    e.setAttribute("aria-haspopup", "dialog");
    e.setAttribute(
      "aria-label",
      `${e.textContent} · Word details${segments?.some((x) => x[1] === "V") ? " · Verb" : ""}`,
    );
    e.onpointerenter = (event) => {
      if (event.pointerType === "mouse") showWord(e, segments);
    };
    e.onclick = () => showWord(e, segments, true);
    e.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showWord(e, segments, true);
      }
      if (event.key === "Escape") closeWordStudy(true);
    };
  }
}
if (typeof document !== "undefined")
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeWordStudy(true);
  });
