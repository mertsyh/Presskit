const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const archiver = require('archiver');
const sharp = require('sharp');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, 'data', 'data.json');
const AUTH_FILE = path.join(__dirname, 'data', 'auth.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

// ---------- admin auth ----------
function loadOrCreateAuth() {
  try {
    const parsed = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'));
    if (parsed && parsed.username && parsed.password) return parsed;
  } catch (e) { /* dosya yok ya da bozuk, yenisini oluştur */ }
  const auth = { username: 'admin', password: crypto.randomBytes(9).toString('base64url') };
  fs.writeFileSync(AUTH_FILE, JSON.stringify(auth, null, 2), 'utf8');
  console.log('\n==============================================');
  console.log('Admin panel için otomatik giriş bilgileri oluşturuldu:');
  console.log('  Kullanıcı adı: ' + auth.username);
  console.log('  Şifre:        ' + auth.password);
  console.log('Bu bilgiler data/auth.json dosyasında saklanıyor; istersen o dosyayı düzenleyerek değiştirebilirsin.');
  console.log('==============================================\n');
  return auth;
}
const ADMIN_AUTH = loadOrCreateAuth();

function timingSafeEqualStr(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const sepIdx = header.indexOf(' ');
  const scheme = sepIdx === -1 ? header : header.slice(0, sepIdx);
  const encoded = sepIdx === -1 ? '' : header.slice(sepIdx + 1);
  if (scheme === 'Basic' && encoded) {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const colonIdx = decoded.indexOf(':');
    const user = colonIdx === -1 ? decoded : decoded.slice(0, colonIdx);
    const pass = colonIdx === -1 ? '' : decoded.slice(colonIdx + 1);
    if (timingSafeEqualStr(user, ADMIN_AUTH.username) && timingSafeEqualStr(pass, ADMIN_AUTH.password)) {
      return next();
    }
  }
  res.set('WWW-Authenticate', 'Basic realm="Press Kit Panel"');
  res.status(401).send('Yetkilendirme gerekli.');
}

const ALLOWED_EXT = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.mp4', '.webm']);
const RESIZABLE_EXT = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const MAX_DIMENSION = 2560;
const SAFE_FILENAME = /^[a-f0-9]{16}\.(png|jpg|jpeg|gif|webp|mp4|webm)$/i;

// ---------- helpers ----------
function slugify(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD').replace(/[^\x00-\x7f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function escAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function pickText(field, lang) {
  if (field && typeof field === 'object') return field[lang] || field.tr || field.en || '';
  return field || '';
}

// ---------- bilingual data migration ----------
function toBilingual(v) {
  if (v && typeof v === 'object' && !Array.isArray(v)) return { tr: v.tr || '', en: v.en || '' };
  return { tr: v || '', en: '' };
}

function migrateData(data) {
  data = data || {};
  data.game = data.game || {};
  data.details = data.details || {};
  data.about = data.about || {};
  data.videos = data.videos || {};
  data.images = data.images || {};

  data.game.tagline = toBilingual(data.game.tagline);
  data.details.genre = toBilingual(data.details.genre);
  data.details.platforms = (data.details.platforms || []).map(p => ({
    name: (p && p.name) || '',
    url: (p && p.url) || '',
    releaseDate: toBilingual(p && p.releaseDate)
  }));
  data.about.pitch = toBilingual(data.about.pitch);
  data.about.description = toBilingual(data.about.description);
  data.about.keyFeatures = (data.about.keyFeatures || []).map(f => toBilingual(f));
  data.videos.items = (data.videos.items || []).map(v => ({
    title: toBilingual(v && v.title),
    url: (v && v.url) || ''
  }));
  ['artwork', 'screenshots', 'gifs', 'additionalAssets'].forEach(key => {
    data.images[key] = (data.images[key] || []).map(i => ({
      url: (i && i.url) || '',
      caption: toBilingual(i && i.caption)
    }));
  });
  return data;
}

function migrateDataFile() {
  let raw;
  try {
    raw = fs.readFileSync(DATA_FILE, 'utf8');
  } catch (e) {
    return;
  }
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    console.error('data.json parse edilemedi, migrasyon atlandı.');
    return;
  }
  const migrated = migrateData(data);
  const migratedJson = JSON.stringify(migrated, null, 2);
  // Veri zaten güncel şemadaysa dosyaya dokunma: her boot'ta koşulsuz yazmak
  // (özellikle aynı anda ikinci bir sunucu örneği başlarsa) az önce kaydedilmiş
  // yeni içeriğin üzerine eski bir kopyanın yazılmasına yol açabiliyordu.
  if (migratedJson !== raw) {
    const tmpFile = DATA_FILE + '.tmp';
    fs.writeFileSync(tmpFile, migratedJson, 'utf8');
    fs.renameSync(tmpFile, DATA_FILE);
    console.log('data.json bilingual şemaya migrate edildi.');
  }
}
migrateDataFile();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = crypto.randomBytes(8).toString('hex') + ext;
    cb(null, safeName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB per file
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) {
      return cb(new Error('Desteklenmeyen dosya türü: ' + ext));
    }
    cb(null, true);
  }
});

