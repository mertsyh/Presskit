(function () {
  const STRINGS = {
    tr: {
      'nav.zip': 'Zip olarak indir',
      'nav.pdf': 'PDF olarak indir',
      'section.gameinfo': 'Oyun Bilgileri',
      'section.about': 'Oyun Hakkında',
      'section.features': 'Öne Çıkan Özellikler',
      'section.contacts': 'İletişim',
      'section.videos': 'Videolar',
      'section.images': 'Görseller',
      'section.press': 'Basın Bültenleri',
      'sub.artwork': 'Artwork',
      'sub.screenshots': 'Ekran Görüntüleri',
      'sub.gifs': "GIF'ler",
      'sub.logo': 'Logo',
      'sub.assets': 'Ek Görseller',
      'link.videosdownload': 'Tüm videoları indir',
      'link.imagesdownload': 'Tüm görselleri indir',
      'empty.about': 'Henüz içerik girilmedi.',
      'kv.developer': 'Geliştirici',
      'kv.publisher': 'Yayıncı',
      'kv.genre': 'Tür',
      'kv.platform': 'Platform',
      'heading.platforms': 'Platformlar & Çıkış Tarihleri',
      'heading.social': 'Sosyal Medya',
      'video.open': 'Videoyu Aç',
      'quickfacts.release': 'Çıkış'
    },
    en: {
      'nav.zip': 'Download zip',
      'nav.pdf': 'Download as PDF',
      'section.gameinfo': 'Game Info',
      'section.about': 'About',
      'section.features': 'Key Features',
      'section.contacts': 'Contact',
      'section.videos': 'Videos',
      'section.images': 'Images',
      'section.press': 'Press Releases',
      'sub.artwork': 'Artwork',
      'sub.screenshots': 'Screenshots',
      'sub.gifs': 'GIFs',
      'sub.logo': 'Logo',
      'sub.assets': 'Additional Assets',
      'link.videosdownload': 'Download all videos',
      'link.imagesdownload': 'Download all images',
      'empty.about': 'No content yet.',
      'kv.developer': 'Developer',
      'kv.publisher': 'Publisher',
      'kv.genre': 'Genre',
      'kv.platform': 'Platform',
      'heading.platforms': 'Platforms & Release Dates',
      'heading.social': 'Social Media',
      'video.open': 'Open Video',
      'quickfacts.release': 'Release'
    }
  };

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pick(field, lang) {
    if (field && typeof field === 'object') return field[lang] || field.tr || field.en || '';
    return field || '';
  }

  function isVideoFile(url) {
    return /\.(mp4|webm)$/i.test(url || '');
  }

  function isPrintMode() {
    return new URLSearchParams(window.location.search).get('print') === '1';
  }

  function toEmbedUrl(url) {
    try {
      const u = new URL(url, window.location.origin);
      const host = u.hostname.replace(/^www\./, '');
      if (host === 'youtube.com' || host === 'm.youtube.com') {
        if (u.pathname.startsWith('/embed/')) return url;
        const id = u.searchParams.get('v');
        if (id) return 'https://www.youtube.com/embed/' + id;
      }
      if (host === 'youtu.be') {
        const id = u.pathname.slice(1);
        if (id) return 'https://www.youtube.com/embed/' + id;
      }
      if (host === 'vimeo.com') {
        const id = u.pathname.split('/').filter(Boolean).pop();
        if (id) return 'https://player.vimeo.com/video/' + id;
      }
    } catch (e) { /* ignore */ }
    return null;
  }

  // ---------- language ----------
  function getInitialLang() {
    const params = new URLSearchParams(window.location.search);
    const paramLang = params.get('lang');
    if (paramLang === 'en' || paramLang === 'tr') return paramLang;
    const stored = localStorage.getItem('presskit-lang');
    if (stored === 'en' || stored === 'tr') return stored;
    return 'tr';
  }

  let currentLang = getInitialLang();
  let currentData = null;

  function t(key) {
    return (STRINGS[currentLang] && STRINGS[currentLang][key]) || key;
  }

  function applyStaticStrings() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    document.documentElement.lang = currentLang;
    const toggle = document.getElementById('langToggle');
    if (toggle) toggle.textContent = currentLang === 'tr' ? 'EN' : 'TR';
  }

  function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('presskit-lang', lang);
    if (currentData) render(currentData);
  }

  // ---------- lightbox ----------
  let lightboxItems = [];
  let lightboxIndex = 0;

  function showLightboxItem() {
    const item = lightboxItems[lightboxIndex];
    if (!item) return;
    document.getElementById('lightboxImg').src = item.url;
    document.getElementById('lightboxImg').alt = item.caption || '';
    document.getElementById('lightboxCaption').textContent = item.caption || '';
    const multi = lightboxItems.length > 1;
    document.getElementById('lightboxPrev').style.display = multi ? '' : 'none';
    document.getElementById('lightboxNext').style.display = multi ? '' : 'none';
  }

  function openLightbox(items, index) {
    lightboxItems = items;
    lightboxIndex = index;
    showLightboxItem();
    document.getElementById('lightbox').classList.add('show');
    document.body.classList.add('lightbox-open');
  }

  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('show');
    document.body.classList.remove('lightbox-open');
  }

  function lightboxStep(delta) {
    if (!lightboxItems.length) return;
    lightboxIndex = (lightboxIndex + delta + lightboxItems.length) % lightboxItems.length;
    showLightboxItem();
  }

  function initLightbox() {
    document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev').addEventListener('click', () => lightboxStep(-1));
    document.getElementById('lightboxNext').addEventListener('click', () => lightboxStep(1));
    document.getElementById('lightbox').addEventListener('click', (e) => {
      if (e.target.id === 'lightbox') closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      const lb = document.getElementById('lightbox');
      if (!lb.classList.contains('show')) return;
      if (e.key === 'Escape') closeLightbox();
      else if (e.key === 'ArrowLeft') lightboxStep(-1);
      else if (e.key === 'ArrowRight') lightboxStep(1);
    });
  }

  function renderGallery(container, items, lang) {
    const valid = (items || []).filter(i => i && i.url);
    const heading = container.previousElementSibling;
    const headingIsH3 = heading && heading.tagName === 'H3';
    if (!valid.length) {
      if (headingIsH3) heading.style.display = 'none';
      container.style.display = 'none';
      return;
    }
    container.style.display = '';
    if (headingIsH3) heading.style.display = '';
    const loadingAttr = isPrintMode() ? '' : 'loading="lazy"';
    container.innerHTML = valid.map((i, idx) => {
      const caption = pick(i.caption, lang);
      return `
      <figure>
        <a href="${esc(i.url)}" target="_blank" rel="noopener" data-idx="${idx}">
          <img src="${esc(i.url)}" alt="${esc(caption)}" ${loadingAttr}>
        </a>
        ${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}
      </figure>
    `;
    }).join('');

    const lightboxData = valid.map(i => ({ url: i.url, caption: pick(i.caption, lang) }));
    container.querySelectorAll('a[data-idx]').forEach(a => {
      a.addEventListener('click', (e) => {
        e.preventDefault();
        openLightbox(lightboxData, parseInt(a.dataset.idx, 10));
      });
    });
  }

  function renderQuickFacts(details, lang) {
    const el = document.getElementById('quickFacts');
    const items = [];
    if (details.developer) items.push({ label: t('kv.developer'), value: details.developer });
    if (details.publisher) items.push({ label: t('kv.publisher'), value: details.publisher });
    const genre = pick(details.genre, lang);
    if (genre) items.push({ label: t('kv.genre'), value: genre });
    const platforms = (details.platforms || []).filter(p => p && p.name);
    if (platforms.length) {
      items.push({ label: t('kv.platform'), value: platforms.map(p => p.name).join(', ') });
      const firstDate = platforms.map(p => pick(p.releaseDate, lang)).find(d => d);
      if (firstDate) items.push({ label: t('quickfacts.release'), value: firstDate });
    }
    if (!items.length) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
    el.innerHTML = items.map(i => `<div class="qf-item"><span class="qf-label">${esc(i.label)}</span><span class="qf-value">${esc(i.value)}</span></div>`).join('');
  }

  function waitForImages() {
    const imgs = Array.from(document.querySelectorAll('img'));
    const pending = imgs.filter(img => !img.complete);
    if (!pending.length) return Promise.resolve();
    return Promise.all(pending.map(img => new Promise(resolve => {
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    })));
  }

  function render(data) {
    applyStaticStrings();
    const lang = currentLang;

    const game = data.game || {};
    const details = data.details || {};
    const about = data.about || {};
    const contacts = data.contacts || [];
    const videos = data.videos || {};
    const images = data.images || {};
    const pressReleases = data.pressReleases || [];

    const title = game.title || 'Press Kit';
    document.title = title + ' — Press Kit';
    document.getElementById('brandName').textContent = title;
    document.getElementById('heroTitle').textContent = game.title || 'Oyun Adı';
    document.getElementById('heroTagline').textContent = pick(game.tagline, lang);

    const bgUrl = game.keyArt || game.boxArt;
    if (bgUrl) {
      document.getElementById('heroBg').style.backgroundImage = `url('${bgUrl.replace(/'/g, "\\'")}')`;
    }

    renderQuickFacts(details, lang);

    // Details
    const kv = document.getElementById('detailsKv');
    const kvRows = [];
    if (details.developer) kvRows.push([t('kv.developer'), details.developer]);
    if (details.publisher) kvRows.push([t('kv.publisher'), details.publisher]);
    const genre = pick(details.genre, lang);
    if (genre) kvRows.push([t('kv.genre'), genre]);
    kv.innerHTML = kvRows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');

    const platforms = (details.platforms || []).filter(p => p && p.name);
    const platformsWrap = document.getElementById('platformsWrap');
    if (platforms.length) {
      platformsWrap.innerHTML = `<h3>${esc(t('heading.platforms'))}</h3><div class="pill-row">${
        platforms.map(p => {
          const date = pick(p.releaseDate, lang);
          return `<span class="pill">${esc(p.name)}${date ? ' — ' + esc(date) : ''}</span>`;
        }).join('')
      }</div>`;
    } else {
      platformsWrap.innerHTML = '';
    }

    const social = (details.socialLinks || []).filter(s => s && s.url);
    const socialWrap = document.getElementById('socialWrap');
    if (social.length) {
      socialWrap.innerHTML = `<h3>${esc(t('heading.social'))}</h3><div class="pill-row">${
        social.map(s => `<a class="pill" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label || s.url)}</a>`).join('')
      }</div>`;
    } else {
      socialWrap.innerHTML = '';
    }

    // About
    const aboutDesc = document.getElementById('aboutDesc');
    const descText = pick(about.description, lang);
    if (descText) {
      aboutDesc.textContent = descText;
      aboutDesc.classList.remove('empty-note');
    } else {
      aboutDesc.textContent = t('empty.about');
      aboutDesc.classList.add('empty-note');
    }
    const features = (about.keyFeatures || []).map(f => pick(f, lang)).filter(f => f && f.trim());
    const featuresList = document.getElementById('featuresList');
    const featuresHeading = featuresList.parentElement.querySelector('h3');
    if (features.length) {
      featuresList.innerHTML = features.map(f => `<li>${esc(f)}</li>`).join('');
      featuresList.style.display = '';
      if (featuresHeading) featuresHeading.style.display = '';
    } else {
      featuresList.style.display = 'none';
      if (featuresHeading) featuresHeading.style.display = 'none';
    }

    // Contacts
    const validContacts = contacts.filter(c => c && (c.name || c.email));
    const contactsSection = document.getElementById('contactsSection');
    if (validContacts.length) {
      contactsSection.style.display = '';
      document.getElementById('contactsGrid').innerHTML = validContacts.map(c => `
        <div class="contact-card">
          <div class="role">${esc(c.role || 'İletişim')}</div>
          ${c.name ? `<div>${esc(c.name)}</div>` : ''}
          ${c.email ? `<div><a href="mailto:${esc(c.email)}">${esc(c.email)}</a></div>` : ''}
        </div>
      `).join('');
    } else {
      contactsSection.style.display = 'none';
    }

    // Videos
    const videoItems = (videos.items || []).filter(v => v && v.url);
    const videosSection = document.getElementById('videosSection');
    if (videoItems.length) {
      videosSection.style.display = '';
      const dlLink = document.getElementById('videosDownload');
      if (videos.downloadLink) {
        dlLink.href = videos.downloadLink;
        dlLink.style.display = 'inline-block';
      } else {
        dlLink.style.display = 'none';
      }
      document.getElementById('videoGrid').innerHTML = videoItems.map(v => {
        const vTitle = pick(v.title, lang);
        // PDF/print çıktısında <video>/<iframe> embed'leri boş veya bozuk görünüyor
        // (Chrome print/PDF motoru bunları düzgün çizmiyor); bunun yerine tıklanabilir link göster.
        if (isPrintMode()) {
          return `<div class="video-item video-item-print">
            <div class="video-print-label">▶</div>
            <div class="video-print-info">
              ${vTitle ? `<div class="video-title">${esc(vTitle)}</div>` : ''}
              <a href="${esc(v.url)}">${esc(v.url)}</a>
            </div>
          </div>`;
        }
        let inner;
        if (isVideoFile(v.url)) {
          inner = `<video controls src="${esc(v.url)}"></video>`;
        } else {
          const embed = toEmbedUrl(v.url);
          inner = embed
            ? `<iframe src="${esc(embed)}" allowfullscreen loading="lazy"></iframe>`
            : `<a href="${esc(v.url)}" target="_blank" rel="noopener" style="display:flex;align-items:center;justify-content:center;height:100%;">${esc(t('video.open'))}</a>`;
        }
        return `<div class="video-item">
          <div class="frame-wrap">${inner}</div>
          ${vTitle ? `<div class="video-title">${esc(vTitle)}</div>` : ''}
        </div>`;
      }).join('');
    } else {
      videosSection.style.display = 'none';
    }

    // Images
    const hasAnyImage = ['artwork', 'screenshots', 'gifs', 'additionalAssets'].some(k => (images[k] || []).some(i => i && i.url)) || images.logo;
    const imagesSection = document.getElementById('imagesSection');
    if (hasAnyImage) {
      imagesSection.style.display = '';
      const dlLink = document.getElementById('imagesDownload');
      if (images.downloadLink) {
        dlLink.href = images.downloadLink;
        dlLink.style.display = 'inline-block';
      } else {
        dlLink.style.display = 'none';
      }
      renderGallery(document.getElementById('artworkGallery'), images.artwork, lang);
      renderGallery(document.getElementById('screenshotsGallery'), images.screenshots, lang);
      renderGallery(document.getElementById('gifsGallery'), images.gifs, lang);
      renderGallery(document.getElementById('assetsGallery'), images.additionalAssets, lang);

      const logoBox = document.getElementById('logoBox');
      const logoHeading = logoBox.previousElementSibling;
      if (images.logo) {
        logoBox.innerHTML = `<img src="${esc(images.logo)}" alt="Logo">`;
        logoBox.style.display = '';
        if (logoHeading) logoHeading.style.display = '';
      } else {
        logoBox.style.display = 'none';
        if (logoHeading) logoHeading.style.display = 'none';
      }
    } else {
      imagesSection.style.display = 'none';
    }

    // Press releases
    const validPress = pressReleases.filter(p => p && (p.title || p.url));
    const pressSection = document.getElementById('pressSection');
    if (validPress.length) {
      pressSection.style.display = '';
      document.getElementById('pressList').innerHTML = validPress.map(p => `
        <a class="press-item" href="${esc(p.url || '#')}" target="_blank" rel="noopener">
          <div>${esc(p.title || p.url)}</div>
          ${p.date ? `<div class="date">${esc(p.date)}</div>` : ''}
        </a>
      `).join('');
    } else {
      pressSection.style.display = 'none';
    }

    document.getElementById('pdfBtn').href = '/api/pdf?lang=' + lang;
  }

  async function fetchAndRender() {
    let data;
    try {
      const res = await fetch('/api/data');
      data = await res.json();
    } catch (e) {
      document.querySelector('.wrap').innerHTML = '<p class="empty-note">Veri yüklenemedi.</p>';
      return;
    }
    currentData = data;
    render(data);
    await waitForImages();
    document.body.dataset.ready = '1';
  }

  document.getElementById('langToggle').addEventListener('click', () => {
    setLang(currentLang === 'tr' ? 'en' : 'tr');
  });

  initLightbox();
  fetchAndRender();
})();
