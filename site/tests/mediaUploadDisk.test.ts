import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventEmitter } from 'node:events';
import { DatabaseSync } from 'node:sqlite';
import { createMediaRouter } from '../api/media.mjs';

function createMockReq({
  method = 'POST',
  headers = {},
  body = Buffer.alloc(0),
  remoteAddress = '127.0.0.1',
}: {
  method?: string;
  headers?: Record<string, string>;
  body?: Buffer;
  remoteAddress?: string;
}) {
  const emitter = new EventEmitter() as any;
  emitter.method = method;
  emitter.headers = headers;
  emitter.socket = { remoteAddress, encrypted: false };
  emitter[Symbol.asyncIterator] = async function* () {
    if (body.length > 0) {
      yield body;
    }
  };
  return emitter;
}

function createMockRes() {
  const res: any = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: '',
    writableEnded: false,
    headersSent: false,
    writeHead(status: number, headers: Record<string, string> = {}) {
      res.statusCode = status;
      res.headers = { ...res.headers, ...headers };
      res.headersSent = true;
    },
    end(data: string = '') {
      res.body = data;
      res.writableEnded = true;
    },
  };
  return res;
}

describe('Media Upload Disk Preservation Suite (PROMPT A)', () => {
  let tempDir: string;
  let mediaDir: string;
  let sessions: Map<string, any>;
  const adminToken = 'test-valid-admin-session-token';

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'sahara-media-upload-test-'));
    mediaDir = join(tempDir, 'media');
    sessions = new Map();
    sessions.set(adminToken, {
      createdAt: Date.now(),
      expiresAt: Date.now() + 3600000,
      ip: '127.0.0.1',
    });
  });

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('1. Successfully uploads JPEG and physically writes the exact buffer to MEDIA_DIR', async () => {
    const handleMedia = createMediaRouter({
      sessions,
      MEDIA_DIR: mediaDir,
      DATABASE_FILE: join(tempDir, 'catalog.sqlite'),
      ROOT: tempDir,
    });

    // Valid JPEG magic bytes (FF D8 FF) + payload padding
    const validJpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
      0x01,
    ]);
    const req = createMockReq({
      method: 'POST',
      headers: {
        cookie: `sahara_admin=${adminToken}`,
        'content-type': 'image/jpeg',
        'x-media-alt': 'ARDO OVEN Test Image',
        'x-original-name': encodeURIComponent('ardo-oven-hero.jpg'),
      },
      body: validJpegBuffer,
    });
    const res = createMockRes();

    const handled = await handleMedia(req, res, '/api/admin/media');
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(201);

    const json = JSON.parse(res.body);
    expect(json.type).toBe('image');
    expect(json.url).toMatch(/^\/uploads\/[a-z0-9]+-[a-f0-9]+\.jpg$/);
    expect(json.alt).toBe('ARDO OVEN Test Image');
    expect(json.originalName).toBe('ardo-oven-hero.jpg');

    // Verify file on disk
    const savedFileName = json.url.replace('/uploads/', '');
    const savedFilePath = join(mediaDir, savedFileName);
    expect(existsSync(savedFilePath)).toBe(true);

    const writtenBuffer = readFileSync(savedFilePath);
    expect(writtenBuffer.equals(validJpegBuffer)).toBe(true);
  });

  it('2. Successfully uploads PNG and physically writes file to disk', async () => {
    const handleMedia = createMediaRouter({
      sessions,
      MEDIA_DIR: mediaDir,
      DATABASE_FILE: join(tempDir, 'catalog.sqlite'),
      ROOT: tempDir,
    });

    // Valid PNG header (89 50 4E 47 0D 0A 1A 0A)
    const validPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
      0x52,
    ]);
    const req = createMockReq({
      method: 'POST',
      headers: {
        cookie: `sahara_admin=${adminToken}`,
        'content-type': 'image/png',
        'x-media-alt': 'Lotus Hob PNG',
      },
      body: validPngBuffer,
    });
    const res = createMockRes();

    const handled = await handleMedia(req, res, '/api/admin/media');
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(201);

    const json = JSON.parse(res.body);
    expect(json.type).toBe('image');
    expect(json.url).toMatch(/\.png$/);

    const savedFileName = json.url.replace('/uploads/', '');
    const savedFilePath = join(mediaDir, savedFileName);
    expect(existsSync(savedFilePath)).toBe(true);
    expect(readFileSync(savedFilePath).equals(validPngBuffer)).toBe(true);
  });

  it('3. Rejects unsupported MIME types with 415', async () => {
    const handleMedia = createMediaRouter({
      sessions,
      MEDIA_DIR: mediaDir,
      DATABASE_FILE: join(tempDir, 'catalog.sqlite'),
      ROOT: tempDir,
    });

    const exeBuffer = Buffer.from('MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00');
    const req = createMockReq({
      method: 'POST',
      headers: {
        cookie: `sahara_admin=${adminToken}`,
        'content-type': 'application/x-msdownload',
      },
      body: exeBuffer,
    });
    const res = createMockRes();

    const handled = await handleMedia(req, res, '/api/admin/media');
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(415);
    const json = JSON.parse(res.body);
    expect(json.error).toContain('Yalnız JPG, PNG, WEBP, SVG, MP4 və WEBM qəbul edilir');
  });

  it('4. Rejects invalid media signature with 415 when MIME does not match magic bytes', async () => {
    const handleMedia = createMediaRouter({
      sessions,
      MEDIA_DIR: mediaDir,
      DATABASE_FILE: join(tempDir, 'catalog.sqlite'),
      ROOT: tempDir,
    });

    const fakeJpeg = Buffer.from('NOT_A_REAL_JPEG_HEADER_AT_ALL_123456');
    const req = createMockReq({
      method: 'POST',
      headers: {
        cookie: `sahara_admin=${adminToken}`,
        'content-type': 'image/jpeg',
      },
      body: fakeJpeg,
    });
    const res = createMockRes();

    const handled = await handleMedia(req, res, '/api/admin/media');
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(415);
    const json = JSON.parse(res.body);
    expect(json.error).toBe('Fayl məzmunu seçilən media formatına uyğun deyil');
  });

  it('5. Rejects files larger than 20MB with 413', async () => {
    const handleMedia = createMediaRouter({
      sessions,
      MEDIA_DIR: mediaDir,
      DATABASE_FILE: join(tempDir, 'catalog.sqlite'),
      ROOT: tempDir,
    });

    // Create a buffer larger than 20MB with valid JPEG start
    const oversizedBuffer = Buffer.alloc(20 * 1024 * 1024 + 1024);
    oversizedBuffer[0] = 0xff;
    oversizedBuffer[1] = 0xd8;
    oversizedBuffer[2] = 0xff;

    const req = createMockReq({
      method: 'POST',
      headers: {
        cookie: `sahara_admin=${adminToken}`,
        'content-type': 'image/jpeg',
      },
      body: oversizedBuffer,
    });
    const res = createMockRes();

    const handled = await handleMedia(req, res, '/api/admin/media');
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(413);
    const json = JSON.parse(res.body);
    expect(json.error).toBe('Fayl həcmi 20MB-dan böyük ola bilməz');
  });

  it('6. Rejects unauthenticated request with 401', async () => {
    const handleMedia = createMediaRouter({
      sessions,
      MEDIA_DIR: mediaDir,
      DATABASE_FILE: join(tempDir, 'catalog.sqlite'),
      ROOT: tempDir,
    });

    const validJpegBuffer = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
      0x01,
    ]);
    const req = createMockReq({
      method: 'POST',
      headers: {
        'content-type': 'image/jpeg',
      },
      body: validJpegBuffer,
    });
    const res = createMockRes();

    const handled = await handleMedia(req, res, '/api/admin/media');
    expect(handled).toBe(true);
    expect(res.statusCode).toBe(401);
  });

  it('7. Deletes an unreferenced generated upload and rejects unsafe file names', async () => {
    const csrfToken = 'delete-media-csrf';
    sessions.get(adminToken).csrfToken = csrfToken;
    mkdirSync(mediaDir, { recursive: true });
    const fileName = 'mtest123-0123456789abcdef.jpg';
    writeFileSync(join(mediaDir, fileName), Buffer.from([0xff, 0xd8, 0xff]));
    const handleMedia = createMediaRouter({
      sessions,
      MEDIA_DIR: mediaDir,
      DATABASE_FILE: join(tempDir, 'missing.sqlite'),
      ROOT: tempDir,
    });

    const deleteReq = createMockReq({
      method: 'DELETE',
      headers: {
        cookie: `sahara_admin=${adminToken}`,
        'x-csrf-token': csrfToken,
      },
    });
    const deleteRes = createMockRes();
    expect(await handleMedia(deleteReq, deleteRes, `/api/admin/media/${fileName}`)).toBe(true);
    expect(deleteRes.statusCode).toBe(200);
    expect(existsSync(join(mediaDir, fileName))).toBe(false);

    const unsafeReq = createMockReq({
      method: 'DELETE',
      headers: {
        cookie: `sahara_admin=${adminToken}`,
        'x-csrf-token': csrfToken,
      },
    });
    const unsafeRes = createMockRes();
    expect(await handleMedia(unsafeReq, unsafeRes, '/api/admin/media/..%2Fcatalog.sqlite')).toBe(
      true
    );
    expect(unsafeRes.statusCode).toBe(400);
  });

  it('8. Refuses to delete an upload that is still referenced by either catalog database', async () => {
    const csrfToken = 'referenced-media-csrf';
    sessions.get(adminToken).csrfToken = csrfToken;
    mkdirSync(mediaDir, { recursive: true });
    const fileName = 'mref1234-abcdef0123456789.webp';
    const mediaUrl = `/uploads/${fileName}`;
    writeFileSync(join(mediaDir, fileName), Buffer.from('referenced'));
    const databaseFile = join(tempDir, 'catalog.sqlite');
    const db = new DatabaseSync(databaseFile);
    db.exec(`
      CREATE TABLE product_media (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        original_url TEXT,
        poster TEXT
      );
    `);
    db.prepare('INSERT INTO product_media(id, url) VALUES (?, ?)').run('media-ref', mediaUrl);
    db.close();

    const handleMedia = createMediaRouter({
      sessions,
      MEDIA_DIR: mediaDir,
      DATABASE_FILE: databaseFile,
      DRAFT_DATABASE_FILE: join(tempDir, 'missing-draft.sqlite'),
      ROOT: tempDir,
    });
    const req = createMockReq({
      method: 'DELETE',
      headers: {
        cookie: `sahara_admin=${adminToken}`,
        'x-csrf-token': csrfToken,
      },
    });
    const res = createMockRes();

    expect(await handleMedia(req, res, `/api/admin/media/${fileName}`)).toBe(true);
    expect(res.statusCode).toBe(409);
    expect(JSON.parse(res.body).error).toBe('MEDIA_IS_STILL_IN_USE');
    expect(existsSync(join(mediaDir, fileName))).toBe(true);
  });
});
