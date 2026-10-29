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

- Continuous Quran reader with ayah selection, adjustable Arabic text size, verse navigation and a saved bookmark.
- Review history separates possible different, missed and extra words, with expected text, recognized text, category filters and deletion. The latest 200 attempts with possible mistakes are retained locally.
- Arabic phrase search links matching verses back to the reader. This is a text-search aid for Mutashabihat, not semantic similarity detection.
- Actual practice activity, daily streaks, a 12-week activity grid and a weekly time chart. Speech/audio sessions record elapsed foreground time when paused or completed; manual sessions support reading away from the app.

- Read an ayah, or use Recall & recite to reveal words progressively as they are recognized.
- Reveal the next word as a hint, reveal the full ayah, or reset an attempt.
- Inspect the browser transcript when checking possible mistakes.
- Browse all 114 surahs when AlQuran Cloud is reachable; four starter chapter entries remain available offline.
- Al-Faatiha text is bundled offline. Other surahs require an internet connection.
- Listen to individual ayahs recited by Mishary Alafasy through Islamic Network, with 1, 3, 5 or 10 repeats.
- Experimental Arabic speech recognition highlights recognized matching words green and possible mismatches red, with a brief tone when a final transcript contains a mismatch.
- Mark memorized verses and review progress, saved only on the current browser/device.

## Speech limitations

Use a browser supporting SpeechRecognition or webkitSpeechRecognition, over HTTPS (or localhost for development), with microphone permission. Browser speech processing may use the browser provider's servers. Availability varies by browser and device. No audio is uploaded by this app's own code.

Comparison aligns normalized recognized words against a prefix of the current ayah. It flags possible omitted or substituted words and counts extra or repeated words. It can misidentify omissions, repetitions and recognition errors; it does not detect tajweed or evaluate pronunciation. Unspoken trailing words remain pending until you explicitly choose **Finish & review**, which marks the unrecited ending as possibly missed. Final recognition transcripts with mismatches are saved locally for review. Correcting the transcript in the same attempt updates its feedback; a retry begins a separate attempt. It is not a replacement for a qualified Quran teacher or a specialist Quran speech model. Actual microphone recognition has not been validated in this cloud environment.

This is a mobile-friendly web application, not a native Android/iOS package or a production equivalent of Tarteel. Specialist recitation recognition, accounts, cloud sync and native packaging require additional work.

## External services

Allow `api.alquran.cloud` for Quran text and the surah catalog; `cdn.islamic.network` for audio. Arabic and Latin fonts are bundled with the application; their licenses are included in `public/licenses`. No credentials are required. The UI shows recoverable errors if a chapter or audio cannot load.

## Validation

The production build and 20 automated tests pass. Tests cover comparison classifications, final-attempt handling, streak calculations, reader reveal states, bookmarking, feedback persistence/deletion, audio repeats, manual activity logging, search navigation and offline failures. Speech and search responses in interaction tests are simulated.

Chromium checks at 390px mobile and 1440px desktop widths passed navigation checks with no page errors; mobile screens had no horizontal overflow. Real microphone recognition on iPhone, live Quran API responses and audio service availability remain unverified in this cloud environment. These external services were blocked by its network policy. The app reports loading and connection errors rather than fabricating results.

## Publish to GitHub Pages

Build with the repository path before publishing the contents of `dist`:

```sh
npm run build -- --base=/Hifdh/
```

The `gh-pages` branch contains the static deployment. GitHub Pages must be enabled with **Deploy from a branch → gh-pages → / (root)**. Changes to `main` do not automatically rebuild that branch.
