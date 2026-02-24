// Content script: optional context menu or selection handler could be added here.
// Currently the popup uses executeScript to get selection; this file is here for future "Right-click > Scan with ScamShield".
(function () {
  chrome.runtime.onMessage.addListener(function (request, _sender, sendResponse) {
    if (request.action === 'getSelection') {
      const sel = window.getSelection();
      sendResponse({ text: sel ? sel.toString().trim() : '' });
    }
    return true;
  });
})();