app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(UPLOADS_DIR));

// --- Data API ---
app.get('/api/data', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, content) => {
    if (err) return res.status(500).json({ error: 'Veri okunamadı.' });
    res.type('application/json').send(content);
  });
});

app.post('/api/data', requireAdminAuth, (req, res) => {
  const data = req.body;
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return res.status(400).json({ error: 'Geçersiz veri.' });
  }
  const json = JSON.stringify(data, null, 2);
  const tmpFile = DATA_FILE + '.tmp';
  fs.writeFile(tmpFile, json, 'utf8', (err) => {
    if (err) return res.status(500).json({ error: 'Veri kaydedilemedi.' });
    fs.rename(tmpFile, DATA_FILE, (err2) => {
      if (err2) return res.status(500).json({ error: 'Veri kaydedilemedi.' });
      res.json({ ok: true });
    });
  });
});

// --- Upload API ---
app.post('/api/upload', requireAdminAuth, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı.' });

    const ext = path.extname(req.file.filename).toLowerCase();
    if (RESIZABLE_EXT.has(ext)) {
      const filePath = path.join(UPLOADS_DIR, req.file.filename);
      try {
        // Windows'ta multer'ın yeni yazdığı dosyayı path üzerinden hemen
        // tekrar açmak libvips'te ara sıra "unknown error" veriyor;
        // bunun yerine dosyayı Node fs ile okuyup sharp'a buffer veriyoruz.
        const inputBuffer = await fs.promises.readFile(filePath);
        const meta = await sharp(inputBuffer).metadata();
        let pipeline = sharp(inputBuffer).rotate();
        if ((meta.width && meta.width > MAX_DIMENSION) || (meta.height && meta.height > MAX_DIMENSION)) {
          pipeline = pipeline.resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true });
        }
        if (ext === '.png') pipeline = pipeline.png({ compressionLevel: 8 });
        else if (ext === '.webp') pipeline = pipeline.webp({ quality: 82 });
        else pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });

        const outBuffer = await pipeline.toBuffer();
        await fs.promises.writeFile(filePath, outBuffer);
      } catch (e) {
        console.warn('Görsel optimize edilemedi:', e.message);
      }
    }

    res.json({ url: '/uploads/' + req.file.filename });
  });
});

app.delete('/api/upload/:filename', requireAdminAuth, (req, res) => {
  const filename = req.params.filename;
  if (!SAFE_FILENAME.test(filename)) {
    return res.status(400).json({ error: 'Geçersiz dosya adı.' });
  }
  const filePath = path.join(UPLOADS_DIR, filename);
  fs.unlink(filePath, (err) => {
    if (err && err.code !== 'ENOENT') {
      return res.status(500).json({ error: 'Dosya silinemedi.' });
    }
    res.json({ ok: true });
  });
});

