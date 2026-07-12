(function () {
  const STRINGS = {
    tr: {
      'nav.zip': 'Zip olarak indir',
      'nav.pdf': 'PDF olarak indir',
      'section.factsheet': 'Factsheet',
      'section.pitch': 'Pitch',
      'section.description': 'Açıklama',
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
      'kv.genre': 'Tür',
      'heading.platforms': 'Platform',
      'heading.social': 'Sosyal Medya',
      'video.open': 'Videoyu Aç',
      'wishlist.steam': "Steam'de İstek Listesine Ekle",
      'label.by': 'Yapımcı:'
    },
    en: {
      'nav.zip': 'Download zip',
      'nav.pdf': 'Download as PDF',
      'section.factsheet': 'Factsheet',
      'section.pitch': 'Pitch',
      'section.description': 'Description',
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
      'kv.genre': 'Genre',
      'heading.platforms': 'Platform',
      'heading.social': 'Social Media',
      'video.open': 'Open Video',
      'wishlist.steam': 'Wishlist on Steam',
      'label.by': 'By'
    }
  };

  // ---------- inline brand icons (decorative, paired with a text label) ----------
  const ICONS = {
    steam: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="9.5"/><circle cx="8.7" cy="15.3" r="2.3" fill="currentColor" stroke="none"/><circle cx="15.3" cy="8.3" r="2" fill="currentColor" stroke="none"/><line x1="8.7" y1="15.3" x2="14" y2="10"/></svg>',
    twitter: '<svg viewBox="0 0 24 24"><path d="M4 4l16 16M20 4L4 20" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M15 3c.3 2.2 1.8 4 4 4.3V10c-1.5 0-2.9-.5-4-1.3V15a5 5 0 1 1-5-5c.3 0 .7 0 1 .1v2.6a2.4 2.4 0 1 0 1.7 2.3V3H15z"/></svg>',
    bluesky: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 8.2C10.4 5.4 7.2 3 5.3 3.7c-1 3 .8 6 2.8 7-2 .4-3.4 2-2.9 3.9 1.9 2 5.3 1 6.8-1.3 1.5 2.3 4.9 3.3 6.8 1.3.5-1.9-.9-3.5-2.9-3.9 2-1 3.8-4 2.8-7-1.9-.7-5.1 1.7-6.7 4.5z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r="1" fill="currentColor" stroke="none"/></svg>',
    youtube: '<svg viewBox="0 0 24 24"><rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M10 8.5l6 3.5-6 3.5z" fill="currentColor"/></svg>',
    discord: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5C6 6 4.5 8 4 11c-.6 3-.5 6 1 7.5.7.5 1.6.3 2.2-.4l.8-1c1.2.4 2.5.6 4 .6s2.8-.2 4-.6l.8 1c.6.7 1.5.9 2.2.4 1.5-1.5 1.6-4.5 1-7.5-.5-3-2-5-4-5.5-1 .6-1 1-1 1-1-.2-2-.3-3-.3s-2 .1-3 .3c0 0 0-.4-1-1zM9 13a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6zm6 0a1.3 1.3 0 1 1 0-2.6 1.3 1.3 0 0 1 0 2.6z"/></svg>',
    website: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 4 6 4 9s-1.5 6.5-4 9c-2.5-2.5-4-6-4-9s1.5-6.5 4-9z"/></svg>'
  };

  function detectSocialBrand(url) {
    try {
      const u = new URL(url, window.location.origin);
      const host = u.hostname.replace(/^www\./, '').toLowerCase();
      if (host === 'twitter.com' || host === 'x.com') return { brand: 'twitter', label: 'Twitter' };
      if (host === 'tiktok.com') return { brand: 'tiktok', label: 'TikTok' };
      if (host === 'bsky.app') return { brand: 'bluesky', label: 'Bluesky' };
      if (host === 'instagram.com') return { brand: 'instagram', label: 'Instagram' };
      if (host === 'youtube.com' || host === 'youtu.be') return { brand: 'youtube', label: 'YouTube' };
      if (host === 'discord.gg' || host === 'discord.com') return { brand: 'discord', label: 'Discord' };
    } catch (e) { /* ignore, fall through */ }
    return { brand: 'website', label: null };
  }

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
    document.getElementById('pageTitle').textContent = title;
    document.getElementById('heroTagline').textContent = pick(game.tagline, lang);

    const bgUrl = game.keyArt || game.boxArt;
    if (bgUrl) {
      document.getElementById('heroBg').style.backgroundImage = `url('${bgUrl.replace(/'/g, "\\'")}')`;
    }

    // Hero logo: prefer the uploaded logo image, fall back to the title as text
    const heroLogoImg = document.getElementById('heroLogoImg');
    const heroTitle = document.getElementById('heroTitle');
    if (images.logo) {
      heroLogoImg.src = images.logo;
      heroLogoImg.style.display = '';
      heroTitle.style.display = 'none';
    } else {
      heroLogoImg.style.display = 'none';
      heroTitle.style.display = '';
      heroTitle.textContent = game.title || 'Oyun Adı';
    }

    // Cover art floats over the hero
    const coverArtWrap = document.getElementById('coverArtWrap');
    if (game.boxArt) {
      coverArtWrap.innerHTML = `<img src="${esc(game.boxArt)}" alt="${esc(title)}">`;
      coverArtWrap.style.display = '';
    } else {
      coverArtWrap.innerHTML = '';
      coverArtWrap.style.display = 'none';
    }

    // Byline
    const byline = document.getElementById('byline');
    const bylineName = details.developer || details.publisher || '';
    byline.textContent = bylineName ? `${t('label.by')} ${bylineName}` : '';
    byline.style.display = bylineName ? '' : 'none';

    // Factsheet: genre
    const genre = pick(details.genre, lang);
    const genreWrap = document.getElementById('genreWrap');
    genreWrap.innerHTML = genre
      ? `<span class="fact-label">${esc(t('kv.genre'))}:</span><div>${esc(genre)}</div>`
      : '';

    // Factsheet: platforms (+ Steam wishlist hero badge)
    const platforms = (details.platforms || []).filter(p => p && p.name);
    const platformsWrap = document.getElementById('platformsWrap');
    if (platforms.length) {
      platformsWrap.innerHTML = `<span class="fact-label">${esc(t('heading.platforms'))}:</span><div class="pill-row">${
        platforms.map(p => {
          const isSteam = /steam/i.test(p.name);
          const brand = isSteam ? 'steam' : 'generic';
          const date = pick(p.releaseDate, lang);
          const label = date ? `${p.name} — ${date}` : p.name;
          const icon = ICONS[brand] || ICONS.website;
          const tag = p.url ? 'a' : 'span';
          const hrefAttr = p.url ? ` href="${esc(p.url)}" target="_blank" rel="noopener"` : '';
          return `<${tag} class="icon-pill" data-brand="${brand}"${hrefAttr}>${icon}${esc(label)}</${tag}>`;
        }).join('')
      }</div>`;
    } else {
      platformsWrap.innerHTML = '';
    }

    const steamPlatform = platforms.find(p => /steam/i.test(p.name) && p.url);
    const heroWishlist = document.getElementById('heroWishlist');
    if (steamPlatform) {
      heroWishlist.href = steamPlatform.url;
      heroWishlist.innerHTML = `${ICONS.steam}<span>${esc(t('wishlist.steam'))}</span>`;
      heroWishlist.style.display = '';
    } else {
      heroWishlist.style.display = 'none';
    }

    // Factsheet: social media
    const social = (details.socialLinks || []).filter(s => s && s.url);
    const socialWrap = document.getElementById('socialWrap');
    if (social.length) {
      socialWrap.innerHTML = `<span class="fact-label">${esc(t('heading.social'))}:</span><div class="pill-row">${
        social.map(s => {
          const { brand, label } = detectSocialBrand(s.url);
          const icon = ICONS[brand] || ICONS.website;
          return `<a class="icon-pill" data-brand="${brand}" href="${esc(s.url)}" target="_blank" rel="noopener">${icon}${esc(s.label || label || s.url)}</a>`;
        }).join('')
      }</div>`;
    } else {
      socialWrap.innerHTML = '';
    }

    // Pitch
    const pitchText = document.getElementById('pitchText');
    const pitchStr = pick(about.pitch, lang);
    if (pitchStr) {
      pitchText.textContent = pitchStr;
      pitchText.classList.remove('empty-note');
    } else {
      pitchText.textContent = t('empty.about');
      pitchText.classList.add('empty-note');
    }

    // Description
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

    // Side navigation: only link to sections that actually have content
    const navItems = [];
    if (platforms.length || social.length || genre) navItems.push({ id: 'factsheetSection', label: t('section.factsheet') });
    if (pitchStr || descText || features.length) navItems.push({ id: 'pitchSection', label: t('section.pitch') });
    if (validContacts.length) navItems.push({ id: 'contactsSection', label: t('section.contacts') });
    if (videoItems.length) navItems.push({ id: 'videosSection', label: t('section.videos') });
    if (hasAnyImage) navItems.push({ id: 'imagesSection', label: t('section.images') });
    if (validPress.length) navItems.push({ id: 'pressSection', label: t('section.press') });
    document.getElementById('sideNav').innerHTML = navItems.map(i => `<a href="#${i.id}">${esc(i.label)}</a>`).join('');

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
