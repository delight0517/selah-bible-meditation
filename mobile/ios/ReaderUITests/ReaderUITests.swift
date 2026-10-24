import XCTest

final class ReaderUITests: XCTestCase {
  func testReaderCameraPanelFitsPhone() {
    let app = XCUIApplication()
    app.launch()
    let read = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "말씀 읽기")).firstMatch
    XCTAssertTrue(read.waitForExistence(timeout: 20), app.debugDescription)
    read.tap()
    let hand = app.buttons.matching(NSPredicate(format: "label CONTAINS %@", "손동작")).firstMatch
    XCTAssertTrue(hand.waitForExistence(timeout: 15), app.debugDescription)
    hand.tap()
    let start = app.buttons["손동작 켜기"]
    XCTAssertTrue(start.waitForExistence(timeout: 5), app.debugDescription)
    XCTAssertGreaterThanOrEqual(start.frame.minX, 0)
    XCTAssertLessThanOrEqual(start.frame.maxX, app.frame.maxX)
    let panel = XCTAttachment(screenshot: app.screenshot())
    panel.name = "reader-gesture-panel"
    panel.lifetime = .keepAlways
    add(panel)
    start.tap()
    let consent = app.buttons["계속"]
    if consent.waitForExistence(timeout: 3) { consent.tap() }
    let nativeError = app.staticTexts.matching(NSPredicate(format: "label CONTAINS %@", "registerPlugin")).firstMatch
    XCTAssertFalse(nativeError.waitForExistence(timeout: 3), app.debugDescription)
    let after = XCTAttachment(screenshot: app.screenshot())
    after.name = "reader-native-camera-result"
    after.lifetime = .keepAlways
    add(after)
  }
}
