// Full-page screenshots of a page of the site, desktop and mobile, light and
// dark, with headless Chrome driven over the DevTools Protocol: the backups of
// public/covers/screenshots/ (agents/architecture.md, Covers). Run against a
// production build, never next to a dev server (AGENTS.md):
//
//   npm run build && npm run preview -- --port 4322     in another terminal
//   npm run screenshots                                  the home, into public/covers/screenshots/
//   npm run screenshots -- --url http://localhost:4322/docs/it/ --name home-it --only mobile
//
// The home keeps its scenes still with reduced motion (DepthScene,
// ComponentLayers open on Structure, Mia looking ahead), so the script
// emulates it. Chrome is the one of macOS unless CHROME names another.
import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const { values } = parseArgs({
  options: {
    url: { type: 'string', default: 'http://localhost:4322/docs/' },
    out: { type: 'string', default: 'public/covers/screenshots' },
    name: { type: 'string', default: 'home' },
    only: { type: 'string' },
  },
});

const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PORT = 9333;

/** Desktop at 1440 css px, twice as dense; mobile at 390, three times. */
const SHOTS = [
  { name: 'desktop', width: 1440, height: 900, dpr: 2, mobile: false },
  { name: 'mobile', width: 390, height: 844, dpr: 3, mobile: true },
];
const SCHEMES = ['light', 'dark'];
// The user agent of a phone, with the mobile viewport.
const MOBILE_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
/** Chrome's largest surface is 16384 px: past it a capture repeats the top of the page. */
const SURFACE = 16000;
/** The blocks of a page taller than that, in css px, scrolled to and stitched. */
const CHUNK = 4000;

