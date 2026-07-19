(function () {
  const ADMIN_PASSWORD_HASH = 'baebfe6318b532e2b86584a8e1882a0bc37c8dd964409094734f34fe21e638da';
  const AUTH_KEY = 'presskitAdminAuthed';
  const DATA_KEY = 'presskitData';

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

  async function sha256Hex(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // ---------- password gate ----------
  function initGate() {
    const gate = document.getElementById('authGate');
    if (localStorage.getItem(AUTH_KEY) === '1') {
      gate.classList.add('hide');
    }
    document.getElementById('gateForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const pw = document.getElementById('gatePassword').value;
      const hash = await sha256Hex(pw);
      if (hash === ADMIN_PASSWORD_HASH) {
        localStorage.setItem(AUTH_KEY, '1');
        gate.classList.add('hide');
        document.getElementById('gateError').textContent = '';
      } else {
        document.getElementById('gateError').textContent = 'Yanlış şifre.';
      }
    });
    document.getElementById('lockBtn').addEventListener('click', () => {
      localStorage.removeItem(AUTH_KEY);
      gate.classList.remove('hide');
      document.getElementById('gatePassword').value = '';
    });
  }

  // ---------- status ----------
  function setStatus(msg, type) {
    const bar = document.getElementById('statusBar');
    bar.textContent = msg;
    bar.className = 'status-bar show' + (type ? ' ' + type : '');
  }

  // ---------- import / save ----------
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

  let currentData = null;
  let isSaved = false;

  function updateSaveHint() {
    const hint = document.getElementById('saveHint');
    const saveBtn = document.getElementById('saveBtn');
    if (isSaved) {
      hint.textContent = 'Bu veri tarayıcınızda kaydedildi — index.html\'i her açtığınızda bu içeriği göreceksiniz. Sitenin TÜM ziyaretçilere aynı içeriği göstermesi için "data.json indir" ile aldığınız dosyayı presskit-viewer/data.json olarak repoya koyup deploy edin.';
      saveBtn.textContent = '💾 Kaydedildi ✓';
    } else {
      hint.textContent = 'Önizlemeyi kontrol edin ve bu tarayıcıda kalıcı olması için "Kaydet"e basın. Sitenin TÜM ziyaretçilere aynı içeriği göstermesi için ayrıca "data.json indir" ile aldığınız dosyayı presskit-viewer/data.json olarak repoya koyup deploy edin.';
      saveBtn.textContent = '💾 Kaydet';
    }
  }

  async function handleFile(file) {
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('JSON bir obje olmalı.');
      }
      currentData = data;
      isSaved = false;
      showResult(data);
      updateSaveHint();
      setStatus('JSON okundu — kaydetmek için "Kaydet"e basın.', null);
    } catch (e) {
      setStatus('İçe aktarma hatası: geçersiz JSON dosyası. (' + e.message + ')', 'err');
    }
  }

  function saveCurrent() {
    if (!currentData) return;
    localStorage.setItem(DATA_KEY, JSON.stringify(currentData));
    isSaved = true;
    updateSaveHint();
    setStatus('Kaydedildi ✓ — bu tarayıcıda kalıcı olarak saklanıyor.', 'ok');
  }

  function init() {
    initGate();

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

    document.getElementById('saveBtn').addEventListener('click', saveCurrent);
    document.getElementById('downloadDataBtn').addEventListener('click', () => {
      if (currentData) downloadDataJson(currentData);
    });

    // If data was already saved in this browser, show it as the current (saved) state.
    try {
      const existing = localStorage.getItem(DATA_KEY);
      if (existing) {
        const data = JSON.parse(existing);
        currentData = data;
        isSaved = true;
        showResult(data);
        updateSaveHint();
        setStatus('Bu tarayıcıda kaydedilmiş bir JSON bulundu.', null);
      }
    } catch (e) { /* ignore corrupt localStorage */ }
  }

  init();
})();
