function updateIcon(isEnabled) {
  const text = isEnabled ? 'ON' : 'OFF';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: isEnabled ? 'green' : 'red' });
}

chrome.storage.sync.get('isEnabled', (data) => {
  const isEnabled = data.isEnabled !== false;
  updateIcon(isEnabled); // Устанавливаем иконку при запуске
});

function applyZoomToTab(tabId, url) {
  chrome.storage.sync.get(['sites', 'isEnabled'], (data) => {
    if (data.isEnabled === false) return;

    const sites = data.sites || [];

    // Сортируем шаблоны по длине в порядке убывания
    sites.sort((a, b) => b.urlPattern.length - a.urlPattern.length);

    for (const site of sites) {
      const pattern = new RegExp(site.urlPattern);
      if (pattern.test(url)) {
        chrome.tabs.setZoom(tabId, site.zoomLevel);
        return;
      }
    }

    chrome.tabs.setZoom(tabId, 1);
  });
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active) {
    applyZoomToTab(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab.status === 'complete') {
      applyZoomToTab(activeInfo.tabId, tab.url);
    }
  });
});
