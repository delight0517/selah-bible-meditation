import SwiftUI
import WebKit

@main
struct SelahApp: App {
    @State private var reader = SelahReader()

    var body: some Scene {
        WindowGroup {
            ReaderWindow(reader: reader)
                .frame(minWidth: 760, minHeight: 620)
                .onOpenURL { reader.openComputerReading($0) }
                .onContinueUserActivity(NSUserActivityTypeBrowsingWeb) { activity in
                    if let url = activity.webpageURL { reader.openComputerReading(url) }
                }
        }
        .commands {
            CommandGroup(after: .textEditing) {
                Button("Focus Reading") { reader.focus() }
                    .keyboardShortcut("f", modifiers: [.command, .shift])
                Divider()
                Button("Larger Text") { reader.adjustZoom(0.1) }
                    .keyboardShortcut("+", modifiers: .command)
                Button("Smaller Text") { reader.adjustZoom(-0.1) }
                    .keyboardShortcut("-", modifiers: .command)
                Button("Reset Text Size") { reader.resetZoom() }
                    .keyboardShortcut("0", modifiers: .command)
            }
        }
    }
}

@MainActor
@Observable
final class SelahReader {
    var webView: WKWebView?
    private var pendingReadingURL: URL?
    private var activityObservers: [NSObjectProtocol] = []
    private var activityHeartbeat: Timer?

    init() {
        activityObservers.append(NotificationCenter.default.addObserver(
            forName: NSApplication.didBecomeActiveNotification, object: nil, queue: .main
        ) { [weak self] _ in
            MainActor.assumeIsolated {
                self?.publishAppActivity()
            }
        })
        activityObservers.append(NotificationCenter.default.addObserver(
            forName: NSApplication.didResignActiveNotification, object: nil, queue: .main
        ) { [weak self] _ in
            MainActor.assumeIsolated { self?.publishAppActivity() }
        })
        let timer = Timer(timeInterval: 20, repeats: true) { [weak self] _ in
            MainActor.assumeIsolated {
                if NSApp.isActive { self?.publishAppActivity() }
            }
        }
        activityHeartbeat = timer
        RunLoop.main.add(timer, forMode: .common)
    }

    func publishAppActivity() {
        let active = NSApp.isActive ? "true" : "false"
        webView?.evaluateJavaScript("""
        window.selahMacAppPresence = { active: \(active) };
        window.dispatchEvent(new Event('selah-mac-app-activity'));
        """)
    }

    var canGoBack = false
    var canGoForward = false
    private(set) var zoom: CGFloat = 1

    func navigateChapter(_ direction: Int) {
        webView?.evaluateJavaScript("window.selahMacReaderNavigation?.turn(\(direction))")
    }

    func focus() {
        webView?.evaluateJavaScript("document.querySelector('#readerFocusToggle')?.click()")
    }

    func openComputerReading(_ url: URL) {
        guard let target = Self.sharedReadingURL(url) else { return }
        pendingReadingURL = target
        webView?.load(URLRequest(url: target))
    }

    static func sharedReadingURL(_ url: URL) -> URL? {
        let native = url.scheme == "selah" && url.host == "read" && url.path.isEmpty
        let web = url.scheme == "https" && url.host == "delight0517.github.io" && url.path == "/selah-bible-meditation/"
        guard native || web, let incoming = URLComponents(url: url, resolvingAgainstBaseURL: false) else { return nil }
        var target = URLComponents(string: "https://delight0517.github.io/selah-bible-meditation/")!
        let names = Set(["selahBook", "selahPassage", "selahVerse", "selahTranslation", "bibleLang", "selahRoom"])
        target.queryItems = [URLQueryItem(name: "homeAction", value: "read")]
        target.queryItems! += (incoming.queryItems ?? []).filter { names.contains($0.name) }
        if let request = incoming.queryItems?.first(where: { $0.name == "request" })?.value,
           request.range(of: "^[A-Za-z0-9._-]{1,128}$", options: .regularExpression) != nil {
            target.queryItems!.append(URLQueryItem(name: "requestId", value: request))
        }
        if let fragment = incoming.fragment,
           fragment.range(of: "^selahRoom=[a-f0-9]{32}$", options: .regularExpression) != nil {
            target.fragment = fragment
        }
        return target.url
    }

