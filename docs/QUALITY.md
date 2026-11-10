# Hifdh quality assessment

Assessed on 1 November 2026. Scope: the production web build, Quran data integrity, reader navigation, mobile layout, browser-assisted practice, automated accessibility and dependency advisories.

**Conclusion:** the checked reading and navigation workflows pass. The app supports Quran reading and assisted memorization; it is **not a validated automatic recitation assessor**. Passing simulated speech tests does not establish accuracy on real recitation.

## Evidence

| Area                         | Result                                   | Evidence and limits                                                                                                                                                                                                                                                                                                                    |
| ---------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Functional checks            | Pass                                     | All 71 automated tests passed. Includes surah selection, page and ayah navigation, consistent arrows/keys/swipes, page boundaries, bookmarks, local progress, audio controls and unconfirmed feedback handling.                                                                                                                        |
| Quran data                   | Pass for integrity                       | Source checksums match the pinned Tanzil snapshots. All 114 surahs and 6,236 ayahs are covered exactly once by the 604 standard pages. Bismillah and numbering exceptions are checked. This is not an independent scholarly review of every character.                                                                                 |
| Mobile and desktop layout    | Pass for checked layouts                 | Chromium production checks at widths 320, 390, 889 and 1440 pixels in white and black themes. The new selector is visible, chooses Yunus directly, and the selected page fits without clipping or horizontal overflow. Previous and Next buttons and keyboard navigation reach the expected pages.                                     |
| Accessibility automation     | No reported violations in checked states | Axe-core checks for WCAG 2 A/AA, WCAG 2.1 AA and best practices across reader, controls, memorization, library, progress, search, review and settings in both themes: 16 baseline states plus 7 new finder/challenge states. Some checks remain manual/incomplete. This is not a WCAG certification or an actual VoiceOver assessment. |
| Runtime errors               | None observed                            | No page errors in the production-browser assessment. This covers the checked paths, not every possible device or state.                                                                                                                                                                                                                |
| Dependencies                 | No known advisories reported             | `npm audit --json` reported zero known vulnerabilities. This is a registry advisory check, not a security penetration test.                                                                                                                                                                                                            |
| Build                        | Pass                                     | `npm run build -- --base=/Hifdh/` succeeds.                                                                                                                                                                                                                                                                                            |
| Automatic recitation judging | Not ready                                | Browser speech transcription can mishear correct Quran. Safe feedback is the default; automatic red alerts remain an explicitly experimental option. A validated Quran-specific recognition backend is still needed for dependable automatic judging.                                                                                  |

## Defects corrected in this assessment

- Added a directly accessible surah selector at the top of the reader, covering all 114 surahs and preserving Read/Memorize mode.
- Made page and ayah arrows consistent: **Previous ←**, **Next →**. Right-arrow keys and leftward swipes advance; left-arrow keys and rightward swipes go back. Arabic Quran text remains right-to-left.
- Limited theme click handlers to theme buttons. Previously, clicks could also trigger handlers attached to the page body and redraw the reader, disrupting inputs and native controls.
- Added an accessible page heading and proper labels for hidden-word placeholders.
- Increased contrast for chapter numbers, library labels and the search field label in white view.
- Corrected activity-chart semantics so the date/session labels have a valid accessible role.

## Responsive button alignment

The reference-inspired palette and typography update was also checked with the same layout suite: white paper, gray bars, teal actions, green markers, a decorative green/gold chapter frame and adaptive Amiri text. A 390×844 production screenshot of Maryam page 305 was visually inspected. The surah title retains a readable minimum size independently of fitted body text.

- Fixed top toolbar alignment by sharing button/select heights and grid positions.
- Gave Previous and Next equal widths and centered the page counter independently of their labels.
- Anchored the compact bottom icon and its dropdown to the reader’s right inset at every checked width. Dropdown actions share column widths, row heights and icon alignment.
- Standardized challenge and review action sizing, with stacked actions on narrow phones.
- `npm run test:layout` passed exact geometry checks at 320×568, 390×844, 520×844, 521×844, 768×1024, 850×844, 851×844, 1024×768, 1440×900, 1920×1080 and 844×390. Both themes and reading/recitation modes were checked, plus challenge actions at five widths. There were no horizontal overflows or browser runtime errors. Recognition was mocked to enter recording mode; this does not test real microphone behavior.
- These are Chromium checks, not physical iPhone/Safari validation. The 71 existing automated tests also pass, and the dependency audit reports zero vulnerabilities.

