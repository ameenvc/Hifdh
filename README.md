# Hifdh

A responsive Quran memorization web app for mobile and desktop browsers.

## Run

Requires Node.js 20.19+ or 22.12+.

```sh
npm ci
npm run dev -- --port 5173
```

`npm test` checks Arabic normalization and word comparison. `npm run build` creates the production site in `dist`; `npm run preview` serves it locally.

## Features

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

Comparison aligns normalized recognized words against a prefix of the current ayah. It flags possible omitted or substituted words and counts extra or repeated words. It can misidentify omissions, repetitions and recognition errors; it does not detect tajweed or evaluate pronunciation. Unspoken trailing words remain pending. It is not a replacement for a qualified Quran teacher or a specialist Quran speech model. Actual microphone recognition has not been validated in this cloud environment.

This is a mobile-friendly web application, not a native Android/iOS package or a production equivalent of Tarteel. Specialist recitation recognition, accounts, cloud sync and native packaging require additional work.

## External services

Allow `api.alquran.cloud` for Quran text and the surah catalog; `cdn.islamic.network` for audio. Optional typography loads from `fonts.googleapis.com` and `fonts.gstatic.com`, with system font fallbacks. No credentials are required. The UI shows recoverable errors if a chapter or audio cannot load.

## Validation

Production build and eight automated comparison tests pass. A DOM smoke check exercised offline rendering, hide/reveal, verse navigation, progress persistence, library navigation, simulated speech mismatch highlighting, progressive recall, hints, retry reset, audio repetitions and cancellation. Real-browser visual and microphone testing remain unverified because browser downloads and external Quran requests were blocked by the cloud network policy during implementation.
