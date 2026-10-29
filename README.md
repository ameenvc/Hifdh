# Hifdh

A responsive Quran memorization web app for mobile and desktop browsers.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev -- --port 5173
```

`npm test` checks Arabic comparison, activity calculations, and interactions against the actual bundled application in a DOM environment. `npm run build` creates the production site in `dist`; `npm run preview` serves it locally.

## Features

- Dark Quran reader with a full-height reading canvas, expandable focus mode, clear touch controls, adjustable Arabic text size, verse navigation and a saved bookmark. Reading and memorization share this screen.
- Review history separates possible different, missed and extra words, with expected text, recognized text, category filters and deletion. The latest 200 attempts with possible mistakes are retained locally.
- Arabic phrase search links matching verses back to the reader. This is a text-search aid for Mutashabihat, not semantic similarity detection.
- Actual practice activity, daily streaks, a 12-week activity grid and a weekly time chart. Speech/audio sessions record elapsed foreground time when paused or completed; manual sessions support reading away from the app.
- Read an ayah, or use Recall & recite to reveal words progressively as they are recognized. Matching final ayahs advance automatically within the current surah, including continuing after Al-Fatiha’s Bismillah.
- Reveal the next word as a hint, reveal the full ayah, or reset an attempt.
- Inspect the browser transcript when checking possible mistakes.
- All 114 surahs and 6,236 ayahs are bundled from a pinned Tanzil Uthmani snapshot. Text and phrase search need no external Quran API once the app loads.
- Listen to individual ayahs recited by Mishary Alafasy through Islamic Network, with 1, 3, 5 or 10 repeats.
- Experimental Arabic speech recognition highlights recognized matching words green and possible mismatches red, with a brief tone and prominent red alert when a final transcript contains a mismatch. Provisional recognition guesses do not trigger red feedback or alerts. Alert sound can be toggled beside the reading mode selector, and tested in reader settings.
- Mark memorized verses and review progress, saved only on the current browser/device.

## Speech limitations

Use a browser supporting SpeechRecognition or webkitSpeechRecognition, over HTTPS (or localhost for development), with microphone permission. Browser speech processing may use the browser provider's servers. Availability varies by browser and device. No audio is uploaded by this app's own code.

Comparison aligns normalized recognized words against a prefix of the current ayah. Source-backed Uthmani/standard-spelling correspondences handle differences such as ٱلْعَٰلَمِينَ → العالمين and مَٰلِكِ → مالك without changing the displayed Quran. The comparison dictionary is generated from the pinned Tanzil Uthmani and simple-clean snapshots with `node scripts/build-comparison-words.mjs`; only verses with corresponding word boundaries contribute pairs, and ambiguous pairs are rejected. This does not solve all Quran orthography or speech recognition differences. It flags possible omitted or substituted words and counts extra or repeated words. It can misidentify omissions, repetitions and recognition errors; it does not detect tajweed or evaluate pronunciation. Unspoken trailing words remain pending until you explicitly choose **Finish**, which marks the unrecited ending as possibly missed. Final recognition transcripts with mismatches are saved locally for review. Correcting the transcript in the same attempt updates its feedback; a retry begins a separate attempt. It is not a replacement for a qualified Quran teacher or a specialist Quran speech model. Actual microphone recognition has not been validated in this cloud environment.

This is a mobile-friendly web application, not a native Android/iOS package or a production equivalent of Tarteel. Specialist recitation recognition, accounts, cloud sync and native packaging require additional work.

## Quran text and Bismillah

The exact Tanzil Uthmani snapshot is retained unchanged in `src/data/uthmani.json`. `src/data/provenance.json` records the mirror commit, source URLs, upstream SHA-256 checksums and attribution notice. The snapshot came from `risan/quran-json` commit `6523a9ad3b73bb7e8cb3a9cdf0ea774b8bab3123`. Its checksums were verified before copying. This validates snapshot integrity, not an independent scholarly review of every character.

Bismillah is presented on its own line. For surahs 2–114 except 9, the opening Bismillah is not numbered and ayah 1 follows it. Standard Hafs numbering is preserved: **Al-Fatiha counts Bismillah as ayah 1**, and **At-Tawbah has no opening Bismillah**. Bismillah within An-Naml 27:30 stays in that numbered ayah. Presentation splitting preserves the original source characters and does not renumber verses or audio references. An optional spoken opening is accepted before the first ayah of applicable surahs.

Text attribution: [Tanzil Project](https://tanzil.net), CC BY 3.0 with verbatim-copy conditions. The required notice is in `public/licenses/tanzil.txt` and `src/data/LICENSE.txt`. The companion `simple-clean.json` snapshot is retained verbatim too; its checksum is recorded alongside the Uthmani source. `comparison-words.json` is a derived comparison index, not display text. Do not reformat the pinned source JSON files: integrity tests check their exact bytes.

## External services

`cdn.islamic.network` supplies recitation audio. Text, surah metadata and phrase search are bundled locally. Arabic and Latin fonts are bundled too; licenses are in `public/licenses`. Browser speech recognition may require the browser provider's online service. No API credentials are required. This is a web app: a first visit still needs connectivity to download it, and offline reopening is not guaranteed without browser caching.

## Validation

The production build and 38 automated tests pass. Checks include all 114 Hafs surah counts, all 6,236 sequential verse/audio references, exact snapshot checksums, lossless Bismillah separation for all applicable surahs, At-Tawbah and Al-Fatiha exceptions, An-Naml 27:30 preservation, local search, guided recall, feedback review, actual activity, expandable focus and red alerts. Speech is simulated in interaction tests, including partial/final recognition revisions, Bismillah-to-next-ayah transitions and a full Al-Fatiha session.

Chromium checks at widths 320, 375, 390, 768 and 1440 pixels passed navigation checks with no page errors or horizontal overflow. Reading areas were at least 280 pixels tall in these checks, and recitation controls fit the viewport. Expand/collapse and Bismillah display were also checked in the browser. Actual iPhone microphone recognition and audio service availability remain unverified in this environment.

The all-Quran corpus intentionally adds about 300 KB compressed to the application JavaScript. Keeping it in the app makes text and phrase search independent of external Quran API availability.

## Publish to GitHub Pages

Build with the repository path before publishing the contents of `dist`:

```sh
npm run build -- --base=/Hifdh/
```

The `gh-pages` branch contains the static deployment. GitHub Pages must be enabled with **Deploy from a branch → gh-pages → / (root)**. Changes to `main` do not automatically rebuild that branch.
