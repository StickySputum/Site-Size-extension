// Устанавливаем URL текущей вкладки в поле "URL или шаблон" при загрузке popup
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
        document.getElementById('zoom').value = '1'; // Возвращаем значение по умолчанию для масштаба
        loadSites(); // Загружаем список сайтов после добавления нового
      });
    });
  }
});

// Функция для загрузки и отображения списка сайтов
function loadSites() {
  chrome.storage.sync.get('sites', (data) => {
    const sites = data.sites || [];
    const siteList = document.getElementById('siteList');
    siteList.innerHTML = ''; // Очищаем список перед загрузкой

    sites.forEach((site, index) => {
      const li = document.createElement('li');

      // Проверяем, если элемент в режиме редактирования
      if (site.isEditing) {
        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.value = site.urlPattern;

        const zoomInput = document.createElement('input');
        zoomInput.type = 'number';
        zoomInput.step = '0.1';
        zoomInput.value = site.zoomLevel;

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Сохранить';
        saveButton.addEventListener('click', () => {
          site.urlPattern = urlInput.value;
          site.zoomLevel = parseFloat(zoomInput.value);
          site.isEditing = false; // Убираем режим редактирования
          chrome.storage.sync.set({ sites }, loadSites); // Сохраняем изменения и перезагружаем список
        });

        li.appendChild(urlInput);
        li.appendChild(zoomInput);
        li.appendChild(saveButton);
      } else {
        li.textContent = `${site.urlPattern} - Масштаб: ${site.zoomLevel}`;

        // При клике включаем режим редактирования
        li.addEventListener('click', () => {
          sites[index].isEditing = true;
          chrome.storage.sync.set({ sites }, loadSites);
        });

        // Создаем элемент для удаления
        const removeSpan = document.createElement('span');
        removeSpan.textContent = '✖'; // Крестик
        removeSpan.className = 'remove';
        removeSpan.addEventListener('click', (e) => {
          e.stopPropagation(); // Предотвращаем срабатывание редактирования при удалении
          sites.splice(index, 1); // Удаляем элемент из массива
          chrome.storage.sync.set({ sites }, loadSites); // Обновляем хранилище и перезагружаем список
        });

        li.appendChild(removeSpan); // Добавляем крестик к элементу списка
      }

      siteList.appendChild(li); // Добавляем элемент списка на страницу
    });
  });
}

// Функция для обновления иконки состояния
function updateIcon(isEnabled) {
  const text = isEnabled ? 'ON' : 'OFF';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: isEnabled ? 'green' : 'red' });
}

// Загрузка состояния переключателя, сайтов и текущего URL при открытии popup
chrome.storage.sync.get('isEnabled', (data) => {
  const isEnabled = data.isEnabled !== false;
  document.getElementById('toggleExtension').checked = isEnabled;
  updateIcon(isEnabled); // Обновляем иконку при загрузке
  loadSites(); // Загружаем список сайтов при загрузке popup
  setCurrentTabUrl(); // Устанавливаем текущий URL в поле
});

document.getElementById('toggleExtension').addEventListener('change', (event) => {
  const isEnabled = event.target.checked;
  chrome.storage.sync.set({ isEnabled }, () => {
    updateIcon(isEnabled); // Обновляем иконку при изменении
  });
});
