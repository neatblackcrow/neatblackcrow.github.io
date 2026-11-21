import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const DIST_DIR = path.resolve('dist');

const TARGETS = [
  { route: '/', outFile: 'cv.pdf' },
  { route: '/th/', outFile: 'cv-th.pdf' },
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
};

function startStaticServer(rootDir) {
  const server = http.createServer(async (req, res) => {
    try {
      const reqUrl = new URL(req.url ?? '/', 'http://127.0.0.1');
      let pathname = decodeURIComponent(reqUrl.pathname);
      if (pathname.endsWith('/')) {
        pathname += 'index.html';
      }

      const resolved = path.resolve(rootDir, `.${pathname}`);
      if (!resolved.startsWith(rootDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      let filePath = resolved;
      const stat = await fs.stat(filePath).catch(() => null);
      if (stat?.isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      const content = await fs.readFile(filePath);
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] ?? 'application/octet-stream' });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        reject(new Error('Failed to bind static server port'));
        return;
      }
      resolve({ server, port: addr.port });
    });
  });
}

async function main() {
  const { server, port } = await startStaticServer(DIST_DIR);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    for (const target of TARGETS) {
      const url = `http://127.0.0.1:${port}${target.route}`;
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.emulateMedia({ media: 'print' });
      await page.evaluate(async () => {
        await document.fonts.ready;
      });

      const outPath = path.join(DIST_DIR, target.outFile);
      await page.pdf({
        path: outPath,
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
      });

      const stat = await fs.stat(outPath);
      const headerBuf = await fs.readFile(outPath);
      const signature = headerBuf.subarray(0, 5).toString('ascii');

      if (stat.size < 10_000 || signature !== '%PDF-') {
        throw new Error(`Invalid generated PDF at ${outPath} (size=${stat.size}, sig=${signature})`);
      }

      console.log(`Generated ${outPath} (${(stat.size / 1024).toFixed(1)} KB)`);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
