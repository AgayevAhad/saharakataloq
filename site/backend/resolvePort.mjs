import net from 'node:net';
import { pathToFileURL } from 'node:url';

export const isPortAvailable = (port, host = '0.0.0.0') => new Promise((resolve) => {
  const probe = net.createServer();
  probe.unref();
  probe.once('error', () => resolve(false));
  probe.listen({ port, host }, () => probe.close(() => resolve(true)));
});

export const resolveAvailablePort = async (preferredPort, attempts = 20, checkPort = isPortAvailable) => {
  for (let offset = 0; offset <= attempts; offset += 1) {
    const candidate = preferredPort + offset;
    if (candidate > 65535) break;
    if (await checkPort(candidate)) return candidate;
  }
  throw new Error(`${preferredPort}-${preferredPort + attempts} aralığında boş port tapılmadı`);
};

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  const preferred = Number(process.argv[2] || 3000);
  if (!Number.isInteger(preferred) || preferred < 1 || preferred > 65535) {
    console.error('PORT düzgün rəqəm deyil');
    process.exit(1);
  }
  try { process.stdout.write(String(await resolveAvailablePort(preferred))); }
  catch (error) { console.error(error.message); process.exit(1); }
}
