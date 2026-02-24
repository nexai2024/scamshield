(function () {
  const APP_ORIGIN = 'http://localhost:5173'; // Change to your production URL when deploying
  const APP_PATH = '/';

  document.getElementById('scan').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const sel = window.getSelection();
        const text = sel ? sel.toString().trim() : '';
        if (text) return text;
        const body = document.body?.innerText || '';
        return body.slice(0, 5000);
      },
    });
    const text = results?.[0]?.result || '';
    const url = text
      ? `${APP_ORIGIN}${APP_PATH}?text=${encodeURIComponent(text)}`
      : APP_ORIGIN + APP_PATH;
    chrome.tabs.create({ url });
    window.close();
  });
})();
