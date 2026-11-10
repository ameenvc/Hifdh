import { Capacitor, registerPlugin } from "@capacitor/core";

// Keep native final/partial boundaries: only a native final callback may commit
// speech. Android's end-of-speech signal alone is not a final transcription.
export function createNativeRecognition(plugin) {
  let sequence = 0;
  return class NativeRecognition {
    lang = "ar-SA";
    interimResults = true;
    continuous = true;
    maxAlternatives = 1;
    _active = false;
    _handles = [];
    start() {
      if (this._active) throw new Error("Recognition already started");
      this._active = true;
      const id = (this._id = `hifdh-${Date.now()}-${++sequence}`);
      const valid = () => this._active && this._id === id;
      const remove = (handles) =>
        handles.forEach((h) => Promise.resolve(h.remove()).catch(() => {}));
      const end = () => {
        if (!valid()) return;
        this._active = false;
        remove(this._handles);
        this._handles = [];
        this.onend?.();
      };
      const error = (code) => {
        if (valid()) {
          this.onerror?.({ error: code });
          end();
        }
      };
      (async () => {
        const permission = await plugin.requestPermissions();
        if (!valid()) return;
        if (!permission.granted) {
          error("not-allowed");
          return;
        }
        const available = await plugin.available({ language: this.lang });
        if (!valid()) return;
        if (!available.available) {
          error("service-not-allowed");
          return;
        }
        const handles = await Promise.all([
          plugin.addListener("speechResult", (event) => {
            if (
              !valid() ||
              event.sessionId !== id ||
              (!event.isFinal && !this.interimResults)
            )
              return;
            const result = Object.assign(
              [
                {
                  transcript: event.transcript || "",
                  confidence: event.confidence || 0,
                },
              ],
              { isFinal: event.isFinal === true },
            );
            this.onresult?.({ resultIndex: 0, results: [result] });
          }),
          plugin.addListener("speechError", (event) => {
            if (event.sessionId === id) error(event.error || "audio-capture");
          }),
          plugin.addListener("speechEnded", (event) => {
            if (event.sessionId === id) end();
          }),
        ]);
        if (!valid()) {
          remove(handles);
          return;
        }
        this._handles = handles;
        await plugin.start({
          sessionId: id,
          language: this.lang,
          partialResults: this.interimResults,
        });
        if (valid()) this.onstart?.();
        else await plugin.stop({ sessionId: id });
      })().catch((e) =>
        error(
          e?.code === "PERMISSION_DENIED" ? "not-allowed" : "audio-capture",
        ),
      );
    }
    abort() {
      if (!this._active) return;
      const id = this._id;
      this._active = false;
      this._handles.forEach((h) => Promise.resolve(h.remove()).catch(() => {}));
      this._handles = [];
      Promise.resolve(plugin.stop({ sessionId: id })).catch(() => {});
      this.onend?.();
    }
    stop() {
      this.abort();
    }
  };
}
export function installNativeSpeech(target = window) {
  if (!Capacitor.isNativePlatform()) return false;
  target.SpeechRecognition = createNativeRecognition(
    registerPlugin("QuranSpeech"),
  );
  return true;
}
