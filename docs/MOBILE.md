# Hifdh mobile builds

The same Quran reader now has bundled Android and iOS projects using Capacitor 7. The browser app remains available. Native speech uses a local bridge to Android SpeechRecognizer or Apple Speech, with `ar-SA`, live partial events and explicit final events. It preserves safe feedback and does not establish reliable Quran pronunciation/tajweed judging. Audio can be processed by the operating system's speech provider online; this app does not store audio recordings or send them to its own server.

## Install on Android now

Download the **preview APK** from https://ameenvc.github.io/Hifdh/downloads/ on an Android phone, open it and allow that browser to install apps if prompted. This is a debug-signed test build, not a Play Store release. Its package is `com.ameenvc.hifdh.preview`. The app needs an installed speech service supporting Arabic, microphone permission and possibly connectivity for recognition. Reciter audio is online. Reading, full-verse meanings and study data are bundled in the native APK.

The web browser's existing progress is not transferred into the app: each has separate local storage. Preview builds produced on another machine can have a different debug certificate; uninstall the previous preview if Android reports incompatible signatures. Uninstalling clears its local progress. A production release must use a stable private signing key, which is not stored in this repository.

## Rebuild Android

Requires Node 22+, JDK 21, Android SDK platform 35/build-tools 35.0.0, and an Android SDK location configured through `ANDROID_HOME` or Android Studio. Use the platform SDK manager for the normal Android SDK licence setup.

```sh
npm ci
npm test
npm run android:apk
```

Output: `artifacts/Hifdh-preview.apk` and its SHA-256 checksum. `npm run android:open` opens the project in Android Studio. The generated wrapper runs Gradle; `android/local.properties`, local SDKs, build outputs and signing material are ignored.

On GitHub, use **Actions → Build mobile previews → Run workflow → android** to produce a downloadable preview artifact without an Android Studio installation. That artifact is private when the repository is private. The workflow does not publish or sign a Play Store release.

## iPhone without a Mac or Apple account

Open https://ameenvc.github.io/Hifdh/ in Safari, select Share → Add to Home Screen. The manifest and Apple touch icon support a standalone home-screen view. This is an installable website, not a native iOS binary; it needs connectivity and browser speech support. No offline service worker is installed.

## Native iOS project

The Xcode project is `ios/App/App.xcodeproj`. It includes a local Apple Speech bridge, microphone and speech usage descriptions, and the branded app icon. On a Mac with Xcode 16+:

```sh
npm ci
npm run mobile:sync
npm run ios:open
```

Choose an Apple development team in Xcode before installing on a physical iPhone. TestFlight/App Store distribution needs Apple Developer membership and release signing. Never put Apple passwords, certificates, API keys or signing profiles in source control. The optional GitHub workflow `ios` job builds **only an unsigned simulator app**, which cannot be installed on an iPhone. The iOS native code has not been compiled or tested in the Linux environment; its workflow must run on macOS to validate it.

## Web publishing and native assets

`npm run build` produces `dist` for web publishing. `npm run mobile:sync` separately builds `native-dist` with root-relative assets and copies it into the native projects. Grammar/translation data and fonts are bundled. The PWA manifest and app icons are also shipped on the website.

`npm run deploy:pages` builds and publishes the website and, if `artifacts/Hifdh-preview.apk` exists, updates the public APK download. It preserves existing `downloads/` during later web-only deployments. Do not delete that directory when updating Pages. Rebuild native apps separately after web changes; deployed website changes do not update an installed APK automatically.

## Verification limits

Android compilation/signature checks and synthetic speech adapter tests do not verify actual device microphone routing, language packs, audible alerts, battery behaviour or speech accuracy. Check permission grant/denial, both recitation modes, backgrounding, reconnects and alert audio on physical phones before treating this as a production mobile release. Existing data-source and translation licences remain bundled and apply to native distribution too.