## Start-anywhere and ayah challenges

- **Start anywhere:** the bottom controls can listen for an Arabic phrase and locate its source surah, ayah, starting word and standard page. It matches recognized text against the bundled corpus, including starts in the middle of an ayah. It does not judge pronunciation.
- **Ambiguity handling:** common phrases show candidate references and ask for more context. No approximate page is silently chosen when there is no exact unique text match. Optional opening invocations and spoken disconnected-letter names are handled. Short distinctive ayahs such as Al-Ikhlas 112:1 are covered by regression tests.
- **Continue-after-an-ayah:** the default challenge shows a full ayah and hides what follows. It can use a chosen or random prompt within the selected surah. An optional partial-ayah mode shows opening words and hides the rest of that ayah.
- **Comparison boundaries:** starting mid-ayah or from a partial prompt does not label the earlier, unrecited words as missed. Hint, reveal and reference audio controls remain available. No automatic memorization score is produced.
- **Additional layout checks:** both themes at widths 320, 390, 889 and 1440. Short-phone (320×568), landscape (844×390), tablet (889×1293) and desktop (1440×900) stress checks verify that the controls remain reachable and no horizontal overflow is introduced. Long prompt ayahs scroll inside the exercise instead of shrinking into unreadable text.
- **Accessibility checks:** the challenge setup, full prompt in both themes, ambiguous location suggestions, located mid-ayah state and partial prompt reported no automated violations in the tested axe-core rules. These checks do not replace physical-device/VoiceOver testing.

Passage finding depends on what the browser recognizes. Misheard or unsupported orthography can prevent a match, and an incorrectly recognized unique phrase can still point to the wrong location. Actual voice matching accuracy has not been established; users can always select a surah or ayah manually. The phrase-length/uniqueness rules are text heuristics, not calibrated acoustic confidence.

## Remaining limitations and priorities

1. **High: real recitation accuracy.** Obtain a Quran-specific recognition service/model and validate with actual speakers, recitation styles and iPhone recordings before advertising reliable automatic error detection. Do not replace this validation with mocked transcripts.
2. **Medium: actual iPhone checks.** Native Safari/VoiceOver navigation, microphone recognition, media routing and audible warnings still need testing on a physical iPhone. Headless Chromium cannot establish these outcomes.
3. **Medium: initial payload.** The build reports about 342 KB gzipped JavaScript and 14 KB gzipped CSS, plus bundled fonts. The complete Quran corpus is intentionally loaded with the app so text and phrase search do not need a remote Quran API. The build emits a large-chunk warning. Actual slow-network/device load performance has not been measured.
4. **Medium: local-only records.** Bookmarks, progress and feedback live in browser storage. They are not synchronized or backed up to an account; clearing site data can remove them.
5. **Manual accessibility review.** Automated checks do not establish Arabic screen-reader pronunciation, usability of fitted text on every page, or complete touch-target suitability. Some inline ayah markers are intentionally compact. Review with actual assistive technology remains necessary.

## Reproduction

```sh
npm ci
npm test
# Requires system Chromium or: npx playwright install chromium
npm run test:layout
npm run build -- --base=/Hifdh/
npm run preview -- --port 4173 --base=/Hifdh/
npm audit --json
```

Browser checks were run against that local production build with Chromium/Playwright and axe-core. Recognition and review fixtures were synthetic; no real microphone recordings or user secrets were used. The assessment does not establish that GitHub Pages has finished deploying or that external reciter audio is currently reachable.

## Recitation access and microphone continuity — 5 November 2026

Added a visible Check my recitation button and live feedback outside the secondary dropdown. Browser-ended sessions reconnect with finalized transcript and passage cursor preserved; three consecutive empty sessions stop retries. Pausing cancels pending reconnects, and permission/device errors do not retry automatically. All 74 automated tests pass, including reconnect continuity, cancellation and denied-permission cases. The responsive layout suite also checks the persistent button in both themes and reader/reciting modes. This improves browser session handling, not acoustic recognition accuracy. Real microphone accuracy and physical iPhone behavior remain unverified.

