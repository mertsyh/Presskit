(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pick(field, lang) {
    if (field && typeof field === 'object') return field[lang || 'tr'] || field.tr || field.en || '';
    return field || '';
  }

  function setStatus(msg, type) {
    const bar = document.getElementById('statusBar');
    bar.textContent = msg;
    bar.className = 'status-bar show' + (type ? ' ' + type : '');
  }

  function collectImageUrls(data) {
    const game = data.game || {};
    const images = data.images || {};
    const urls = [];
    const add = (url, caption) => { if (url) urls.push({ url, caption: caption || '' }); };
    add(game.boxArt, 'Box Art');
    add(game.keyArt, 'Key Art');
    add(images.logo, 'Logo');
    ['artwork', 'screenshots', 'gifs', 'additionalAssets'].forEach(key => {
      (images[key] || []).forEach(i => { if (i && i.url) add(i.url, pick(i.caption, 'tr') || key); });
    });
    return urls;
  }

  function renderPreview(data) {
    const list = document.getElementById('previewList');
    const urls = collectImageUrls(data);
    if (!urls.length) {
      list.innerHTML = '<p class="empty-note">Bu JSON içinde görsel URL\'si bulunamadı.</p>';
      return;
    }
    list.innerHTML = urls.map(i => `
      <div class="preview-item">
        <img src="${esc(i.url)}" alt="" loading="lazy">
        <span>${esc(i.caption)} — ${esc(i.url)}</span>
      </div>
    `).join('');
  }

  function showResult(data) {
    document.getElementById('resultBox').style.display = '';
    document.getElementById('resultTitle').textContent = (data.game && data.game.title) || '(başlıksız)';
    renderPreview(data);
  }

  function downloadDataJson(data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  let lastImported = null;

  async function handleFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('JSON bir obje olmalı.');
      }
      localStorage.setItem('presskitData', JSON.stringify(data));
      lastImported = data;
      showResult(data);
      setStatus('JSON içe aktarıldı ✓ — önizleme için "Görüntüle" linkine bakın.', 'ok');
    } catch (e) {
      setStatus('İçe aktarma hatası: geçersiz JSON dosyası. (' + e.message + ')', 'err');
    }
  }

  function init() {
    const fileInput = document.getElementById('importFile');
    const dropZone = document.getElementById('dropZone');

    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      handleFile(fileInput.files[0]);
      fileInput.value = '';
    });

    ['dragenter', 'dragover'].forEach(evt => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(evt => {
      dropZone.addEventListener(evt, (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
      });
    });
    dropZone.addEventListener('drop', (e) => {
      const file = e.dataTransfer.files && e.dataTransfer.files[0];
      if (file) handleFile(file);
    });

    document.getElementById('downloadDataBtn').addEventListener('click', () => {
      if (lastImported) downloadDataJson(lastImported);
    });

    // If a previous import already exists in this browser, show it so re-visits aren't blank.
    try {
      const existing = localStorage.getItem('presskitData');
      if (existing) {
        const data = JSON.parse(existing);
        lastImported = data;
        showResult(data);
        setStatus('Bu tarayıcıda daha önce içe aktarılmış bir JSON bulundu.', null);
      }
    } catch (e) { /* ignore */ }
  }

  init();
})();
