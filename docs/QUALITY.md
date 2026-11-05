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
