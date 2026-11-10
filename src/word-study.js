import { chapter, practiceText } from "./quran.js";
export const studyKey = (text) =>
  text
    .replace(/ٰ/g, "ا")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/[^\u0621-\u064a]/g, "")
    .replace(/ـ/g, "");
const triliteralPatterns = {
  I: "فَعَلَ / فَعِلَ / فَعُلَ",
  II: "فَعَّلَ",
  III: "فَاعَلَ",
  IV: "أَفْعَلَ",
  V: "تَفَعَّلَ",
  VI: "تَفَاعَلَ",
  VII: "اِنْفَعَلَ",
  VIII: "اِفْتَعَلَ",
  IX: "اِفْعَلَّ",
  X: "اِسْتَفْعَلَ",
};
const quadriliteralPatterns = {
  I: "فَعْلَلَ",
  II: "تَفَعْلَلَ",
  III: "اِفْعَنْلَلَ",
  IV: "اِفْعَلَلَّ",
};
export function verbForm(tag, features) {
  if (tag !== "V" || !features.includes("STEM")) return null;
  const root = features.find((f) => f.startsWith("ROOT:"))?.slice(5);
  const rootSize = root ? [...root].length : 0;
  const explicit = features.find((f) => /^\([IVX]+\)$/.test(f))?.slice(1, -1);
  const number = explicit || ([3, 4].includes(rootSize) ? "I" : null);
  if (!number) return null;
  const quadriliteral = rootSize === 4;
  const pattern =
    rootSize === 3
      ? triliteralPatterns[number]
      : quadriliteral
        ? quadriliteralPatterns[number]
        : null;
  return {
    number,
    pattern: pattern || null,
    quadriliteral,
    label: `${quadriliteral ? "Quadriliteral form" : "Verb form"} ${number} · ${quadriliteral ? "رباعي" : "باب الفعل"}${pattern ? ` — ${pattern}` : " — pattern not specified"}`,
    note:
      number === "I" && rootSize === 3
        ? "Form I vowel subclass is not specified in the corpus. The alternatives are model patterns, not a claim about this word’s exact vowels."
        : "Model stem pattern; tense, passive voice, and weak roots can change the word’s surface spelling.",
  };
}
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
    verbForm: verbForm(tag, features),
    details: features.filter((f) => labels[f]).map((f) => labels[f]),
    features: features
      .filter((f) => !f.startsWith("ROOT:") && !f.startsWith("LEM:"))
      .join(" · "),
  }));
}
export function partitionSegments(segments) {
  const main = segments.filter((s) => s[2].includes("STEM"));
  const primary = main.length ? main : segments.slice(0, 1);
  return { primary, attached: segments.filter((s) => !primary.includes(s)) };
}
const options = { grammar: true, repeated: true };
try {
  Object.assign(
    options,
    JSON.parse(localStorage.getItem("hifdh-word-study-v2") || "{}"),
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
    localStorage.setItem("hifdh-word-study-v2", JSON.stringify(options));
  } catch {}
}
export function closeWordStudy(restoreFocus = false) {
  document.getElementById("word-study-panel")?.remove();
  if (restoreFocus && activeWord?.isConnected) activeWord.focus();
}
let meaningSource;
async function meaningFor(s, v, w) {
  const data = await load(String(s));
  if (!data?.[v]?.[w]) return null;
  meaningSource ||= import(
    /* @vite-ignore */ `${import.meta.env.BASE_URL}data/meanings/english.js`
  )
    .then((m) => new Map(m.default))
    .catch((e) => {
      meaningSource = null;
      throw e;
    });
  const map = await meaningSource;
  const position = practiceText(
    Number(s),
    Number(v),
    chapter(Number(s)).verses[v],
  )
    .split(/\s+/)
    .slice(0, Number(w) + 1)
    .filter(studyKey).length;
  const raw = map.get(`${s}:${Number(v) + 1}:${position}:1`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
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
  const add = (text, cls = "", target = panel) => {
    const p = document.createElement("p");
    p.textContent = text;
    if (cls) p.className = cls;
    target.append(p);
  };
  add(element.textContent, "study-arabic");
  const [s, v, w] = element.dataset.studyWord.split(":");
  add(`Surah ${s} · Ayah ${Number(v) + 1}`);
  const meaning = document.createElement("p");
  meaning.className = "study-meaning";
  meaning.setAttribute("role", "status");
  meaning.textContent = "English meaning: loading…";
  panel.append(meaning);
  meaningFor(s, v, w)
    .then((text) => {
      if (panel.isConnected)
        meaning.textContent = text
          ? `English meaning: ${text}`
          : "English meaning unavailable for this word.";
    })
    .catch(() => {
      if (panel.isConnected)
        meaning.textContent =
          "Meaning could not load. Check your connection, then tap the word again.";
    });
  const more = document.createElement("details");
  more.className = "study-more";
  const moreSummary = document.createElement("summary");
  moreSummary.textContent = "More details";
  more.append(moreSummary);
  if (options.grammar) {
    if (!segments)
      add(
        "No matching corpus annotation for this word. No grammar has been inferred.",
      );
    else {
      const { primary, attached } = partitionSegments(segments);
      const renderSegment = (segment, target = panel) => {
        add(`${segment.text} — ${segment.type}`, "study-segment", target);
        if (segment.root) add(`Root: ${segment.root}`, "", target);
        const extra = target === panel ? more : target;
        if (segment.lemma)
          add(`Lemma / base form: ${segment.lemma}`, "", extra);
        if (segment.verbForm) {
          add(segment.verbForm.label, "study-verb-form", target);
          add(segment.verbForm.note, "study-features", extra);
        }
        if (segment.details.length)
          add(segment.details.join(" · "), "", target);
        add(segment.features, "study-features", extra);
      };
      describeSegments(primary).forEach((segment) => renderSegment(segment));
      if (attached.length) {
        const details = document.createElement("details");
        details.className = "study-attached";
        const summary = document.createElement("summary");
        summary.textContent = `Articles & attached parts (${attached.length})`;
        details.append(summary);
        describeSegments(attached).forEach((segment) =>
          renderSegment(segment, details),
        );
        panel.append(details);
      }
    }
  }
  const count = wordFrequency(element.textContent);
  add(`Appears ${count} ${count === 1 ? "time" : "times"} in the Quran.`);
  add(
    "Counts use normalized word spelling and exclude unnumbered opening Bismillah. Grammar shows word morphology and supplied case/mood tags, not full sentence analysis.",
    "study-features",
    more,
  );
  const link = document.createElement("a");
  link.href = `https://corpus.quran.com/wordbyword.jsp?chapter=${s}&verse=${Number(v) + 1}`;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "Source: Quranic Arabic Corpus · view ayah";
  more.append(link);
  const credit = document.createElement("a");
  credit.href = `${import.meta.env.BASE_URL}licenses/english-word-meanings.txt`;
  credit.target = "_blank";
  credit.rel = "noopener";
  credit.textContent = "English meanings: Hablullah · source and terms";
  credit.className = "meaning-credit";
  more.append(credit);
  panel.append(more);
  document.body.append(panel);
  // Place the card above or below its word so hover never blocks the tap target.
  const rect = element.getBoundingClientRect();
  const reading = element.closest(".mushaf").getBoundingClientRect();
  const top = Math.max(8, reading.top),
    bottom = Math.min(innerHeight - 8, reading.bottom);
  const below = bottom - rect.bottom - 8,
    above = rect.top - top - 8;
  const space = Math.max(below, above);
  panel.style.maxHeight = `${Math.min(520, Math.max(48, space - 8))}px`;
  panel.style.bottom = "auto";
  const height = panel.getBoundingClientRect().height;
  panel.style.top = `${Math.max(top, Math.min(bottom - height, below >= above ? rect.bottom + 8 : rect.top - height - 8))}px`;
  if (focus) close.focus({ preventScroll: true });
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