## Red text and sound — 5 November 2026

At user request, red text alerts are enabled by default for finalized browser text mismatches, with the warning tone when sound is on. Existing saved feedback preferences are respected; the controls menu labels the setting Red alerts on/off. Interim guesses remain quiet, and recitation can continue after a mismatch. Safe feedback remains selectable. The 75-test suite includes default red marking and tone dispatch as well as safe-mode suppression. These alerts remain experimental and do not establish that the speaker made an actual mistake. Physical iPhone audibility remains unverified. This supersedes earlier default-safe statements in this dated report.

## Grammar and repeated-word study — 5 November 2026

Added optional corpus-backed word details (desktop hover, phone tap and keyboard), segmented part-of-speech/root/lemma/tense/case tags, and repeated-spelling colours with exact normalized-word occurrence counts. Study tools are in the bottom dropdown and their preferences persist. The card is positioned above/below its word to avoid blocking the hover/tap target; Escape or Close dismisses it. No hidden memorization words receive interactive study annotations. Red mismatch text takes precedence over study colours.

The unmodified Quranic Arabic Corpus v0.4 source is pinned with provenance, copyright notices and GPL terms. Generated mappings require identical word counts and normalized spelling at the same position. 77,104 of 77,433 displayed words match; 329 are withheld. Full-Quran tests verify all attached word positions, source checksum, Bismillah offsets, disconnected letters, and Fatiha verb roots/lemmas. These are corpus annotations, not a full sentence iʿrāb analysis or an independent scholarly review.

All 79 automated tests pass. `npm run test:study` checks phone tap, desktop hover, root/imperative details, both themes, repeated colours, red-alert precedence, unchanged Quran display text and hidden-word protection. The existing 11-viewport layout suite also passes. These are Chromium checks; actual iPhone/Safari and assistive-technology behavior remain unverified. Grammar data is fetched per displayed surah only when enabled (about 3 KB for Fatiha, up to 617 KB raw for Baqarah), and needs connectivity on first access. The retained source and all lookup files add about 14 MB to deployed assets, without adding them to the initial JavaScript bundle.

## Study-tool discoverability — 5 November 2026

Grammar and Repeated words now have directly visible buttons below Read/Memorize, in addition to the bottom menu. The study browser regression uses those visible buttons to enable both features and open verb details. Existing word-study and 11-viewport layout checks pass for this placement.

## Default study tools — 5 November 2026

Grammar and repeated-word colours now start enabled, including a one-time upgrade from the old opt-in preferences. Subsequent choices to disable either tool persist under the new versioned preference. The study browser regression checks initial enabled controls, word details and colours, then disables both and verifies the saved disabled state after reload.

## Consistent Quran text size — 5 November 2026

Removed per-page font shrinking. All Quran pages now use the selected text size, including after screen resizing; dense pages scroll inside the current page instead of changing font size. Page navigation and the fixed controls remain available. Production browser regression checks a selected 30px size across Fatiha, Baqarah, Maryam, An-Nas, a subsequent page, and a phone-to-tablet resize, plus scrolling access on a dense page. This supersedes earlier automatic-fit findings and expectations of no local vertical scrolling.

## Meanings and minimal reader — 5 November 2026

The reader now starts in full-screen focus view. Read/Memorize, study toggles, sound and attribution are available through settings/menu, leaving a compact top toolbar and microphone/page/menu dock. The Tanzil link is removed from the main reader and retained in an About disclosure inside settings, along with the required source/license information. The word card shows an English gloss above morphology, including when grammar/colour overlays are disabled. The source translation module is retained unchanged, pinned by commit and SHA-256, with Hablullah attribution and CC BY-NC-ND 4.0 terms. It is fetched only when a word card opens, about 2.5 MB raw; real-device download performance is unmeasured.

