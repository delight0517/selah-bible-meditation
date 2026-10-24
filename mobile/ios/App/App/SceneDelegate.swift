import UIKit
import Capacitor
import AVFoundation
import Vision
import ImageIO

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = SelahBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}

final class SelahBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(SelahBrightnessPlugin())
        bridge?.registerPluginInstance(SelahHandCameraPlugin())
    }
}

@objc(SelahHandCameraPlugin)
final class SelahHandCameraPlugin: CAPPlugin, CAPBridgedPlugin, AVCaptureVideoDataOutputSampleBufferDelegate {
    let identifier = "SelahHandCameraPlugin"
    let jsName = "SelahHandCamera"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise)
    ]

    private let captureQueue = DispatchQueue(label: "com.delight0517.selah.hand-camera")
    private var session: AVCaptureSession?
    private var lastFrameAt = 0.0

    @objc func start(_ call: CAPPluginCall) {
        let startCapture: () -> Void = { [weak self] in
            guard let self else { call.reject("카메라를 시작할 수 없습니다."); return }
            self.captureQueue.async {
                do {
                    if self.session?.isRunning == true { DispatchQueue.main.async { call.resolve() }; return }
                    let session = AVCaptureSession()
                    session.beginConfiguration()
                    session.sessionPreset = .vga640x480
                    guard let camera = AVCaptureDevice.default(.builtInWideAngleCamera, for: .video, position: .back) else {
                        throw NSError(domain: "SelahHandCamera", code: 1, userInfo: [NSLocalizedDescriptionKey: "후면 카메라를 찾을 수 없습니다."])
                    }
                    let input = try AVCaptureDeviceInput(device: camera)
                    guard session.canAddInput(input) else { throw NSError(domain: "SelahHandCamera", code: 2, userInfo: [NSLocalizedDescriptionKey: "카메라 입력을 연결할 수 없습니다."]) }
                    session.addInput(input)
                    let output = AVCaptureVideoDataOutput()
                    output.alwaysDiscardsLateVideoFrames = true
                    output.videoSettings = [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA]
                    output.setSampleBufferDelegate(self, queue: self.captureQueue)
                    guard session.canAddOutput(output) else { throw NSError(domain: "SelahHandCamera", code: 3, userInfo: [NSLocalizedDescriptionKey: "카메라 분석을 시작할 수 없습니다."]) }
                    session.addOutput(output)
                    output.connection(with: .video)?.videoOrientation = .portrait
                    session.commitConfiguration()
                    self.session = session
                    session.startRunning()
                    guard session.isRunning else { throw NSError(domain: "SelahHandCamera", code: 4, userInfo: [NSLocalizedDescriptionKey: "카메라가 시작되지 않았습니다."]) }
                    DispatchQueue.main.async { call.resolve() }
                } catch {
                    DispatchQueue.main.async { call.reject(error.localizedDescription) }
                }
            }
        }

        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized: startCapture()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { granted in
                DispatchQueue.main.async { granted ? startCapture() : call.reject("iPhone 설정에서 Selah 카메라 권한을 허용해 주세요.") }
            }
        case .denied, .restricted: call.reject("iPhone 설정에서 Selah 카메라 권한을 허용해 주세요.")
        @unknown default: call.reject("카메라 권한 상태를 확인할 수 없습니다.")
        }
    }

    @objc func stop(_ call: CAPPluginCall) {
        captureQueue.async {
            self.session?.stopRunning()
            self.session = nil
            DispatchQueue.main.async { call.resolve() }
        }
    }

    func captureOutput(_ output: AVCaptureOutput, didOutput sampleBuffer: CMSampleBuffer, from connection: AVCaptureConnection) {
        let now = CACurrentMediaTime()
        guard now - lastFrameAt >= 0.14, let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return }
        lastFrameAt = now
        let request = VNDetectHumanHandPoseRequest()
        request.maximumHandCount = 1
        do {
            try VNImageRequestHandler(cvPixelBuffer: pixelBuffer, orientation: .up, options: [:]).perform([request])
            guard let hand = request.results?.first else {
                notifyListeners("landmarks", data: ["landmarks": NSNull(), "timestamp": now * 1000])
                return
            }
            let joints: [VNHumanHandPoseObservation.JointName] = [
                .wrist, .thumbCMC, .thumbMP, .thumbIP, .thumbTip,
                .indexMCP, .indexPIP, .indexDIP, .indexTip,
                .middleMCP, .middlePIP, .middleDIP, .middleTip,
                .ringMCP, .ringPIP, .ringDIP, .ringTip,
                .littleMCP, .littlePIP, .littleDIP, .littleTip
            ]
            let recognized = try hand.recognizedPoints(.all)
            let points = joints.reduce(into: [[String: Double]]()) { result, joint in
                guard let point = recognized[joint], point.confidence >= 0.12 else { return }
                result.append(["x": point.location.x, "y": 1 - point.location.y])
            }
            notifyListeners("landmarks", data: ["landmarks": (points.count == 21 ? points as Any : NSNull()), "timestamp": now * 1000])
        } catch {
            notifyListeners("cameraError", data: ["message": error.localizedDescription])
        }
    }
}

@objc(SelahBrightnessPlugin)
final class SelahBrightnessPlugin: CAPPlugin, CAPBridgedPlugin {
    let identifier = "SelahBrightnessPlugin"
    let jsName = "SelahBrightness"
    let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "getBrightness", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setBrightness", returnType: CAPPluginReturnPromise)
    ]

    @objc func getBrightness(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let screen = self?.bridge?.viewController?.view.window?.windowScene?.screen else {
                call.reject("화면 밝기를 읽을 수 없습니다.")
                return
            }
            call.resolve(["level": Double(screen.brightness)])
        }
    }

    @objc func setBrightness(_ call: CAPPluginCall) {
        guard let requested = call.getDouble("level"), requested.isFinite else {
            call.reject("밝기 값이 올바르지 않습니다.")
            return
        }
        let level = min(1.0, max(0.05, requested))
        DispatchQueue.main.async { [weak self] in
            guard let screen = self?.bridge?.viewController?.view.window?.windowScene?.screen else {
                call.reject("화면 밝기를 바꿀 수 없습니다.")
                return
            }
            screen.brightness = CGFloat(level)
            call.resolve(["level": Double(screen.brightness)])
        }
    }
}
