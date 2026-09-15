import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, join } from 'node:path';

import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SITE_ROOT = resolve(__dirname, '..');
const AUDIT_DIR = resolve(SITE_ROOT, 'docs/audits');
const ARTIFACT_DIR = '/home/oni10/.gemini/antigravity-ide/brain/e89daea5-35f8-44c6-bba6-cc53a9325666';

if (!existsSync(AUDIT_DIR)) mkdirSync(AUDIT_DIR, { recursive: true });

async function run() {
  console.log('🚀 Starting site dev server...');
  const server = spawn('node', ['server.mjs'], {
    cwd: SITE_ROOT,
    env: { ...process.env, PORT: '3040', NODE_ENV: 'production' },
    stdio: 'pipe',
  });

  server.stdout.on('data', (d) => console.log(`[Server] ${d}`));
  server.stderr.on('data', (d) => console.error(`[Server Err] ${d}`));

  // Wait for server ready
  await new Promise((r) => setTimeout(r, 2000));

  console.log('🌐 Launching Chromium...');
  const browser = await chromium.launch({
    executablePath: '/usr/bin/google-chrome-stable',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const targets = [
    { name: 'site-desktop-1440-light', width: 1440, height: 900, isDark: false, isMobile: false },
    { name: 'site-desktop-1440-dark', width: 1440, height: 900, isDark: true, isMobile: false },
    { name: 'site-mobile-390-light', width: 390, height: 844, isDark: false, isMobile: true },
    { name: 'site-mobile-390-dark', width: 390, height: 844, isDark: true, isMobile: true },
  ];

  for (const t of targets) {
    console.log(`📸 Capturing ${t.name}...`);
    const context = await browser.newContext({
      viewport: { width: t.width, height: t.height },
      deviceScaleFactor: 2,
      isMobile: t.isMobile,
      hasTouch: t.isMobile,
      colorScheme: t.isDark ? 'dark' : 'light',
    });

    const page = await context.newPage();
    await page.goto('http://localhost:3040', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await page.waitForTimeout(1200);

    // Set theme in localStorage if needed and reload or toggle
    if (t.isDark) {
      await page.evaluate(() => {
        localStorage.setItem('sahara_theme_mode', 'dark');
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      });
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);
    } else {
      await page.evaluate(() => {
        localStorage.setItem('sahara_theme_mode', 'light');
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      });
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1000);
    }

    await page.waitForTimeout(600);

    const screenshotPath = join(AUDIT_DIR, `${t.name}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ Saved ${screenshotPath}`);

    // Also copy to artifact dir for report
    const artifactPath = join(ARTIFACT_DIR, `${t.name}.png`);
    copyFileSync(screenshotPath, artifactPath);

    await context.close();
  }

  await browser.close();
  server.kill();
  console.log('🎉 All screenshot audits captured successfully!');
  process.exit(0);
}

run().catch((e) => {
  console.error('Error capturing screenshots:', e);
  process.exit(1);
});