    func initialURL() -> URL {
        pendingReadingURL ?? URL(string: "https://delight0517.github.io/selah-bible-meditation/")!
    }

    func adjustZoom(_ delta: CGFloat) {
        zoom = min(1.5, max(0.8, zoom + delta))
        webView?.pageZoom = zoom
    }

    func resetZoom() {
        zoom = 1
        webView?.pageZoom = 1
    }

    func refreshNavigation() {
        canGoBack = webView?.canGoBack ?? false
        canGoForward = webView?.canGoForward ?? false
    }
}

struct ReaderWindow: View {
    @Bindable var reader: SelahReader

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Button { reader.navigateChapter(-1) } label: {
                    Image(systemName: "chevron.left")
                }
                .disabled(reader.webView == nil)
                .help("Previous chapter (←)")
                Button { reader.navigateChapter(1) } label: {
                    Image(systemName: "chevron.right")
                }
                .disabled(reader.webView == nil)
                .help("Next chapter (→)")
                Divider().frame(height: 20)
                Text("SELAH").font(.system(size: 12, weight: .semibold, design: .rounded)).tracking(2)
                Spacer()
                Button { reader.adjustZoom(-0.1) } label: { Image(systemName: "textformat.size.smaller") }
                    .help("Smaller text (⌘−)")
                Text("\(Int(reader.zoom * 100))%").font(.system(size: 12, design: .monospaced)).frame(width: 42)
                Button { reader.adjustZoom(0.1) } label: { Image(systemName: "textformat.size.larger") }
                    .help("Larger text (⌘+)")
                Button { reader.focus() } label: {
                    Label("Focus reading", systemImage: "book.pages")
                }
                .keyboardShortcut("f", modifiers: [.command, .shift])
            }
            .buttonStyle(.borderless)
            .padding(.horizontal, 18)
            .frame(height: 48)
            .background(.bar)

            SelahWebView(reader: reader)
        }
        .background(Color(nsColor: .windowBackgroundColor))
    }
}

struct SelahWebView: NSViewRepresentable {
    @Bindable var reader: SelahReader

    func makeNSView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        // The reader explicitly requests playback after resolving the chapter audio.
        configuration.mediaTypesRequiringUserActionForPlayback = []
        // Use the modern Safari-compatible embed path in this WebKit reader.
        configuration.applicationNameForUserAgent = "Version/26.0 Safari/605.1.15 Selah/1.0.22"
        let view = WKWebView(frame: .zero, configuration: configuration)
        let active = NSApp.isActive ? "true" : "false"
        view.configuration.userContentController.addUserScript(WKUserScript(
            source: "window.selahMacAppPresence = { active: \(active) };",
            injectionTime: .atDocumentStart, forMainFrameOnly: true
        ))
        view.navigationDelegate = context.coordinator
        if let scriptURL = Bundle.main.url(forResource: "reader-navigation", withExtension: "js", subdirectory: "Resources"),
           let script = try? String(contentsOf: scriptURL, encoding: .utf8) {
            view.configuration.userContentController.addUserScript(WKUserScript(
                source: script, injectionTime: .atDocumentEnd, forMainFrameOnly: true
            ))
        }
        if let scriptURL = Bundle.main.url(forResource: "reader-audio", withExtension: "js", subdirectory: "Resources"),
           let script = try? String(contentsOf: scriptURL, encoding: .utf8) {
            view.configuration.userContentController.addUserScript(WKUserScript(
                source: script, injectionTime: .atDocumentEnd, forMainFrameOnly: true
            ))
        }
        view.allowsBackForwardNavigationGestures = false
        view.load(URLRequest(url: reader.initialURL()))
        reader.webView = view
        return view
    }

    func updateNSView(_ view: WKWebView, context: Context) {
        reader.webView = view
        view.pageZoom = reader.zoom
        reader.refreshNavigation()
    }

    func makeCoordinator() -> Coordinator { Coordinator(reader: reader) }

    final class Coordinator: NSObject, WKNavigationDelegate {
        let reader: SelahReader
        init(reader: SelahReader) { self.reader = reader }
        func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
            reader.refreshNavigation()
            reader.publishAppActivity()
        }
    }
}