// --- Zip download ---
app.get('/api/download-zip', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, content) => {
    if (err) return res.status(500).json({ error: 'Veri okunamadı.' });
    let data;
    try { data = JSON.parse(content); } catch (e) { return res.status(500).json({ error: 'Veri okunamadı.' }); }

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

    const localVideos = (videos.items || []).filter(v => v && v.url && /^\/uploads\//.test(v.url));
    if (localVideos.length) {
      categories.push({
        name: 'Videos',
        items: localVideos.map(v => ({ url: v.url, caption: pickText(v.title, 'tr') }))
      });
    }

    const hasAny = categories.some(c => c.items.some(i => i && i.url && /^\/uploads\//.test(i.url)));
    if (!hasAny) return res.status(404).json({ error: 'İndirilecek görsel/video bulunamadı.' });

    const safeTitle = slugify(game.title) || 'presskit';
    res.attachment(safeTitle + '-presskit.zip');
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (e) => { console.error(e); res.end(); });
    archive.pipe(res);

    const usedPaths = new Set();
    categories.forEach(cat => {
      const valid = cat.items.filter(i => i && i.url && /^\/uploads\//.test(i.url));
      const multiple = valid.length > 1;
      valid.forEach((item, idx) => {
        const filename = path.basename(item.url);
        const filePath = path.join(UPLOADS_DIR, filename);
        if (!fs.existsSync(filePath)) return;
        const ext = path.extname(filename);
        const caption = typeof item.caption === 'object' ? pickText(item.caption, 'tr') : item.caption;
        const base = slugify(caption) || (slugify(cat.name) + '-' + (idx + 1));
        let name = base + ext;
        let entryPath = multiple ? (cat.name + '/' + name) : name;
        let n = 2;
        while (usedPaths.has(entryPath)) {
          name = base + '-' + n + ext;
          entryPath = multiple ? (cat.name + '/' + name) : name;
          n++;
        }
        usedPaths.add(entryPath);
        archive.file(filePath, { name: entryPath });
      });
    });

    archive.finalize();
  });
});

// --- PDF export ---
app.get('/api/pdf', async (req, res) => {
  const lang = req.query.lang === 'en' ? 'en' : 'tr';
  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.goto(`http://localhost:${PORT}/?print=1&lang=${lang}`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('body[data-ready="1"]', { timeout: 15000 });
    await page.emulateMediaType('print');
    // Puppeteer 22+ page.pdf() Node Buffer değil Uint8Array döndürebiliyor;
    // Express'in binary olarak tanıyıp doğru göndermesi için Buffer'a çeviriyoruz.
    const pdfBuffer = Buffer.from(await page.pdf({ format: 'A4', printBackground: true }));

    let data = {};
    try { data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) { /* ignore */ }
    const safeTitle = slugify((data.game && data.game.title) || 'presskit');

    res.set('Content-Type', 'application/pdf');
    res.set('Content-Disposition', `attachment; filename="${safeTitle}-presskit.pdf"`);
    res.send(pdfBuffer);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'PDF oluşturulamadı.' });
  } finally {
    if (browser) await browser.close();
  }
});

// --- Pages ---
app.get('/', (req, res) => {
  fs.readFile(path.join(__dirname, 'public', 'index.html'), 'utf8', (err, html) => {
    if (err) return res.status(500).send('Sunucu hatası.');
    fs.readFile(DATA_FILE, 'utf8', (err2, content) => {
      let data = {};
      if (!err2) {
        try { data = JSON.parse(content); } catch (e) { /* ignore */ }
      }
      const game = data.game || {};
      const about = data.about || {};
      const lang = req.query.lang === 'en' ? 'en' : 'tr';
      const desc = pickText(about.description, lang);
      const trimmedDesc = desc.length > 200 ? desc.slice(0, 197) + '...' : desc;
      const imagePath = game.keyArt || game.boxArt || '';
      const imageUrl = imagePath ? (req.protocol + '://' + req.get('host') + imagePath) : '';
      const title = game.title || 'Press Kit';

      const metaTags = `
  <meta property="og:type" content="website">
  <meta property="og:title" content="${escAttr(title)}">
  <meta property="og:description" content="${escAttr(trimmedDesc)}">
  ${imageUrl ? `<meta property="og:image" content="${escAttr(imageUrl)}">` : ''}
  <meta name="twitter:card" content="${imageUrl ? 'summary_large_image' : 'summary'}">
  <meta name="twitter:title" content="${escAttr(title)}">
  <meta name="twitter:description" content="${escAttr(trimmedDesc)}">
  ${imageUrl ? `<meta name="twitter:image" content="${escAttr(imageUrl)}">` : ''}
`;
      const injected = html.replace('</head>', metaTags + '</head>');
      res.set('Content-Type', 'text/html; charset=utf-8').send(injected);
    });
  });
});

app.get('/admin', requireAdminAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Sunucu hatası.' });
});

app.listen(PORT, () => {
  console.log(`Press kit sunucusu çalışıyor: http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
