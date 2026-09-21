import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const dataDir = mkdtempSync(join(tmpdir(), 'sahara-chat-browser-'));
const runtimePath = `/home/oni10/Desktop/Bazaucunprogram/.runtime/node/bin:${process.env.PATH || ''}`;
const backend = spawn('node', ['server.mjs'], {
  cwd: siteDir,
  env: {
    ...process.env,
    PATH: runtimePath,
    DATA_DIR: dataDir,
    ALLOW_TEMP_DATA_DIR: '1',
    ADMIN_PASSWORD: 'TestAdmin2026!',
    PORT: '3091',
    HOST: '127.0.0.1',
    NODE_ENV: 'test',
  },
  stdio: 'inherit',
});
const frontend = spawn('npx', ['vite', '--port', '5191', '--strictPort', '--host', '127.0.0.1'], {
  cwd: siteDir,
  env: {
    ...process.env,
    PATH: runtimePath,
    BACKEND_URL: 'http://127.0.0.1:3091',
    NODE_ENV: 'test',
    ALLOW_TEMP_DATA_DIR: '1',
  },
  stdio: 'inherit',
});
const cleanup = () => {
  backend.kill('SIGTERM');
  frontend.kill('SIGTERM');
  rmSync(dataDir, { recursive: true, force: true });
};
process.on('SIGTERM', () => {
  cleanup();
  process.exit(0);
});
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});
process.on('exit', cleanup);
