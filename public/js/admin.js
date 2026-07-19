(function () {
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function bi(v) {
    if (v && typeof v === 'object') return { tr: v.tr || '', en: v.en || '' };
    return { tr: v || '', en: '' };
  }

  function val(id) { return document.getElementById(id).value; }
  function setVal(id, v) { document.getElementById(id).value = v || ''; }

  // ---------- status bar ----------
  let statusTimer;
  function setStatus(msg, type) {
    const bar = document.getElementById('statusBar');
    bar.textContent = msg;
    bar.className = 'status-bar show' + (type ? ' ' + type : '');
    clearTimeout(statusTimer);
    if (type) statusTimer = setTimeout(() => bar.classList.remove('show'), 2500);
  }

  // ---------- dirty tracking ----------
  let dirty = false;
  function markDirty() {
    dirty = true;
    const badge = document.getElementById('dirtyBadge');
    if (badge) badge.classList.add('show');
  }
  function clearDirty() {
    dirty = false;
    const badge = document.getElementById('dirtyBadge');
    if (badge) badge.classList.remove('show');
  }
  window.addEventListener('beforeunload', (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
  document.addEventListener('input', (e) => {
    if (e.target.closest('.admin-section')) markDirty();
  });
  document.addEventListener('change', (e) => {
    if (e.target.closest('.admin-section')) markDirty();
  });

  // ---------- upload ----------
  async function uploadFile(file) {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: fd });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || 'Yükleme hatası');
    return json.url;
  }

  function wireSingleImageUpload(fileId, previewId, urlId) {
    const fileInput = document.getElementById(fileId);
    const preview = document.getElementById(previewId);
    const urlInput = urlId ? document.getElementById(urlId) : null;
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      if (!file) return;
      setStatus('Yükleniyor...', null);
      try {
        const url = await uploadFile(file);
        fileInput.dataset.url = url;
        if (urlInput) urlInput.value = url;
        preview.src = url;
        preview.classList.add('show');
        setStatus('Yüklendi ✓', 'ok');
      } catch (e) {
        setStatus('Yükleme hatası: ' + e.message, 'err');
      }
    });
  }

  function wireSingleImageUrlInput(urlId, fileId, previewId) {
    const urlInput = document.getElementById(urlId);
    const fileInput = document.getElementById(fileId);
    const preview = document.getElementById(previewId);
    urlInput.addEventListener('input', () => {
      const url = urlInput.value.trim();
      fileInput.dataset.url = url;
      if (url) {
        preview.src = url;
        preview.classList.add('show');
      } else {
        preview.removeAttribute('src');
        preview.classList.remove('show');
      }
    });
  }

  function setSingleImageValue(fileId, previewId, url, urlId) {
    const fileInput = document.getElementById(fileId);
    const preview = document.getElementById(previewId);
    const urlInput = urlId ? document.getElementById(urlId) : null;
    fileInput.value = '';
    fileInput.dataset.url = url || '';
    if (urlInput) urlInput.value = url || '';
    if (url) {
      preview.src = url;
      preview.classList.add('show');
    } else {
      preview.removeAttribute('src');
      preview.classList.remove('show');
    }
  }

  // ---------- repeatable row templates ----------
  const rowTemplates = {
    platform: (d) => `
      <div class="row-3" style="grid-template-columns:1fr 1fr 1fr;">
        <div class="field"><label>Platform Adı</label><input type="text" class="pf-name" value="${esc(d.name)}" placeholder="Steam, Epic Store, PS5..."></div>
        <div class="field"><label>Çıkış Tarihi (TR)</label><input type="text" class="pf-date-tr" value="${esc(bi(d.releaseDate).tr)}" placeholder="26 Haziran 2025"></div>
        <div class="field"><label>Çıkış Tarihi (EN)</label><input type="text" class="pf-date-en" value="${esc(bi(d.releaseDate).en)}" placeholder="June 26, 2025"></div>
      </div>
      <div class="field"><label>Link (mağaza sayfası / Steam wishlist)</label><input type="url" class="pf-url" value="${esc(d.url)}" placeholder="https://store.steampowered.com/app/..."></div>`,
    social: (d) => `
      <div class="row-2">
        <div class="field"><label>Platform</label><input type="text" class="sc-label" value="${esc(d.label)}" placeholder="Twitter, YouTube, TikTok..."></div>
        <div class="field"><label>URL</label><input type="url" class="sc-url" value="${esc(d.url)}"></div>
      </div>`,
    feature: (d) => `
      <div class="row-2">
        <div class="field"><label>Özellik (TR)</label><input type="text" class="ft-text-tr" value="${esc(bi(d).tr)}"></div>
        <div class="field"><label>Özellik (EN)</label><input type="text" class="ft-text-en" value="${esc(bi(d).en)}"></div>
      </div>`,
    contact: (d) => `
      <div class="row-3" style="grid-template-columns:1fr 1fr 1fr;">
        <div class="field"><label>Rol</label><input type="text" class="ct-role" value="${esc(d.role)}" placeholder="PR / Publisher / Developer"></div>
        <div class="field"><label>İsim</label><input type="text" class="ct-name" value="${esc(d.name)}"></div>
        <div class="field"><label>E-posta</label><input type="email" class="ct-email" value="${esc(d.email)}"></div>
      </div>`,
    video: (d) => `
      <div class="row-2">
        <div class="field"><label>Başlık (TR)</label><input type="text" class="vd-title-tr" value="${esc(bi(d.title).tr)}"></div>
        <div class="field"><label>Başlık (EN)</label><input type="text" class="vd-title-en" value="${esc(bi(d.title).en)}"></div>
      </div>
      <div class="field"><label>Video URL</label><input type="text" class="vd-url" value="${esc(d.url)}" placeholder="YouTube/Vimeo linki"></div>
      <div class="upload-row"><input type="file" class="vd-file" accept="video/mp4,video/webm"><span style="font-size:0.8rem;color:var(--text-dim);">veya dosya yükle (mp4/webm)</span></div>`,
    press: (d) => `
      <div class="row-3">
        <div class="field"><label>Başlık</label><input type="text" class="pr-title" value="${esc(d.title)}"></div>
        <div class="field"><label>URL</label><input type="url" class="pr-url" value="${esc(d.url)}"></div>
        <div class="field"><label>Tarih</label><input type="text" class="pr-date" value="${esc(d.date)}" placeholder="26 Haziran 2025"></div>
      </div>`,
  };
  const imageRowTemplate = (d) => `
    <div class="upload-row">
      <input type="file" class="im-file" accept="image/*">
      <input type="url" class="im-url inline-url-input" placeholder="veya görsel URL'si yapıştırın" value="${esc(d.url)}">
    </div>
    <div class="row-2" style="margin-top:8px;">
      <div class="field"><label>Açıklama (TR)</label><input type="text" class="im-caption-tr" value="${esc(bi(d.caption).tr)}"></div>
      <div class="field"><label>Açıklama (EN)</label><input type="text" class="im-caption-en" value="${esc(bi(d.caption).en)}"></div>
    </div>
    <img class="thumb-preview ${d.url ? 'show' : ''}" src="${esc(d.url || '')}">`;
  ['artwork', 'screenshots', 'gifs', 'assets'].forEach(t => { rowTemplates[t] = imageRowTemplate; });

  function wireImageUrlInputs(row) {
    const urlInput = row.querySelector('.im-url');
    if (!urlInput) return;
    urlInput.addEventListener('input', () => {
      const url = urlInput.value.trim();
      const preview = row.querySelector('.thumb-preview');
      if (url) {
        preview.src = url;
        preview.classList.add('show');
      } else {
        preview.removeAttribute('src');
        preview.classList.remove('show');
      }
    });
  }

  function wireUploads(row) {
    row.querySelectorAll('input[type=file]').forEach(fileInput => {
      fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;
        setStatus('Yükleniyor...', null);
        try {
          const url = await uploadFile(file);
          if (fileInput.classList.contains('im-file')) {
            row.querySelector('.im-url').value = url;
            const preview = row.querySelector('.thumb-preview');
            preview.src = url;
            preview.classList.add('show');
          } else if (fileInput.classList.contains('vd-file')) {
            row.querySelector('.vd-url').value = url;
          }
          setStatus('Yüklendi ✓', 'ok');
        } catch (e) {
          setStatus('Yükleme hatası: ' + e.message, 'err');
        }
      });
    });
  }

  // ---------- drag & drop reordering ----------
  let dragSrc = null;
  function wireDragEvents(row) {
    row.addEventListener('dragstart', (e) => {
      dragSrc = row;
      row.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', ''); } catch (err) { /* ignore */ }
    });
    row.addEventListener('dragend', () => {
      row.classList.remove('dragging');
      dragSrc = null;
    });
    row.addEventListener('dragover', (e) => {
      if (!dragSrc || dragSrc === row || dragSrc.parentElement !== row.parentElement) return;
      e.preventDefault();
      const rect = row.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height / 2;
      row.parentElement.insertBefore(dragSrc, before ? row : row.nextSibling);
    });
    row.addEventListener('drop', (e) => {
      e.preventDefault();
      markDirty();
    });
  }

  function addRow(containerId, type, data) {
    const container = document.getElementById(containerId);
    const row = document.createElement('div');
    row.className = 'repeat-item';
    row.draggable = true;
    row.innerHTML = '<span class="drag-handle" title="Sürükleyerek sırala">⠿</span>' + rowTemplates[type](data || {});

    const actions = document.createElement('div');
    actions.className = 'repeat-item-actions';

    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'btn btn-sm move-btn';
    upBtn.textContent = '▲';
    upBtn.title = 'Yukarı taşı';
    upBtn.addEventListener('click', () => {
      const prev = row.previousElementSibling;
      if (prev) { container.insertBefore(row, prev); markDirty(); }
    });

    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'btn btn-sm move-btn';
    downBtn.textContent = '▼';
    downBtn.title = 'Aşağı taşı';
    downBtn.addEventListener('click', () => {
      const next = row.nextElementSibling;
      if (next) { container.insertBefore(next, row); markDirty(); }
    });

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'btn btn-sm btn-danger remove-btn';
    removeBtn.textContent = 'Sil';
    removeBtn.addEventListener('click', () => { row.remove(); markDirty(); });

    actions.appendChild(upBtn);
    actions.appendChild(downBtn);
    actions.appendChild(removeBtn);
    row.appendChild(actions);

    container.appendChild(row);
    wireUploads(row);
    wireImageUrlInputs(row);
    wireDragEvents(row);
  }

  const REPEATER_IDS = [
    'platformsList', 'socialList', 'featuresList', 'contactsList', 'videosList',
    'artworkList', 'screenshotsList', 'gifsList', 'assetsList', 'pressList'
  ];
  function clearAllRows() {
    REPEATER_IDS.forEach(id => { document.getElementById(id).innerHTML = ''; });
  }

  function collectRows(containerId, fn) {
    return Array.from(document.getElementById(containerId).children).map(fn);
  }
  function collectImageRow(row) {
    return {
      url: row.querySelector('.im-url').value.trim(),
      caption: {
        tr: row.querySelector('.im-caption-tr').value.trim(),
        en: row.querySelector('.im-caption-en').value.trim()
      }
    };
  }

  // ---------- bulk upload ----------
  const BULK_MAP = {
    'bulk-artwork': ['artworkList', 'artwork'],
    'bulk-screenshots': ['screenshotsList', 'screenshots'],
    'bulk-gifs': ['gifsList', 'gifs'],
    'bulk-assets': ['assetsList', 'assets']
  };
  function wireBulkUploads() {
    Object.keys(BULK_MAP).forEach(inputId => {
      const input = document.getElementById(inputId);
      if (!input) return;
      input.addEventListener('change', async () => {
        const files = Array.from(input.files || []);
        if (!files.length) return;
        const [containerId, type] = BULK_MAP[inputId];
        let done = 0;
        setStatus(`Yükleniyor... (0/${files.length})`, null);
        for (const file of files) {
          try {
            const url = await uploadFile(file);
            addRow(containerId, type, { url, caption: { tr: '', en: '' } });
            done++;
            setStatus(`Yükleniyor... (${done}/${files.length})`, null);
          } catch (e) {
            setStatus('Yükleme hatası: ' + e.message, 'err');
          }
        }
        markDirty();
        input.value = '';
        setStatus(`Yüklendi ✓ (${done}/${files.length})`, 'ok');
      });
    });
  }

  // ---------- orphaned file cleanup ----------
  let initialUrls = new Set();
  function collectAllUrls(data) {
    const game = data.game || {};
    const images = data.images || {};
    const videos = data.videos || {};
    const urls = new Set();
    const add = (u) => { if (u && /^\/uploads\//.test(u)) urls.add(u); };
    add(game.boxArt);
    add(game.keyArt);
    add(images.logo);
    (images.artwork || []).forEach(i => add(i && i.url));
    (images.screenshots || []).forEach(i => add(i && i.url));
    (images.gifs || []).forEach(i => add(i && i.url));
    (images.additionalAssets || []).forEach(i => add(i && i.url));
    (videos.items || []).forEach(v => add(v && v.url));
    return urls;
  }
  async function cleanupOrphanedFiles(newData) {
    const newUrls = collectAllUrls(newData);
    const orphaned = [...initialUrls].filter(u => !newUrls.has(u));
    for (const url of orphaned) {
      const filename = url.split('/').pop();
      try { await fetch('/api/upload/' + filename, { method: 'DELETE' }); } catch (e) { /* ignore */ }
    }
    initialUrls = newUrls;
  }

  // ---------- populate / collect ----------
  function populateForm(data) {
    data = data || {};
    const game = data.game || {};
    const details = data.details || {};
    const about = data.about || {};
    const videos = data.videos || {};
    const images = data.images || {};

    setVal('f-title', game.title);
    setVal('f-tagline-tr', bi(game.tagline).tr);
    setVal('f-tagline-en', bi(game.tagline).en);
    setSingleImageValue('f-boxArt-file', 'f-boxArt-preview', game.boxArt, 'f-boxArt-url');
    setSingleImageValue('f-keyArt-file', 'f-keyArt-preview', game.keyArt, 'f-keyArt-url');

    setVal('f-developer', details.developer);
    setVal('f-publisher', details.publisher);
    setVal('f-genre-tr', bi(details.genre).tr);
    setVal('f-genre-en', bi(details.genre).en);
    (details.platforms || []).forEach(p => addRow('platformsList', 'platform', p));
    (details.socialLinks || []).forEach(s => addRow('socialList', 'social', s));

    setVal('f-pitch-tr', bi(about.pitch).tr);
    setVal('f-pitch-en', bi(about.pitch).en);
    setVal('f-description-tr', bi(about.description).tr);
    setVal('f-description-en', bi(about.description).en);
    (about.keyFeatures || []).forEach(f => addRow('featuresList', 'feature', f));

    (data.contacts || []).forEach(c => addRow('contactsList', 'contact', c));

    setVal('f-videosDownload', videos.downloadLink);
    (videos.items || []).forEach(v => addRow('videosList', 'video', v));

    setVal('f-imagesDownload', images.downloadLink);
    setSingleImageValue('f-logo-file', 'f-logo-preview', images.logo, 'f-logo-url');
    (images.artwork || []).forEach(i => addRow('artworkList', 'artwork', i));
    (images.screenshots || []).forEach(i => addRow('screenshotsList', 'screenshots', i));
    (images.gifs || []).forEach(i => addRow('gifsList', 'gifs', i));
    (images.additionalAssets || []).forEach(i => addRow('assetsList', 'assets', i));

    (data.pressReleases || []).forEach(p => addRow('pressList', 'press', p));
  }

  function collectAll() {
    return {
      game: {
        title: val('f-title').trim(),
        tagline: { tr: val('f-tagline-tr').trim(), en: val('f-tagline-en').trim() },
        boxArt: document.getElementById('f-boxArt-file').dataset.url || '',
        keyArt: document.getElementById('f-keyArt-file').dataset.url || ''
      },
      details: {
        developer: val('f-developer').trim(),
        publisher: val('f-publisher').trim(),
        genre: { tr: val('f-genre-tr').trim(), en: val('f-genre-en').trim() },
        platforms: collectRows('platformsList', row => ({
          name: row.querySelector('.pf-name').value.trim(),
          url: row.querySelector('.pf-url').value.trim(),
          releaseDate: {
            tr: row.querySelector('.pf-date-tr').value.trim(),
            en: row.querySelector('.pf-date-en').value.trim()
          }
        })),
        socialLinks: collectRows('socialList', row => ({
          label: row.querySelector('.sc-label').value.trim(),
          url: row.querySelector('.sc-url').value.trim()
        }))
      },
      about: {
        pitch: { tr: val('f-pitch-tr').trim(), en: val('f-pitch-en').trim() },
        description: { tr: val('f-description-tr').trim(), en: val('f-description-en').trim() },
        keyFeatures: collectRows('featuresList', row => ({
          tr: row.querySelector('.ft-text-tr').value.trim(),
          en: row.querySelector('.ft-text-en').value.trim()
        }))
      },
      contacts: collectRows('contactsList', row => ({
        role: row.querySelector('.ct-role').value.trim(),
        name: row.querySelector('.ct-name').value.trim(),
        email: row.querySelector('.ct-email').value.trim()
      })),
      videos: {
        downloadLink: val('f-videosDownload').trim(),
        items: collectRows('videosList', row => ({
          title: {
            tr: row.querySelector('.vd-title-tr').value.trim(),
            en: row.querySelector('.vd-title-en').value.trim()
          },
          url: row.querySelector('.vd-url').value.trim()
        }))
      },
      images: {
        downloadLink: val('f-imagesDownload').trim(),
        logo: document.getElementById('f-logo-file').dataset.url || '',
        artwork: collectRows('artworkList', collectImageRow),
        screenshots: collectRows('screenshotsList', collectImageRow),
        gifs: collectRows('gifsList', collectImageRow),
        additionalAssets: collectRows('assetsList', collectImageRow)
      },
      pressReleases: collectRows('pressList', row => ({
        title: row.querySelector('.pr-title').value.trim(),
        url: row.querySelector('.pr-url').value.trim(),
        date: row.querySelector('.pr-date').value.trim()
      }))
    };
  }

  // ---------- save / export / import ----------
  async function save() {
    const data = collectAll();
    setStatus('Kaydediliyor...', null);
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Bilinmeyen hata');
      await cleanupOrphanedFiles(data);
      clearDirty();
      setStatus('Kaydedildi ✓', 'ok');
    } catch (e) {
      setStatus('Kaydetme hatası: ' + e.message, 'err');
    }
  }

  function exportJson() {
    const data = collectAll();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const safeName = (data.game.title || 'presskit-draft').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'presskit-draft';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = safeName + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
  }

  async function handleImport() {
    const input = document.getElementById('importFile');
    const file = input.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      clearAllRows();
      populateForm(data);
      markDirty();
      setStatus('JSON içe aktarıldı — kaydetmek için "Kaydet"e basın.', 'ok');
    } catch (e) {
      setStatus('İçe aktarma hatası: geçersiz JSON dosyası.', 'err');
    }
    input.value = '';
  }

  // ---------- init ----------
  const ADD_MAP = {
    platform: ['platformsList', 'platform'],
    social: ['socialList', 'social'],
    feature: ['featuresList', 'feature'],
    contact: ['contactsList', 'contact'],
    video: ['videosList', 'video'],
    artwork: ['artworkList', 'artwork'],
    screenshots: ['screenshotsList', 'screenshots'],
    gifs: ['gifsList', 'gifs'],
    assets: ['assetsList', 'assets'],
    press: ['pressList', 'press']
  };

  function initStaticHandlers() {
    wireSingleImageUpload('f-boxArt-file', 'f-boxArt-preview', 'f-boxArt-url');
    wireSingleImageUpload('f-keyArt-file', 'f-keyArt-preview', 'f-keyArt-url');
    wireSingleImageUpload('f-logo-file', 'f-logo-preview', 'f-logo-url');
    wireSingleImageUrlInput('f-boxArt-url', 'f-boxArt-file', 'f-boxArt-preview');
    wireSingleImageUrlInput('f-keyArt-url', 'f-keyArt-file', 'f-keyArt-preview');
    wireSingleImageUrlInput('f-logo-url', 'f-logo-file', 'f-logo-preview');
    wireBulkUploads();

    document.querySelectorAll('[data-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [containerId, type] = ADD_MAP[btn.dataset.add];
        addRow(containerId, type, {});
        markDirty();
      });
    });

    document.getElementById('saveBtn').addEventListener('click', save);
    document.getElementById('saveBtn2').addEventListener('click', save);
    document.getElementById('exportBtn').addEventListener('click', exportJson);
    document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', handleImport);
  }

  async function init() {
    initStaticHandlers();
    try {
      const res = await fetch('/api/data');
      const data = await res.json();
      populateForm(data);
      initialUrls = collectAllUrls(data);
      clearDirty();
      document.getElementById('loadState').textContent = 'Mevcut taslak yüklendi.';
    } catch (e) {
      document.getElementById('loadState').textContent = 'Veri yüklenemedi, boş form gösteriliyor.';
    }
  }

  init();
})();