All 80 automated tests pass. Source integrity and meaning availability are checked for all 77,104 aligned corpus word positions, plus known Fatiha glosses. Production browser checks verify the Guide us meaning on phone tap, default minimal view, hidden extra controls, consistent text size, and no main-reader Tanzil link. The 11-viewport layout regression checks compact paging, toolbar and controls in both themes. Phone screenshots of the reader and meaning card were visually inspected in Chromium; physical Safari remains unverified. These brief word glosses are source-backed, not independent scholarly verification or a replacement for tafsir.

## Full ayah meanings and grammar grouping — 5 November 2026

Ayah markers now open an accessible native dialog with the full English translation of that ayah, identifying Marmaduke Pickthall (1930). The unchanged public-domain translation is pinned with provenance/checksum. All 114 surah counts and 6,236 sequential Hafs verse references are checked; no Bismillah renumbering is introduced. The roughly 1 MB raw translation file loads on first ayah tap and is reused. Existing marker selection/pause behavior is preserved. Arabic text is omitted from the dialog in Memorize mode to avoid revealing hidden Arabic. Escape closes and returns focus to the marker; page shortcuts do not run while the dialog is open. A failed load has a retry-on-reopen message.

Word cards show the main stem first, with articles and other attached segments preserved in a closed disclosure. The corpus data itself is unchanged. The 82 automated tests pass, including full-translation checksum/counts and article/attached-pronoun grouping. Browser study checks cover full Fatiha 1:6 meaning, translator credit, dialog Escape/focus, suppressed background page navigation, no hidden Arabic disclosure in Memorize mode, and opening article details. The existing layout checks also pass. Physical Safari and screen-reader behavior remain unverified.

## Recitation mode access — 5 November 2026

The main microphone button now opens a Normal recitation / Hifdh chooser instead of silently using the last mode hidden in settings. Choosing either option starts recognition directly from that user gesture; the active mode is visible above the dock. A tap during listening still pauses directly. The 84 automated tests pass. Production browser checks exercise both choices on a phone viewport with mocked speech: normal text stays visible, Hifdh words are hidden, and both enter listening state. Actual iPhone microphone recognition remains unverified.

## Faster live reveal — 5 November 2026

Previously only finalized speech advanced across ayahs, which could leave Hifdh text hidden until a browser finalized several ayahs together. Added a separate reversible visual preview that reveals matched interim words across exact completed ayahs and previews the next page when needed. Revisions replace the preview; pausing discards it. Finalized transcripts still control saved feedback, tones and committed progression. Interim mismatches neither turn red nor advance through uncertain completed ayahs. Scrolling follows the latest matched word instead of the bottom of a long verse.

All 86 automated tests pass. New interaction regressions cover three ayahs in one interim result, rollback on revision, finalization without duplicate advancement, and provisional page turning without committed progress. The production study browser suite also exercises multi-ayah interim reveal in Hifdh mode. These use synthetic recognition events; actual acoustic accuracy or provider latency has not been measured. Browsers that delay or omit interim events may still reveal text late; the app cannot make the recognition provider deliver speech sooner.

## False red feedback reported on Yunus — 5 November 2026

The screenshot reports correct recitation flagged red. The exact browser transcript/audio is unavailable, so the acoustic or alignment cause has not been established. Existing accurate written Yunus regressions pass; this does not establish microphone accuracy. This update changes feedback presentation, not the speech recognizer: default feedback treats text differences as unconfirmed with neutral dotted marks, without red error labels or tones. Previous automatic-alert preferences migrate to this safer default. Optional automatic red alerts remain clearly experimental. Manually confirmed mistakes still turn red and can sound. Fast interim reveal remains enabled.

All 87 automated tests pass, including a simulated misrecognized Yunus word under a legacy alert preference, neutral feedback, no tones, direct Review access, and an unconfirmed review record. The production study browser check verifies a revised finalized transcript creates uncertain marks and a visible Review recognized text action rather than red mistakes. These checks do not solve or validate real-speech accuracy. The exact user transcript is requested for further diagnosis; dependable automatic Quran error detection still requires a validated Quran-specific recognition backend. This section supersedes earlier default-red behavior in this report.

## Verb forms and model patterns — 10 November 2026

