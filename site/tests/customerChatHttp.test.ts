// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { spawn, ChildProcess } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createConsistentDatabaseSnapshot } from '../backend/catalogDatabase.mjs';
import { DatabaseSync } from 'node:sqlite';

const siteDir = resolve(__dirname, '..');
const running: Array<{ process: ChildProcess; directory: string }> = [];

afterEach(async () => {
  for (const entry of running.splice(0)) {
    entry.process.kill('SIGTERM');
    await new Promise<void>((done) => {
      if (entry.process.exitCode !== null) done();
      else entry.process.once('exit', () => done());
    });
    rmSync(entry.directory, { recursive: true, force: true });
  }
});

const boot = async () => {
  const directory = mkdtempSync(join(tmpdir(), 'sahara-customer-chat-'));
  for (const name of ['catalog.sqlite', 'catalog-draft.sqlite']) {
    createConsistentDatabaseSnapshot(join(siteDir, 'data', name), join(directory, name));
  }
  const port = 41000 + Math.floor(Math.random() * 1000);
  const password = 'AdminChatTest-987!';
  const process = spawn(processExecPath(), ['server.mjs'], {
    cwd: siteDir,
    env: {
      ...globalThis.process.env,
      PORT: String(port),
      HOST: '127.0.0.1',
      DATA_DIR: directory,
      ADMIN_PASSWORD: password,
      ALLOW_TEMP_DATA_DIR: '1',
      NODE_ENV: 'test',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  running.push({ process, directory });
  let stderr = '';
  process.stderr?.on('data', (part) => {
    stderr += String(part);
  });
  const origin = `http://127.0.0.1:${port}`;
  for (let attempt = 0; attempt < 80; attempt++) {
    await new Promise((done) => setTimeout(done, 100));
    try {
      if ((await fetch(`${origin}/api/customer/session`)).ok)
        return { origin, password, directory };
    } catch {}
    if (process.exitCode !== null) break;
  }
  throw new Error(`Chat test server did not start: ${stderr}`);
};

const processExecPath = () => globalThis.process.execPath;
const json = (value: unknown) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(value),
});

describe('real customer chat HTTP boundary', () => {
  it('requires registered sessions, enforces CSRF and ownership, and supports admin replies plus private attachments', async () => {
    const { origin, password, directory } = await boot();
    const aliceRegistration = await fetch(
      `${origin}/api/customer/register`,
      json({
        fullName: 'Alice Test',
        phone: '501112233',
        email: 'alice@example.com',
        birthDate: '1990-02-10',
        password: 'StrongPass123',
        termsAccepted: true,
      })
    );
    expect(aliceRegistration.status).toBe(201);
    const alice = await aliceRegistration.json();
    const aliceCookie = aliceRegistration.headers.get('set-cookie')!.split(';')[0];
    expect(aliceCookie).toContain('sahara_customer=');
    expect(aliceRegistration.headers.get('set-cookie')).toContain('HttpOnly');
    const db = new DatabaseSync(join(directory, 'customer-support.sqlite'), { readOnly: true });
    const passwordRow = db
      .prepare('SELECT password_hash FROM customer_users WHERE id = ?')
      .get(alice.user.id) as { password_hash: string };
    expect(passwordRow.password_hash).not.toContain('StrongPass123');
    db.close();
    const bobRegistration = await fetch(
      `${origin}/api/customer/register`,
      json({
        fullName: 'Bob Test',
        phone: '502223344',
        birthDate: '1992-03-11',
        password: 'StrongPass234',
        termsAccepted: true,
      })
    );
    expect(bobRegistration.status).toBe(201);
    const bobCookie = bobRegistration.headers.get('set-cookie')!.split(';')[0];

    expect(
      (
        await fetch(
          `${origin}/api/customer/login`,
          json({ identifier: '501112233', password: 'WrongPass123' })
        )
      ).status
    ).toBe(401);
    const noCsrf = await fetch(`${origin}/api/chat/messages`, {
      ...json({ body: 'Sifarişim barədə sualım var' }),
      headers: { 'Content-Type': 'application/json', Cookie: aliceCookie },
    });
    expect(noCsrf.status).toBe(403);
    const sent = await fetch(`${origin}/api/chat/messages`, {
      ...json({ body: 'Sifarişim barədə sualım var' }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: aliceCookie,
        'X-CSRF-Token': alice.csrfToken,
      },
    });
    expect(sent.status).toBe(201);
    const sentBody = await sent.json();
    expect(sentBody.message.body).toBe('Sifarişim barədə sualım var');
    const bobThread = await fetch(`${origin}/api/chat/messages`, {
      headers: { Cookie: bobCookie },
    });
    expect((await bobThread.json()).messages).toEqual([]);

    const onePixelPng = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/gVUAAAAASUVORK5CYII=',
      'base64'
    );
    const upload = await fetch(`${origin}/api/chat/attachment`, {
      method: 'POST',
      headers: {
        Cookie: aliceCookie,
        'X-CSRF-Token': alice.csrfToken,
        'Content-Type': 'image/png',
      },
      body: onePixelPng,
    });
    expect(upload.status).toBe(201);
    const mediaId = (await upload.json()).message.attachmentId;
    expect(
      (await fetch(`${origin}/api/chat/attachments/${mediaId}`, { headers: { Cookie: bobCookie } }))
        .status
    ).toBe(404);
    expect(
      (
        await fetch(`${origin}/api/chat/attachments/${mediaId}`, {
          headers: { Cookie: aliceCookie },
        })
      ).status
    ).toBe(200);

    const adminLogin = await fetch(`${origin}/api/admin/login`, json({ password }));
    expect(adminLogin.status).toBe(200);
    const admin = await adminLogin.json();
    const adminCookie = adminLogin.headers.get('set-cookie')!.split(';')[0];
    const inbox = await fetch(`${origin}/api/admin/chat/inbox`, {
      headers: { Cookie: adminCookie },
    });
    expect((await inbox.json()).conversations[0].userId).toBe(alice.user.id);
    const reply = await fetch(`${origin}/api/admin/chat/${alice.user.id}/messages`, {
      ...json({ body: 'Sizə kömək edək.' }),
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie,
        'X-CSRF-Token': admin.csrfToken,
      },
    });
    expect(reply.status).toBe(201);
    const aliceThread = await fetch(`${origin}/api/chat/messages`, {
      headers: { Cookie: aliceCookie },
    });
    expect(
      (await aliceThread.json()).messages.some(
        (message: { body: string }) => message.body === 'Sizə kömək edək.'
      )
    ).toBe(true);
    expect(
      (
        await fetch(`${origin}/api/customer/password`, {
          ...json({ currentPassword: 'wrong', newPassword: 'NewStrongPass456' }),
          headers: {
            'Content-Type': 'application/json',
            Cookie: aliceCookie,
            'X-CSRF-Token': alice.csrfToken,
          },
        })
      ).status
    ).toBe(401);
    expect(
      (
        await fetch(`${origin}/api/customer/password`, {
          ...json({ currentPassword: 'StrongPass123', newPassword: 'NewStrongPass456' }),
          headers: {
            'Content-Type': 'application/json',
            Cookie: aliceCookie,
            'X-CSRF-Token': alice.csrfToken,
          },
        })
      ).status
    ).toBe(200);
    expect(
      (
        await fetch(
          `${origin}/api/customer/login`,
          json({ identifier: '501112233', password: 'StrongPass123' })
        )
      ).status
    ).toBe(401);
    expect(
      (
        await fetch(
          `${origin}/api/customer/login`,
          json({ identifier: '501112233', password: 'NewStrongPass456' })
        )
      ).status
    ).toBe(200);
    const logout = await fetch(`${origin}/api/customer/logout`, {
      ...json({}),
      headers: {
        'Content-Type': 'application/json',
        Cookie: aliceCookie,
        'X-CSRF-Token': alice.csrfToken,
      },
    });
    expect(logout.status).toBe(200);
    expect(
      (await fetch(`${origin}/api/chat/messages`, { headers: { Cookie: aliceCookie } })).status
    ).toBe(401);
  }, 30000);
});
