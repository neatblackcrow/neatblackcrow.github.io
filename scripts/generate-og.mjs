import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT_DIR = path.resolve('.');
const OUT_FILE = path.resolve('public/og-image.png');

const MIME_TYPES = {
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.css': 'text/css; charset=utf-8',
};

function startFontServer() {
  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
      const rel = decodeURIComponent(reqUrl.pathname).replace(/^\/+/, '');
      const filePath = path.resolve(ROOT_DIR, 'node_modules', rel);
      if (!filePath.startsWith(path.resolve(ROOT_DIR, 'node_modules'))) {
        res.writeHead(403);
        res.end();
        return;
      }
      const data = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to start font server'));
        return;
      }
      resolve({ server, port: addr.port });
    });
  });
}

async function main() {
  await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });
  const { server, port } = await startFontServer();
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      viewport: { width: 1200, height: 630 },
      deviceScaleFactor: 1,
    });

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <link rel="stylesheet" href="http://127.0.0.1:${port}/@fontsource/ibm-plex-sans/500.css" />
  <link rel="stylesheet" href="http://127.0.0.1:${port}/@fontsource/ibm-plex-sans/700.css" />
  <link rel="stylesheet" href="http://127.0.0.1:${port}/@fontsource/ibm-plex-mono/400.css" />
  <link rel="stylesheet" href="http://127.0.0.1:${port}/@fontsource/ibm-plex-mono/500.css" />
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      background: #FAFAFA;
      color: #111315;
      font-family: 'IBM Plex Sans', sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 64px 72px;
      border-top: 8px solid #1D4ED8;
    }
    .eyebrow {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 18px;
      background: #F3F4F6;
      border: 1px solid #E5E7EB;
      border-radius: 4px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 20px;
      color: #4B5563;
    }
    .sigil { color: #1D4ED8; font-weight: 500; margin-right: 10px; }
    .main {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    h1 {
      font-size: 68px;
      font-weight: 700;
      letter-spacing: -0.025em;
      line-height: 1.08;
    }
    .role {
      font-size: 30px;
      font-weight: 500;
      color: #4B5563;
      line-height: 1.35;
    }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 28px;
      border-top: 1px solid #E5E7EB;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 20px;
      color: #5B6472;
    }
    .accent { color: #1D4ED8; font-weight: 500; }
  </style>
</head>
<body>
  <div class="eyebrow">
    <span><span class="sigil">$</span>cat cv.yaml</span>
    <span>EN · TH</span>
  </div>
  <div class="main">
    <h1>Voravut Nateluercha</h1>
    <p class="role">Software Engineer &amp; Systems / Application Support Specialist</p>
  </div>
  <div class="footer">
    <span class="accent">neatblackcrow.github.io</span>
    <span>Nonthaburi, Thailand · Astro SSG</span>
  </div>
</body>
</html>`;

    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    await page.screenshot({ path: OUT_FILE, type: 'png' });
    const stat = await fs.stat(OUT_FILE);
    console.log(`Generated ${OUT_FILE} (${(stat.size / 1024).toFixed(1)} KB)`);
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