Verb cards now show a dedicated form number and Arabic model pattern, using explicit corpus form tags or the corpus convention that an unmarked verb with a three/four-radical root is Form I. Triliteral and quadriliteral numbering use separate pattern tables. Form I’s vowel subclass is not inferred; the card explains this. Rare Form XII retains its corpus number without inventing an unsupported pattern. Model patterns are distinguished from the surface spelling, imperative/past/present and passive inflection. The underlying corpus data and Quran text remain unchanged.

All 89 automated tests pass, including Fatiha’s imperative Form I, Form X, Form IV, a quadriliteral verb, noun exclusion and missing/rare annotations. The word-study browser regression verifies that the verb card shows Form I and an Arabic model pattern alongside its existing meaning/root/lemma. Actual scholarly validation of the corpus analyses remains outside these checks.

## Compact word card — 10 November 2026

Moved lemma/base form, raw feature tags, model-pattern notes, count explanations and source links into a closed More details disclosure. The visible card keeps meaning, word type, root, verb form, tense and a shorter repetition count. Source/license attribution remains accessible. The production browser regression verifies attribution is initially hidden, expands on demand and can be collapsed again, alongside the existing word/verse/mode checks. Quran and corpus data are unchanged.

## Word-card colour hierarchy — 10 November 2026

Redesigned the card with labelled mint meaning, blue root, purple form and amber tense sections, plus neutral reference/count chips at the top. Technical details and attribution remain collapsed. Both light and dark versions were visually inspected at a phone viewport. The production study browser suite passes. Computed contrast ratios for the five section text/background pairs range from 6.26:1 to 7.67:1 in white view and 9.28:1 to 10.06:1 in black view. These checks cover those sections, not a full accessibility audit. Quran text, grammar data and recitation logic are unchanged.

## Larger Arabic and restrained card palette — 10 November 2026

Replaced the multicolour word-card sections with teal meaning accents and neutral grammar rows. Arabic is wrapped in language/direction-isolated Amiri spans: 44px title, 28px root/grammar text (26px segment line), and a separate 32px model-pattern line. English labels retain smaller sans-serif text. Tap/keyboard activation uses more of the reading region, keeping the close button and dock accessible; hover positioning still avoids covering its target. The browser regression passes and verifies the Arabic font sizes and pattern language. Both phone themes were visually inspected. Computed text contrast is at least 8.73:1 for the sampled meaning/title/root/pattern/tense text in white view and 10.61:1 in black view. These checks are not a full accessibility audit. Corpus data, Quran text and recognition behavior are unchanged. This supersedes the preceding five-colour card palette.

## Single Form I pattern — 10 November 2026

Removed the three generic Form I alternatives from the card. One past-stem pattern is now selected from the middle-radical vowel only when a three-letter source lemma matches the root. Missing vowels and contracted forms such as قال do not receive a guessed pattern. This identifies the past-stem model, not the present-tense vowel class. The 90 automated tests pass, covering the real Nisa 4:1 خلق example, all three middle-vowel alternatives and unsupported cases. The production browser regression opens خلقكم in Nisa and verifies that only فَعَلَ appears. Quran and corpus data are unchanged.

## Harakat in word cards — 10 November 2026

Added harakat to the controlled Arabic grammar labels, including parts of speech, tense, voice and case/mood. Source Quran words, corpus segments, lemmas and patterns retain their original characters. Roots are presented as separated radical letters rather than vowelled as invented words. All 91 automated tests pass, including vowelled verb/noun/imperative/genitive labels and unchanged source root/lemma values. The production browser check verifies visible harakat labels and the root-letter display. This is UI label vocalization, not automatic diacritization of arbitrary or incomplete corpus text.

## Vowelled base word and structured card — 10 November 2026

Replaced the main separated-radical field with Base word using the original source lemma and its harakat; missing lemmas show Not supplied. Raw radicals remain in More details. The selected word and metadata are centered, meaning has its own section, and base word / verb pattern share aligned panels (stacked below 360px), followed by tense and collapsed extras. The source lemma is labelled Base word rather than conflated with abstract root letters. The production browser regression verifies هَدَى and خَلَقَ, equal paired-panel positions at phone width, and existing meaning/grammar workflows. Both themes were visually inspected; sampled text contrast remains at least 8.73:1 in white view and 10.61:1 in black view. Corpus and Quran source data are unchanged.
