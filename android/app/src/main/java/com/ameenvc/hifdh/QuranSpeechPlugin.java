package com.ameenvc.hifdh;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import com.getcapacitor.*;
import com.getcapacitor.annotation.*;
import java.util.ArrayList;

@CapacitorPlugin(name = "QuranSpeech", permissions = {
    @Permission(alias = "microphone", strings = { Manifest.permission.RECORD_AUDIO })
})
public class QuranSpeechPlugin extends Plugin {
    private SpeechRecognizer recognizer;
    private String session;

    @PluginMethod public void available(PluginCall call) {
        call.resolve(new JSObject().put("available", SpeechRecognizer.isRecognitionAvailable(getContext())));
    }
    @Override @PluginMethod public void requestPermissions(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) permissionResult(call);
        else requestPermissionForAlias("microphone", call, "permissionResult");
    }
    @PermissionCallback private void permissionResult(PluginCall call) {
        call.resolve(new JSObject().put("granted", getPermissionState("microphone") == PermissionState.GRANTED));
    }
    @PluginMethod public void start(PluginCall call) {
        if (getPermissionState("microphone") != PermissionState.GRANTED) { call.reject("Microphone permission required", "PERMISSION_DENIED"); return; }
        final String id = call.getString("sessionId");
        if (id == null) { call.reject("Session ID required"); return; }
        getActivity().runOnUiThread(() -> {
            cleanup(); session = id;
            try {
                recognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                recognizer.setRecognitionListener(new RecognitionListener() {
                    private boolean current() { return id.equals(session); }
                    private void result(Bundle bundle, boolean isFinal) {
                        if (!current()) return;
                        ArrayList<String> matches = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
                        if (matches != null && !matches.isEmpty()) notifyListeners("speechResult", new JSObject().put("sessionId", id).put("transcript", matches.get(0)).put("isFinal", isFinal));
                        if (isFinal) finish(id);
                    }
                    public void onReadyForSpeech(Bundle b) {}
                    public void onBeginningOfSpeech() {}
                    public void onRmsChanged(float f) {}
                    public void onBufferReceived(byte[] b) {}
                    public void onEndOfSpeech() {} // Wait for onResults, never promote a partial.
                    public void onResults(Bundle b) { result(b, true); }
                    public void onPartialResults(Bundle b) { result(b, false); }
                    public void onEvent(int type, Bundle b) {}
                    public void onError(int code) {
                        if (!current()) return;
                        String error = switch (code) {
                            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "not-allowed";
                            case SpeechRecognizer.ERROR_NO_MATCH, SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "no-speech";
                            case SpeechRecognizer.ERROR_NETWORK, SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "network";
                            case SpeechRecognizer.ERROR_CLIENT -> "aborted";
                            case SpeechRecognizer.ERROR_LANGUAGE_NOT_SUPPORTED, SpeechRecognizer.ERROR_LANGUAGE_UNAVAILABLE -> "language-not-supported";
                            default -> "audio-capture";
                        };
                        notifyListeners("speechError", new JSObject().put("sessionId", id).put("error", error)); finish(id);
                    }
                });
                Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, call.getString("language", "ar-SA"));
                intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
                recognizer.startListening(intent); call.resolve();
            } catch (Exception error) { cleanup(); call.reject("Could not start speech recognition", error); }
        });
    }
    @PluginMethod public void stop(PluginCall call) {
        String requested = call.getString("sessionId");
        getActivity().runOnUiThread(() -> { if (requested == null || requested.equals(session)) cleanup(); call.resolve(); });
    }
    private void finish(String id) { cleanup(); notifyListeners("speechEnded", new JSObject().put("sessionId", id)); }
    private void cleanup() {
        session = null;
        if (recognizer != null) { recognizer.cancel(); recognizer.destroy(); recognizer = null; }
    }
    @Override protected void handleOnPause() {
        if (session != null) { String id = session; notifyListeners("speechError", new JSObject().put("sessionId", id).put("error", "aborted")); finish(id); }
    }
    @Override protected void handleOnDestroy() { cleanup(); }
}
