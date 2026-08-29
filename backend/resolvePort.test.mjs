import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAvailablePort } from './resolvePort.mjs';

test('istifadədə olan əsas portdan sonra ilk boş portu seçir', async () => {
  const checked = [];
  const port = await resolveAvailablePort(3000, 5, async (candidate) => {
    checked.push(candidate);
    return candidate === 3002;
  });
  assert.equal(port, 3002);
  assert.deepEqual(checked, [3000, 3001, 3002]);
});

test('boş port tapılmayanda aydın xəta qaytarır', async () => {
  await assert.rejects(() => resolveAvailablePort(3000, 1, async () => false), /boş port tapılmadı/);
});