/** A JSON endpoint of Chrome, retried while it starts. */
async function json(endpoint, method = 'GET') {
  for (let i = 0; i < 100; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}${endpoint}`, { method });
      if (response.ok) return await response.json();
    } catch {}
    await sleep(200);
  }
  throw new Error(`Chrome does not answer on ${endpoint}`);
}

/** A DevTools Protocol session on a tab: send() a command, once() an event. */
function connect(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const waiting = new Map();
  ws.onmessage = ({ data }) => {
    const message = JSON.parse(data);
    if (message.id) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(message.error.message));
      else resolve(message.result);
    } else {
      const list = waiting.get(message.method) ?? [];
      waiting.delete(message.method);
      for (const resolve of list) resolve(message.params);
    }
  };
  return new Promise((resolve) => {
    ws.onopen = () =>
      resolve({
        send: (method, params = {}) =>
          new Promise((ok, ko) => {
            pending.set(++id, { resolve: ok, reject: ko });
            ws.send(JSON.stringify({ id, method, params }));
          }),
        once: (method) =>
          new Promise((ok) => waiting.set(method, [...(waiting.get(method) ?? []), ok])),
        close: () => ws.close(),
      });
  });
}

// Run in the page. The KPI figures of the home show only while on screen
// (mds-kpi-item `threshold`): static instead. A slow scroll to the bottom runs
// every observer (the card of ComponentLayers opens), then back to the top
// once every component is hydrated and the fonts are in.
const SETTLE = async () => {
  for (const kpi of document.querySelectorAll('mds-kpi-item[threshold]')) {
    kpi.setAttribute('threshold', '0');
  }
  const step = Math.round(innerHeight / 3);
  for (let y = 0; y < document.scrollingElement.scrollHeight; y += step) {
    scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 200));
  }
  scrollTo(0, document.scrollingElement.scrollHeight);
  await new Promise((r) => setTimeout(r, 800));
  scrollTo(0, 0);
  const cold = () =>
    [...document.querySelectorAll('*')].filter(
      (e) => e.tagName.startsWith('MDS-') && !e.hasAttribute('hydrated'),
    ).length;
  const deadline = Date.now() + 15000;
  while (cold() && Date.now() < deadline) await new Promise((r) => setTimeout(r, 200));
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 1500));
  return { cold: cold(), theme: document.documentElement.dataset.theme };
};

/** The page in blocks, stitched: the fixed header (and its blur) only in the first. */
async function stitched(page, shot) {
  await page.send('Emulation.setDeviceMetricsOverride', {
    width: shot.width,
    height: CHUNK,
    deviceScaleFactor: shot.dpr,
    mobile: shot.mobile,
  });
  await sleep(2000);
  const { cssContentSize } = await page.send('Page.getLayoutMetrics');
  const total = Math.ceil(cssContentSize.height);
  await page.send('Runtime.evaluate', {
    expression: `document.head.insertAdjacentHTML('beforeend', '<style>.shot-later :is(mds-header, mds-header-bar) { visibility: hidden !important; }</style>')`,
  });
  const parts = [];
  for (let y = 0; y < total; y += CHUNK) {
    // The last block ends with the page: it starts higher and overlaps.
    const top = Math.min(y, Math.max(0, total - CHUNK));
    await page.send('Runtime.evaluate', {
      expression: `scrollTo(0, ${top}); document.documentElement.classList.toggle('shot-later', ${y > 0});`,
    });
    await sleep(1200);
    const { data } = await page.send('Page.captureScreenshot', { format: 'png' });
    const height = Math.min(CHUNK, total - y);
    parts.push({
      input: await sharp(Buffer.from(data, 'base64'))
        .extract({
          left: 0,
          top: (y - top) * shot.dpr,
          width: shot.width * shot.dpr,
          height: height * shot.dpr,
        })
        .png()
        .toBuffer(),
      left: 0,
      top: y * shot.dpr,
    });
  }
  return sharp({
    create: {
      width: shot.width * shot.dpr,
      height: total * shot.dpr,
      channels: 4,
      background: '#ffffff',
    },
    limitInputPixels: false,
  })
    .composite(parts)
    .png()
    .toBuffer();
}

const profile = await mkdtemp(path.join(tmpdir(), 'magma-docs-screenshots-'));
await mkdir(values.out, { recursive: true });
const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank',
  ],
  { stdio: 'ignore' },
);

try {
  await json('/json/version');
  for (const shot of SHOTS.filter(({ name }) => !values.only || values.only === name)) {
    for (const scheme of SCHEMES) {
      const target = await json('/json/new?about:blank', 'PUT');
      const page = await connect(target.webSocketDebuggerUrl);
      await page.send('Page.enable');
      await page.send('Runtime.enable');
      await page.send('Emulation.setDeviceMetricsOverride', {
        width: shot.width,
        height: shot.height,
        deviceScaleFactor: shot.dpr,
        mobile: shot.mobile,
      });
      if (shot.mobile) {
        await page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
        await page.send('Emulation.setUserAgentOverride', { userAgent: MOBILE_UA });
      }
      await page.send('Emulation.setEmulatedMedia', {
        features: [
          { name: 'prefers-reduced-motion', value: 'reduce' },
          { name: 'prefers-color-scheme', value: scheme },
        ],
      });
      // A clean origin: the site keeps the chosen mode in localStorage.
      await page.send('Storage.clearDataForOrigin', {
        origin: new URL(values.url).origin,
        storageTypes: 'all',
      });
      const loaded = page.once('Page.loadEventFired');
      await page.send('Page.navigate', { url: values.url });
      await loaded;
      const { result } = await page.send('Runtime.evaluate', {
        expression: `(${SETTLE})()`,
        awaitPromise: true,
        returnByValue: true,
      });
      const { cssContentSize } = await page.send('Page.getLayoutMetrics');
      const height = Math.ceil(cssContentSize.height);
      const png =
        height * shot.dpr > SURFACE
          ? await stitched(page, shot)
          : Buffer.from(
              (
                await page.send('Page.captureScreenshot', {
                  format: 'png',
                  captureBeyondViewport: true,
                  clip: { x: 0, y: 0, width: shot.width, height, scale: 1 },
                })
              ).data,
              'base64',
            );
      const file = path.join(values.out, `${values.name}-${shot.name}-${scheme}.png`);
      await writeFile(file, png);
      const { cold, theme } = result.value;
      console.log(`${file}${cold ? `, ${cold} components not hydrated` : ''}, ${theme}`);
      page.close();
      await fetch(`http://127.0.0.1:${PORT}/json/close/${target.id}`);
    }
  }
} finally {
  // Chrome writes to its profile while it quits: removed once it is gone.
  const exited = new Promise((resolve) => chrome.once('exit', resolve));
  chrome.kill();
  await exited;
  await rm(profile, { recursive: true, force: true, maxRetries: 5 });
}
