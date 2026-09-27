# PROMPT E — Deployment Checklist + Nginx + PM2

> **Tətbiq yeri:** Server konfiqurasiyası, deployment
> **Risk:** İnfrastruktur — diqqətli tətbiq tələb edir
> **Ön şərt:** PROMPT_A, B, C, D hamısı tamamlanmış olmalıdır
> **Nəticə:** Katalog production-da etibarlı şəkildə işləyir

---

## Bu Promptun Məqsədi

Bu prompt kod deyil — deployment addımlarıdır. Hər addımı sırayla icra et.

---

## Addım 1: `.env` Faylını Yoxla

Server-də (VPS/lokal maşın) `site/.env` faylını yoxla:

```bash
cat site/.env
```

**Olmalıdır:**
```
PORT=3004
HOST=0.0.0.0
ADMIN_PASSWORD=<ən_azı_16_simvollu_güclü_parol>
DATA_DIR=./data
```

**Yoxlanacaqlar:**
- [ ] `ADMIN_PASSWORD` `1234567` DƏYİL
- [ ] `ADMIN_PASSWORD` ən azı 16 simvol, böyük/kiçik hərf + rəqəm + xüsusi simvol içərir
- [ ] `.env` faylı `.gitignore`-da var (git-ə yüklənmir)

---

## Addım 2: Data Qovluğunu Yoxla

```bash
ls -la site/data/
# Olmalıdır: draft.db, catalog.db (və ya production.db), media/ qovluğu
```

**Yoxlanacaqlar:**
- [ ] `site/data/` qovluğu mövcuddur
- [ ] Database faylları mövcuddur (server ilk işə salındıqda yaranır)
- [ ] `site/data/` qovluğuna yazma icazəsi var (`chmod 755 site/data/`)

---

## Addım 3: Build Al

```bash
cd site
npm run build
```

**Yoxlanacaqlar:**
- [ ] Build xətasız tamamlanır
- [ ] `site/dist/` qovluğu yaranıb
- [ ] `site/dist/index.html` mövcuddur
- [ ] `site/dist/assets/` içərisində JS chunk-ları var

---

## Addım 4: Nginx Konfiqurasiyası (Reverse Proxy Varsa)

Əgər Nginx istifadə edirsənsə, aşağıdakı konfiqurasiya faylını yarat:

```nginx
# /etc/nginx/sites-available/ardo-kataloq
server {
    listen 80;
    server_name saytadresin.az www.saytadresin.az;

    # HTTP → HTTPS yönləndir
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name saytadresin.az www.saytadresin.az;

    # SSL sertifikatları (Let's Encrypt ilə)
    ssl_certificate /etc/letsencrypt/live/saytadresin.az/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/saytadresin.az/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Node.js serverinə proxy
    location / {
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;  # Spoofing-ə qarşı: $remote_addr istifadə et
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 10s;
    }

    # Upload faylları üçün xüsusi konfiqurasiya
    location /uploads/ {
        proxy_pass http://127.0.0.1:3004;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 25M;  # Media upload limitini artır
    }
}
```

**Nginx-i aktiv et:**
```bash
sudo nginx -t                           # Konfigurasiyası yoxla
sudo ln -s /etc/nginx/sites-available/ardo-kataloq /etc/nginx/sites-enabled/
sudo systemctl reload nginx
```

---

## Addım 5: PM2 ilə Server İdarəsi

PM2 serverin həmişə işlək qalmasını təmin edir:

```bash
npm install -g pm2

# Server başlat
cd site
pm2 start server.mjs \
  --name "ardo-kataloq" \
  --node-args="--env-file-if-exists=.env" \
  --max-memory-restart 500M

# Sistem açıldıqda avtomatik başlat
pm2 startup
pm2 save
```

**PM2 konfiqurasiya faylı** (`site/ecosystem.config.cjs`) yarat:

```javascript
module.exports = {
  apps: [{
    name: 'ardo-kataloq',
    script: 'server.mjs',
    cwd: '/tam/yol/site',       // ← öz yolunu yaz
    node_args: '--env-file-if-exists=.env',
    env: {
      NODE_ENV: 'production',
      VITE_APP_MODE: 'catalog',
      APP_MODE: 'catalog',
    },
    max_memory_restart: '500M',
    error_file: './logs/pm2-error.log',
    out_file: './logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    restart_delay: 3000,
    max_restarts: 10,
  }],
};
```

```bash
# ecosystem.config.cjs ilə başlat:
pm2 start ecosystem.config.cjs
pm2 save
```

**Yoxlanacaqlar:**
- [ ] `pm2 list` — `ardo-kataloq` `online` statusundadır
- [ ] `pm2 logs ardo-kataloq` — xəta yoxdur
- [ ] Server restart-dan sonra PM2 avtomatik başlayır

---

## Addım 6: İlk Açılış Yoxlaması

```bash
# 1. Health check
curl http://localhost:3004/api/health
# Gözlənilən: {"status":"ok","storage":"sqlite","database":"ok"}

# 2. Katalog API
curl http://localhost:3004/api/catalog | head -c 200
# Gözlənilən: JSON başlayır

# 3. Təhlükəsizlik başlıqları
curl -I http://localhost:3004/api/catalog
# Gözlənilən: Content-Security-Policy, X-Frame-Options, X-Content-Type-Options

# 4. Admin path — public-dən gizli
curl http://localhost:3004/AdministratorNT
# Gözlənilən: 404 (local network deyilsə)
```

---

## Addım 7: Logları Yoxla

```bash
# PM2 logları
pm2 logs ardo-kataloq --lines 50

# Aşağıdakı xəbərdarlıqlar OLMAMALIDIR:
# - "ADMIN_PASSWORD mühit dəyişəni tapılmadı"
# - "Failed to update .env password file"
# - "Fayl yazılarkən xəta" (PROMPT_A-dan)
# - Hər hansı stack trace
```

---

## Addım 8: Son Yoxlama Siyahısı

**Funksional:**
- [ ] Katalog brauzerdə açılır
- [ ] Məhsullar görünür
- [ ] Axtarış işləyir
- [ ] Brend/kateqoriya filtrləri işləyir
- [ ] Məhsul kartına klik edilir, WhatsApp/zəng düymələri işləyir
- [ ] Admin giriş işləyir (lokal şəbəkədən)
- [ ] Admin şəkil yükləmə işləyir (PROMPT_A-dan sonra)

**Təhlükəsizlik:**
- [ ] `curl -I` cavabında `Content-Security-Policy` var
- [ ] HTTPS-də admin cookie `; Secure` bayrağı alır
- [ ] `site/.env` faylı git-ə yüklənməyib
- [ ] Admin parolu güclüdür (PROMPT_C-dən hash edilib)

**Performans:**
- [ ] Katalog ilk yüklənmə < 3 saniyədir
- [ ] Brauzer konsolunda `console.log` yoxdur (PROMPT_D-dən)
- [ ] Network tab-da sourcemap faylı yüklənmir
