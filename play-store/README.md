# Hifdh Google Play release preparation

Status: signed release candidate prepared, **not submitted or approved**. Version 1.0.1 (code 2), package `com.ameenvc.hifdh`, target API 36. Free, no ads, no in-app payments. Audience: all ages including children. Public support: info@setilas.com. Choose the actual verified developer display name during account setup; none is invented here.

## Files to upload

- `artifacts/play-store/Hifdh-release.aab`: signed upload bundle. Use this, not the debug preview APK.
- `play-store/en-US/`: title, short/full description and release notes.
- `play-store/graphics/`: original 512px icon, 1024×500 feature graphic and four 1080×1920 phone screenshots. Captured from the actual bundled web interface in Chromium; validate against physical Android before uploading.
- Public privacy policy: https://ameenvc.github.io/Hifdh/privacy.html (version 1.0.1 onward).
- `app-access.txt`: reviewer access instructions.
- `data-safety-draft.json`: engineering draft, **not final Console answers**.

## Owner steps in Google Play Console

1. Register at https://play.google.com/console/ with the real publisher's Google account. Complete Google's registration payment, identity/contact and any device verification. Choose personal or organization based on the actual publisher; organization enrollment may require additional business verification. Do not share account passwords or identity documents in chat.
2. Resolve the readiness items below, then create Hifdh, English, app, free. Confirm the permanent application ID before first upload. Use Google Play App Signing; preferably let Google generate/manage the app signing key and use this project's separate upload key.
3. Upload the AAB to internal testing first. Complete the listing, privacy URL, app access, content rating questionnaire, no-ads declaration, and target audience. Select all applicable age groups including children truthfully; this triggers Families requirements. Do not describe this app as certified or approved.
4. Review microphone/provider behavior and complete Data safety based on observed behavior and provider terms. Do not automatically answer 'no data collected' just because there are no accounts: adult device/browser speech can send audio to a provider. Do not assert provider deletion, ephemeral processing or encryption without evidence.
5. Run real-device tests using TESTING.md. If Console requires closed testing before production access for your account, recruit real testers and satisfy the exact number/duration displayed by Console, then apply for production access. Internal testing alone may not satisfy this. No testers or testing days have been fabricated.
6. Recheck the target SDK requirement and all Console errors at submission time. This candidate targets API 36; the official requirements page could not be fetched from this environment, so current policy acceptance is not claimed. Review the pre-launch report and fix findings. Submit for review when all required evidence and declarations are complete.

## Readiness items before submission

- Account: not created; owner verification/payment and verified public developer identity pending.
- Physical Android tests: pending, including speech provider behavior, on-device Arabic support, permission denial, alerts, backgrounding, screen sizes and accessibility. Browser tests are not a substitute.
- Families: engineering restrictions implemented, but owner must verify the entire app/provider combination and applicable children's privacy obligations. Self-declared age range is not verified parental consent. Child/unknown/teen profiles have no browser cloud speech, no online reciter playback and no external links; native voice requires supported on-device recognition without cloud fallback. Where unavailable, manual memorization remains usable.
- Data safety: draft requires actual provider/network/retention verification. Review any provider processing, reference streaming and website hosting separately.
- Licences: read LICENSE-REVIEW.md. In particular, CC BY-NC-ND gloss use needs a publisher determination or permission where appropriate. Free/no ads does not by itself settle noncommercial scope. Grammar source archive is distributed with notices.
- Quran speech: general recognition is not validated tajweed or authoritative mistake detection. Default uncertain matches remain neutral; do not market guaranteed accuracy.

## Signing and future updates

The upload keystore and password are deliberately excluded from GitHub and public downloads. Private backup: `artifacts/private-signing-backup.zip`. Download it to secure storage; it contains both the PKCS12 key and its password, so the ZIP must be treated as a secret. Do not upload that backup to Play or attach it publicly. The public certificate `upload-certificate.pem` is safe to share when Console requests it.

For a future release, increment Android versionCode and versionName, retain the upload key, and set file paths (not password values) in the build environment:

```sh
HIFDH_UPLOAD_STORE_FILE=/private/path/hifdh-upload.p12 \
HIFDH_UPLOAD_PASSWORD_FILE=/private/path/upload-password.txt \
npm run android:aab
```

Requires Node, JDK 21 and Android SDK platform/build tools 36. The script refuses absent signing files; it never substitutes the debug key. Android preview uses the separate `.preview` package and is not the store release.
