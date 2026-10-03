import SwiftUI
import WebKit
import UniformTypeIdentifiers

@main
struct SelahApp: App {
    @State private var reader = SelahReader()

    var body: some Scene {
        WindowGroup {
            ReaderWindow(reader: reader)
                .frame(minWidth: 760, minHeight: 620)
                .onOpenURL { reader.openComputerReading($0) }
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
    var canGoBack = false
    var canGoForward = false
    private(set) var zoom: CGFloat = 1

    func focus() {
        webView?.evaluateJavaScript("document.querySelector('#readerFocusToggle')?.click()")
    }

    func openComputerReading(_ url: URL) {
        guard url.scheme == "selah", url.host == "read" else { return }
        var components = URLComponents(string: "selah-local://app/index.html")!
        components.queryItems = [
            URLQueryItem(name: "homeAction", value: "read"),
            URLQueryItem(name: "requestId", value: URLComponents(url: url, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "request" })?.value)
        ]
        guard let target = components.url else { return }
        pendingReadingURL = target
        webView?.load(URLRequest(url: target))
    }

    func initialURL() -> URL {
        pendingReadingURL ?? URL(string: "selah-local://app/index.html")!
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
                Button { reader.webView?.goBack() } label: {
                    Image(systemName: "chevron.left")
                }
                .disabled(!reader.canGoBack)
                .help("Back")
                Button { reader.webView?.goForward() } label: {
                    Image(systemName: "chevron.right")
                }
                .disabled(!reader.canGoForward)
                .help("Forward")
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
        configuration.setURLSchemeHandler(BundledScriptureAssets(), forURLScheme: "selah-local")
        let view = WKWebView(frame: .zero, configuration: configuration)
        view.navigationDelegate = context.coordinator
        view.allowsBackForwardNavigationGestures = true
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
        }
    }
}

// Keep the shared reader and Scripture bootstrap in the installed app.
final class BundledScriptureAssets: NSObject, WKURLSchemeHandler {
    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let url = urlSchemeTask.request.url,
              let root = Bundle.main.resourceURL?.appendingPathComponent("www", isDirectory: true) else {
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist)); return
        }
        let relative = url.path == "/" ? "index.html" : String(url.path.dropFirst())
        let file = root.appendingPathComponent(relative).standardizedFileURL
        guard file.path.hasPrefix(root.standardizedFileURL.path + "/"),
              let data = try? Data(contentsOf: file) else {
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist)); return
        }
        let mime = UTType(filenameExtension: file.pathExtension)?.preferredMIMEType ?? "application/octet-stream"
        let response = URLResponse(url: url, mimeType: mime, expectedContentLength: data.count, textEncodingName: "utf-8")
        urlSchemeTask.didReceive(response)
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }
    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}
}
