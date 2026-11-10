import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}

// The custom bridge registers the local speech plugin in the bundled app.
class QuranBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(QuranSpeechPlugin())
    }
}

import Speech
import AVFoundation

@objc(QuranSpeechPlugin)
public class QuranSpeechPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "QuranSpeechPlugin"
    public let jsName = "QuranSpeech"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]
    private var sessionID: String?
    private var engine: AVAudioEngine?
    private var request: SFSpeechAudioBufferRecognitionRequest?
    private var task: SFSpeechRecognitionTask?
    private var recognizer: SFSpeechRecognizer?
    private var inactiveObserver: NSObjectProtocol?
    private var tapInstalled = false

    public override func load() {
        inactiveObserver = NotificationCenter.default.addObserver(forName: UIApplication.willResignActiveNotification, object: nil, queue: .main) { [weak self] _ in
            guard let self = self, let id = self.sessionID else { return }
            self.notifyListeners("speechError", data: ["sessionId": id, "error": "aborted"])
            self.finish(id)
        }
    }
    deinit { if let observer = inactiveObserver { NotificationCenter.default.removeObserver(observer) } }

    @objc public func requestPermissions(_ call: CAPPluginCall) {
        SFSpeechRecognizer.requestAuthorization { status in
            guard status == .authorized else { call.resolve(["granted": false]); return }
            AVAudioSession.sharedInstance().requestRecordPermission { granted in call.resolve(["granted": granted]) }
        }
    }
    @objc public func available(_ call: CAPPluginCall) {
        let recognizer = SFSpeechRecognizer(locale: Locale(identifier: call.getString("language") ?? "ar-SA"))
        let local = call.getBool("onDeviceOnly") ?? true
        call.resolve(["available": (recognizer?.isAvailable ?? false) && (!local || (recognizer?.supportsOnDeviceRecognition ?? false))])
    }
    @objc public func start(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            guard SFSpeechRecognizer.authorizationStatus() == .authorized,
                  AVAudioSession.sharedInstance().recordPermission == .granted else {
                call.reject("Speech and microphone permission required", "PERMISSION_DENIED"); return
            }
            guard let id = call.getString("sessionId"),
                  let recognizer = SFSpeechRecognizer(locale: Locale(identifier: call.getString("language") ?? "ar-SA")), recognizer.isAvailable else {
                call.reject("Arabic speech recognition unavailable"); return
            }
            let local = call.getBool("onDeviceOnly") ?? true
            if local && !recognizer.supportsOnDeviceRecognition {
                call.reject("On-device speech unavailable", "ON_DEVICE_UNAVAILABLE"); return
            }
            self.cleanup()
            self.sessionID = id
            self.recognizer = recognizer
            do {
                let audio = AVAudioSession.sharedInstance()
                try audio.setCategory(.playAndRecord, mode: .measurement, options: [.defaultToSpeaker, .duckOthers])
                try audio.setActive(true)
                let engine = AVAudioEngine()
                let request = SFSpeechAudioBufferRecognitionRequest()
                request.shouldReportPartialResults = true
                request.requiresOnDeviceRecognition = local
                self.engine = engine; self.request = request
                let input = engine.inputNode
                let format = input.outputFormat(forBus: 0)
                guard format.sampleRate > 0, format.channelCount > 0 else { throw NSError(domain: "HifdhAudio", code: 1) }
                input.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in request.append(buffer) }
                self.tapInstalled = true
                engine.prepare(); try engine.start()
                self.task = recognizer.recognitionTask(with: request) { [weak self] result, error in
                    DispatchQueue.main.async {
                        guard let self = self, self.sessionID == id else { return }
                        if let result = result {
                            self.notifyListeners("speechResult", data: ["sessionId": id, "transcript": result.bestTranscription.formattedString, "isFinal": result.isFinal])
                            if result.isFinal { self.finish(id); return }
                        }
                        if let error = error {
                            let code = (error as NSError).code == 1110 ? "no-speech" : "audio-capture"
                            self.notifyListeners("speechError", data: ["sessionId": id, "error": code])
                            self.finish(id)
                        }
                    }
                }
                call.resolve()
            } catch {
                self.cleanup(); call.reject("Could not start the microphone", nil, error)
            }
        }
    }
    @objc public func stop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            if call.getString("sessionId") == nil || call.getString("sessionId") == self.sessionID { self.cleanup() }
            call.resolve()
        }
    }
    private func finish(_ id: String) {
        cleanup(); notifyListeners("speechEnded", data: ["sessionId": id])
    }
    private func cleanup() {
        sessionID = nil
        if let engine = engine { engine.stop(); if tapInstalled { engine.inputNode.removeTap(onBus: 0) } }
        tapInstalled = false
        request?.endAudio(); task?.cancel()
        engine = nil; request = nil; task = nil; recognizer = nil
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}
