function setCurrentTabUrl() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      document.getElementById('url').value = tabs[0].url;
    }
  });
}

document.getElementById('addSite').addEventListener('click', () => {
  const url = document.getElementById('url').value;
  const zoom = parseFloat(document.getElementById('zoom').value);

  if (url && !isNaN(zoom)) {
    chrome.storage.sync.get('sites', (data) => {
      const sites = data.sites || [];
      sites.push({ urlPattern: url, zoomLevel: zoom });
      chrome.storage.sync.set({ sites }, () => {
        document.getElementById('url').value = '';
        document.getElementById('zoom').value = '1';
        loadSites();
      });
    });
  }
});

function loadSites() {
  chrome.storage.sync.get('sites', (data) => {
    const sites = data.sites || [];
    const siteList = document.getElementById('siteList');
    siteList.innerHTML = '';

    sites.forEach((site, index) => {
      const li = document.createElement('li');
      li.textContent = `${site.urlPattern} - Масштаб: ${site.zoomLevel}`;

      // Кнопка для редактирования
      const editButton = document.createElement('button');
      editButton.className = 'icon-button';
      editButton.innerHTML = '<img src="gear-icon.png" alt="Редактировать" title="Редактировать">';
      editButton.addEventListener('click', () => editSite(index, site.urlPattern, site.zoomLevel));

      // Кнопка для удаления
      const removeButton = document.createElement('span');
      removeButton.textContent = '✖';
      removeButton.className = 'remove';
      removeButton.addEventListener('click', () => removeSite(index));

      li.appendChild(editButton);
      li.appendChild(removeButton);
      siteList.appendChild(li);
    });
  });
}

function editSite(index, currentUrl, currentZoom) {
  const urlInput = document.getElementById('url');
  const zoomInput = document.getElementById('zoom');
  
  urlInput.value = currentUrl;
  zoomInput.value = currentZoom;

  document.getElementById('addSite').textContent = 'Сохранить';
  document.getElementById('addSite').onclick = function() {
    const newUrl = urlInput.value;
    const newZoom = parseFloat(zoomInput.value);
    chrome.storage.sync.get('sites', (data) => {
      const sites = data.sites || [];
      sites[index] = { urlPattern: newUrl, zoomLevel: newZoom };
      chrome.storage.sync.set({ sites }, () => {
        loadSites();
        resetAddButton();
      });
    });
  };
}

function resetAddButton() {
  document.getElementById('addSite').textContent = 'Добавить';
  document.getElementById('addSite').onclick = () => {
    const url = document.getElementById('url').value;
    const zoom = parseFloat(document.getElementById('zoom').value);
    if (url && !isNaN(zoom)) {
      chrome.storage.sync.get('sites', (data) => {
        const sites = data.sites || [];
        sites.push({ urlPattern: url, zoomLevel: zoom });
        chrome.storage.sync.set({ sites }, () => {
          document.getElementById('url').value = '';
          document.getElementById('zoom').value = '1';
          loadSites();
        });
      });
    }
  };
}

function removeSite(index) {
  chrome.storage.sync.get('sites', (data) => {
    const sites = data.sites || [];
    sites.splice(index, 1);
    chrome.storage.sync.set({ sites }, loadSites);
  });
}

document.getElementById('toggleListButton').addEventListener('click', () => {
  const siteList = document.getElementById('siteList');
  const toggleListButton = document.getElementById('toggleListButton');

  if (siteList.style.display === 'none') {
    siteList.style.display = 'block';
    toggleListButton.textContent = 'Скрыть список сайтов';
  } else {
    siteList.style.display = 'none';
    toggleListButton.textContent = 'Показать список сайтов';
  }
});

function updateIcon(isEnabled) {
  const text = isEnabled ? 'ON' : 'OFF';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: isEnabled ? 'green' : 'red' });
}

chrome.storage.sync.get('isEnabled', (data) => {
  const isEnabled = data.isEnabled !== false;
  document.getElementById('toggleExtension').checked = isEnabled;
  updateIcon(isEnabled);
  loadSites();
  setCurrentTabUrl();
});

document.getElementById('toggleExtension').addEventListener('change', (event) => {
  const isEnabled = event.target.checked;
  chrome.storage.sync.set({ isEnabled }, () => {
    updateIcon(isEnabled);
  });
});
