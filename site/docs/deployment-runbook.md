# Sahara Electronics Site — Production Deployment Runbook

## 1. Mühit Dəyişənləri (.env)

Serverdə `site/.env` faylını yaradın və təhlükəsiz şəkildə qoruyun:

```bash
PORT=3004
HOST=0.0.0.0
ADMIN_PASSWORD=Sahara2026!SuperSecureAdminPass
DATA_DIR=./data
```

- `.env` faylı heç vaxt Git repository-yə yüklənməməlidir (`.gitignore`-da mövcuddur).
- `ADMIN_PASSWORD` ən azı 16 simvol, böyük/kiçik hərf, rəqəm və xüsusi simvol içərməlidir.

## 2. İcazələr və Verilənlər Bazası Qovluğu

```bash
mkdir -p site/data site/logs
chmod 755 site/data
```

## 3. Production Build Hazırlığı

```bash
cd site
npm ci
npm run build
```

Build nəticəsində `site/dist/` və `site/dist/server/` qovluqları yaranır. `sourcemap: false` və esbuild `pure: ['console.log', ...]` tətbiq olunur.

## 4. PM2 Proses Meneceri

```bash
npm install -g pm2
cd site
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

## 5. Nginx Reverse Proxy və SSL (Let's Encrypt)

`/etc/nginx/sites-available/sahara-kataloq`:

```nginx
server {
    listen 80;
    server_name example.az www.example.az;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.az www.example.az;

    ssl_certificate /etc/letsencrypt/live/example.az/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.az/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    location / {
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:3004;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 25M;
    }
}
```

## 6. Post-Deployment Yoxlama

- `curl http://localhost:3004/api/health` -> `{"status":"ok","storage":"sqlite","database":"ok"}`
- `curl -I http://localhost:3004/api/catalog` -> `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`
- `curl http://localhost:3004/AdministratorNT` -> `404` (qorunan admin marşrutu)
- `pm2 logs ardo-kataloq --lines 50` -> xətasız çalışma
