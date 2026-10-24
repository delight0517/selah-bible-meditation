const webext = globalThis.browser || globalThis.chrome;

webext.action.onClicked.addListener(async tab => {
  const cameraPage = webext.runtime.getURL('camera.html');
  let targetTabId = tab?.id;
  try {
    if (!Number.isInteger(targetTabId)) throw new Error('이 페이지를 제어할 수 없어요.');
    await webext.scripting.executeScript({ target: { tabId: targetTabId }, files: ['content.js'] });
  } catch {
    targetTabId = null;
  }
  const query = targetTabId === null ? '?unsupported=1' : `?tabId=${targetTabId}`;
  await webext.tabs.create({ url: `${cameraPage}${query}`, active: true });
});
