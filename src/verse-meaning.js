import { chapter, practiceText, surahs } from "./quran.js";
import { closeWordStudy } from "./word-study.js";
let translations, activeDialog;
export async function loadVerseMeanings() {
  translations ||= fetch(
    `${import.meta.env.BASE_URL}data/verse-meanings/english-pickthall.json`,
  )
    .then((r) => {
      if (!r.ok) throw Error("Translation unavailable");
      return r.json();
    })
    .catch((e) => {
      translations = null;
      throw e;
    });
  return translations;
}
export function closeVerseMeaning() {
  activeDialog?.remove();
  activeDialog = null;
}
export function showVerseMeaning(surah, index, showArabic = true) {
  closeVerseMeaning();
  closeWordStudy();
  const trigger = document.querySelector(
    `.verse-marker[data-chapter="${surah}"][data-verse="${index}"]`,
  );
  const dialog = document.createElement("dialog");
  activeDialog = dialog;
  dialog.id = "verse-meaning-panel";
  dialog.setAttribute("aria-labelledby", "verse-meaning-title");
  const close = () => {
    if (activeDialog === dialog) activeDialog = null;
    dialog.remove();
    if (trigger?.isConnected) trigger.focus({ preventScroll: true });
  };
  const button = document.createElement("button");
  button.className = "verse-meaning-close";
  button.textContent = "×";
  button.setAttribute("aria-label", "Close ayah meaning");
  button.onclick = close;
  dialog.append(button);
  const title = document.createElement("h2");
  title.id = "verse-meaning-title";
  title.textContent = `${surahs.find((s) => s.number === Number(surah))?.englishName || "Surah"} · ${surah}:${index + 1}`;
  dialog.append(title);
  if (showArabic) {
    const text = document.createElement("p");
    text.className = "verse-meaning-arabic";
    text.lang = "ar";
    text.dir = "rtl";
    text.textContent = practiceText(surah, index, chapter(surah).verses[index]);
    dialog.append(text);
  }
  const meaning = document.createElement("p");
  meaning.className = "verse-meaning-text";
  meaning.setAttribute("role", "status");
  meaning.textContent = "Loading full ayah meaning…";
  dialog.append(meaning);
  const credit = document.createElement("p");
  credit.className = "verse-meaning-credit";
  credit.textContent =
    "English translation of meanings · Marmaduke Pickthall (1930). This is a translation, not tafsir.";
  dialog.append(credit);
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  document.body.append(dialog);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else dialog.setAttribute("open", "");
  button.focus({ preventScroll: true });
  loadVerseMeanings()
    .then((data) => {
      if (dialog.isConnected) {
        const row = data[String(surah)]?.find((v) => v.verse === index + 1);
        meaning.textContent =
          row?.text || "Full meaning unavailable for this ayah.";
      }
    })
    .catch(() => {
      if (dialog.isConnected)
        meaning.textContent =
          "Could not load the meaning. Check your connection, then open this ayah again.";
    });
}
