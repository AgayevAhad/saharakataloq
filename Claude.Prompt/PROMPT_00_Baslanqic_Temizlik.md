# PROMPT 00 — Başlanğıc Təmizlik

> **Bu prompt hansı layihədə tətbiq edilir:** Kök qovluq (`ArdoKataloq/`)  
> **Risk:** Aşağı — silmə yox, yenidən adlandırma  
> **Şərt:** Digər heç bir prompt tətbiq edilməzdən əvvəl bu birinci icra edilməlidir  
> **Nəticə:** Tək aktiv layihə qalır: `site/`

---

## Kontekst

Bu layihədə iki paralel frontend mövcuddur:
- `ArdoKataloq/src/` — köhnə kataloq versiyası (artıq aktiv işlədilmir)
- `ArdoKataloq/site/src/` — aktiv, tam işlək yeni versiya

`site/` qovluğu ayrıca `server.mjs`, `backend/`, `package.json`, `vite.config.ts` ilə tam müstəqil layihədir. `start.sh` skriptləri də `site/` üzərindən işə salınır. Köklü `src/` isə köhnə versiyadır — 24 komponentin eyni adlı versiyaları var, bu dublikat qarışıqlıq yaradır.

---

## Tapşırıqlar

### 1. Köklü `src/` qovluğunu arxivlə

Kök qovluqda (`ArdoKataloq/`) bu əməliyyatı icra et:

```bash
mkdir -p _archive
mv src/ _archive/src_legacy_catalog/
mv index.html _archive/index_legacy.html
mv vite.config.ts _archive/vite.config_legacy.ts
mv tsconfig.json _archive/tsconfig_legacy.json
mv server.mjs _archive/server_legacy.mjs
mv backend/ _archive/backend_legacy/
```

> **Qeyd:** `package.json` kök qovluqda qalsın (mövcud skriptlər ona istinad edir). `data/`, `scripts/`, `Logo/`, `File/`, `docs/`, `Test/`, `sitemd/`, `Promptlar/`, `scratch/` qovluqları toxunulmadan qalsın.

### 2. Kök `package.json`-u yenilə

Kök `package.json` içərisindəki `scripts` bölməsini aşağıdakı ilə əvəz et — köhnə `vite` və `server.mjs`-ə istinad edən əmrlər `site/` alt qovluğuna yönləndirilsin:

```json
{
  "name": "ardo-kataloq-workspace",
  "private": true,
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "cd site && npm run dev",
    "build": "cd site && npm run build",
    "start": "cd site && npm start",
    "test": "cd site && npm test",
    "install:all": "npm install && cd site && npm install"
  },
  "description": "ArdoKataloq workspace — aktiv layihə site/ qovluğundadır"
}
```

### 3. `site/package.json`-dan `react-native-web` sil

`site/package.json` faylında aşağıdakı sətirləri **tamamilə sil:**

```json
"react-native-web": "^0.19.13"
```

Əgər `dependencies` içərisindəki `react-native` paketi varsa onu da sil.

Sonra `site/` qovluğunda:
```bash
cd site
npm uninstall react-native-web
npm install
```

### 4. `site/vite.config.ts`-dən `react-native` alias-ı sil

`site/vite.config.ts` faylındakı `resolve` blokundan bu sətirləri sil:

```typescript
// SİL:
alias: {
  'react-native': 'react-native-web',
},
extensions: ['.web.tsx', '.tsx', '.web.ts', '.ts', '.web.jsx', '.jsx', '.web.js', '.js'],
```

Yalnız standart Vite extension-ları qalsın:

```typescript
resolve: {
  extensions: ['.tsx', '.ts', '.jsx', '.js'],
},
```

### 5. `site/src/types/react-native.d.ts` sil

Bu fayl artıq lazım deyil:
```bash
rm site/src/types/react-native.d.ts
```

### 6. Yoxlama

Aşağıdakı əməliyyatları icra et və uğurlu tamamlandığını təsdiqlə:

```bash
cd site
npm run build 2>&1 | tail -20
```

Build uğurlu olmalıdır. `react-native` ilə bağlı heç bir xəta olmamalıdır.

---

## Uğur Meyarı

- [ ] `ArdoKataloq/_archive/src_legacy_catalog/` mövcuddur
- [ ] `ArdoKataloq/site/` qovluğu dəyişdirilmədən qalıb
- [ ] `npm run build` `site/` qovluğunda uğurla tamamlanır
- [ ] `react-native-web` artıq `node_modules`-də yoxdur
- [ ] TypeScript `react-native` import xətası vermir
