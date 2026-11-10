# Physical-device release test plan

Pending: no physical-phone results are claimed. Record device/OS, recognizer provider/version, Arabic language pack, date, app version and actual outcome for each test. Use consenting adults for initial technical tests and follow applicable safeguards for any child participation. Do not upload identifiable recitations to issue trackers.

1. Install via Play internal testing; verify launch, package/version, no login, all 604 pages, Arabic glyphs, fixed font size, ayah translations and vowelled word cards. Test small/large phones, tablet, rotation, text scaling, light/dark, safe areas, accessibility labels and dialog focus.
2. Fresh data: read without an age prompt. Attempt voice, online playback and external links; verify neutral age choices. Under 13, teen, unknown/prefer-not must not route audio to cloud speech or start external playback/links. Verify no silent cloud fallback when Arabic on-device support is absent, airplane mode, OS support missing or language pack missing. Check policy remains readable offline in the native app.
3. Supported native child mode: verify Arabic on-device recognizer and inspect network behavior using development tools. Android 12+ API alone is insufficient; the device must actually support on-device recognition. Unsupported devices show the limitation and retain manual study.
4. Adult mode: grant/deny mic permission, switch age while listening, lock/background/return, stop/restart, disconnect/reconnect. Verify listening stops on background and privacy change. Verify both normal and Hifdh modes, prompt-ayah continuation, starting elsewhere, Bismillah, Alif Lam Mim and Fatiha. Record false positives/misses; uncertain speech is not proof of error. Manually confirm a mistake and verify red text plus audible alert at normal volume. No audio-file recording is implemented.
5. Verify local bookmarks/history/settings persist, can be cleared, and do not appear on another device. Test OS uninstall/reset behavior. Check permission prompts and privacy text match actual provider handling.
6. Verify each listing screenshot/description accurately represents the release. Review Play pre-launch accessibility/crash findings, Families/SDK checks, licences and Data safety with the actual publisher before production.

## Optional tester invitation template

Send manually only to people who agree to test; no invitations have been sent by this project.

“Please help test Hifdh, a free Quran reading and memorization app. If you agree, I will add your Google account to the Play test group and provide the opt-in link. Please test reading, word meanings, memorization and supported voice checking, and report your device/Android version and any issues to info@setilas.com. Voice matching is experimental; avoid sharing personal recordings. Participation and the actual testing period must follow the requirements shown in our Play Console.”
