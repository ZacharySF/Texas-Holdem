// Offline, optional artwork build. Dependencies live outside the application.
// npm install --prefix /tmp/contemporary-art-build --no-audit --no-fund \
//   @paper-design/shaders-react@0.0.81 react@19.2.4 react-dom@19.2.4 \
//   esbuild@0.25.12 sharp@0.35.5
// ART_TOOL_ROOT=/tmp/contemporary-art-build CHROME_PATH=/path/to/chromium node scripts/build-plates.mjs
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { mkdir, writeFile } from 'node:fs/promises';
import process from 'node:process';
import { chromium } from '@playwright/test';
const root = process.env.ART_TOOL_ROOT || '/tmp/contemporary-art-build';
const require = createRequire(`${root}/package.json`);
const { build } = require('esbuild');
const sharp = require('sharp');
const bundle = await build({
  stdin: {
    contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {GrainGradient} from '@paper-design/shaders-react';createRoot(document.getElementById('plate')).render(React.createElement(GrainGradient,{width:1280,height:854,colors:['#020107','#231757','#6449d7'],colorBack:'#020107',shape:'wave',softness:.55,intensity:.4,noise:.25,speed:0,frame:3400,rotation:30,scale:1.2}));`,
    resolveDir: root,
    loader: 'js',
  },
  bundle: true,
  write: false,
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
});
const server = createServer((req, res) => {
  res.setHeader(
    'Content-Type',
    req.url === '/plate.js' ? 'text/javascript' : 'text/html',
  );
  res.end(
    req.url === '/plate.js'
      ? bundle.outputFiles[0].contents
      : '<html><body style="margin:0;background:#020107"><div id="plate"></div><script src="/plate.js"></script></body></html>',
  );
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH,
  args: ['--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 854 },
    deviceScaleFactor: 1,
  });
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.locator('canvas').waitFor();
  await page.waitForTimeout(1200);
  const png = await page.locator('canvas').screenshot();
  await mkdir('public/art', { recursive: true });
  for (const width of [640, 1280]) {
    const image = sharp(png).resize(width);
    await image
      .clone()
      .webp({ quality: 80 })
      .toFile(`public/art/plate-${width}.webp`);
    await image
      .clone()
      .avif({ quality: 55 })
      .toFile(`public/art/plate-${width}.avif`);
  }
  await writeFile(
    'public/art/README.md',
    'Static GrainGradient plate. Built with @paper-design/shaders-react 0.0.81 (Apache-2.0) using scripts/build-plates.mjs. No React, shader package, WebGL or animation is shipped to the application. Palette: ink-0, ink-2, ink-5. User photos were unavailable.\n',
  );
} finally {
  await browser.close();
  server.close();
}
