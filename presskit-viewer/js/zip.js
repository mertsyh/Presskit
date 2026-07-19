(function () {
  function slugify(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFKD').replace(/[^\x00-\x7f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  function pick(field, lang) {
    if (field && typeof field === 'object') return field[lang || 'tr'] || field.tr || field.en || '';
    return field || '';
  }

  function isVideoFile(url) {
    return /\.(mp4|webm)$/i.test(url || '');
  }

  function extFromUrl(url, mimeType) {
    try {
      const pathname = new URL(url, window.location.href).pathname;
      const m = pathname.match(/\.[a-z0-9]{2,5}$/i);
      if (m) return m[0].toLowerCase();
    } catch (e) { /* ignore */ }
    const byMime = {
      'image/png': '.png', 'image/jpeg': '.jpg', 'image/gif': '.gif',
      'image/webp': '.webp', 'video/mp4': '.mp4', 'video/webm': '.webm'
    };
    return byMime[mimeType] || '';
  }

  function buildCategories(data) {
    const game = data.game || {};
    const images = data.images || {};
    const videos = data.videos || {};

    const categories = [];
    if (game.boxArt) categories.push({ name: 'Box Art', items: [{ url: game.boxArt, caption: '' }] });
    if (game.keyArt) categories.push({ name: 'Key Art', items: [{ url: game.keyArt, caption: '' }] });
    if (images.logo) categories.push({ name: 'Logo', items: [{ url: images.logo, caption: '' }] });
    if ((images.artwork || []).some(i => i && i.url)) categories.push({ name: 'Artwork', items: images.artwork });
    if ((images.screenshots || []).some(i => i && i.url)) categories.push({ name: 'Screenshots', items: images.screenshots });
    if ((images.gifs || []).some(i => i && i.url)) categories.push({ name: 'GIFs', items: images.gifs });
    if ((images.additionalAssets || []).some(i => i && i.url)) categories.push({ name: 'Ek Görseller', items: images.additionalAssets });

    const localVideos = (videos.items || []).filter(v => v && v.url && isVideoFile(v.url));
    if (localVideos.length) {
      categories.push({
        name: 'Videos',
        items: localVideos.map(v => ({ url: v.url, caption: pick(v.title, 'tr') }))
      });
    }
    return categories;
  }

  async function downloadZip(data) {
    if (typeof JSZip === 'undefined') {
      alert('JSZip kütüphanesi yüklenemedi.');
      return;
    }
    const categories = buildCategories(data);
    const zip = new JSZip();
    let addedAny = false;
    const failed = [];

    for (const cat of categories) {
      const valid = cat.items.filter(i => i && i.url);
      const multiple = valid.length > 1;
      const usedNames = new Set();

      for (let idx = 0; idx < valid.length; idx++) {
        const item = valid[idx];
        try {
          const resp = await fetch(item.url, { mode: 'cors' });
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          const blob = await resp.blob();
          const ext = extFromUrl(item.url, blob.type) || '';
          const captionText = typeof item.caption === 'object' ? pick(item.caption, 'tr') : item.caption;
          const base = slugify(captionText) || (slugify(cat.name) + '-' + (idx + 1));
          let name = base + ext;
          let n = 2;
          while (usedNames.has(name)) {
            name = base + '-' + n + ext;
            n++;
          }
          usedNames.add(name);
          const entryPath = multiple ? (cat.name + '/' + name) : name;
          zip.file(entryPath, blob);
          addedAny = true;
        } catch (e) {
          failed.push(item.url);
        }
      }
    }

    if (!addedAny) {
      alert(failed.length
        ? 'Hiçbir görsel indirilemedi. Görsel URL\'lerinin herkese açık ve CORS\'a izin veren bir adresten (örn. raw.githubusercontent.com) geldiğinden emin olun.'
        : 'İndirilecek görsel/video bulunamadı.');
      return;
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const safeTitle = slugify((data.game && data.game.title) || 'presskit') || 'presskit';
    const a = document.createElement('a');
    a.href = URL.createObjectURL(content);
    a.download = safeTitle + '-presskit.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);

    if (failed.length) {
      alert(failed.length + ' görsel/video indirilemedi (CORS ya da erişim hatası), zip\'e eklenmedi:\n' + failed.join('\n'));
    }
  }

  window.PresskitZip = { downloadZip, buildCategories, slugify };
})();
