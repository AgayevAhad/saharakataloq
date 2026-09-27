# PROMPT D — Vite Production Build Optimallaşdırması

> **Tətbiq yeri:** `site/vite.config.ts`
> **Risk:** Aşağı — yalnız build konfiqurasiyası
> **Ön şərt:** Yoxdur — müstəqil
> **Nəticə:** Production bundle-da debug məlumatı olmur; sourcemap açıq olmur

---

## Tapşırıq 1: `console.log` Production-dan Çıxar

`site/vite.config.ts`-i aç. `build` blokununu tap:

```typescript
// MÖVCUD:
build: {
  rollupOptions: { ... },
  chunkSizeWarningLimit: 800,
},

// YENİ — esbuild seçimlərini əlavə et:
build: {
  // Production-da console.log/warn/debug çıxarılır
  // console.error saxlanılır (kritik xətalar üçün)
  esbuild: {
    drop: ['debugger'],
    pure: ['console.log', 'console.warn', 'console.debug', 'console.info'],
  },
  // Sourcemap production-da kapalı (mənbə kodu istifadəçiyə görünməsin)
  sourcemap: false,
  rollupOptions: { ... },  // mövcud məzmun saxlanılır
  chunkSizeWarningLimit: 800,
},
```

> **Qeyd:** `console.error` saxlanılır — ciddi runtime xətaları üçün lazımdır. Yalnız debug məlumatı (`log`, `warn`, `debug`, `info`) çıxarılır.

---

## Tapşırıq 2: SSR Build Üçün Ayrıca Konfiqurasiya

`vite.config.ts`-dəki `isSsrBuild` şərtini yoxla. SSR build-də `esbuild.drop` konsol-log seçimlərini əlavə et:

```typescript
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react()],
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
  },
  build: {
    sourcemap: false,
    esbuild: {
      drop: ['debugger'],
      pure: ['console.log', 'console.warn', 'console.debug', 'console.info'],
    },
    rollupOptions: {
      output: isSsrBuild
        ? {}
        : {
            manualChunks(id) {
              // Mövcud manualChunks məntiqi saxlanılır — dəyişdirilmir
              if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
                return 'vendor-react';
              }
              if (id.includes('node_modules/lucide-react/')) {
                return 'vendor-lucide';
              }
              if (id.includes('/components/admin/')) {
                return 'chunk-admin';
              }
              if (
                id.includes('/components/ProductDetailModal') ||
                id.includes('/components/ShareModal') ||
                id.includes('/components/InverterInfoModal') ||
                id.includes('/components/SmartSearchOverlay') ||
                id.includes('/components/site/SaharaMatchModal')
              ) {
                return 'chunk-modals';
              }
              if (
                id.includes('/utils/excel') ||
                id.includes('/utils/csv') ||
                id.includes('/utils/specNormalizer')
              ) {
                return 'chunk-utils';
              }
            },
          },
    },
    chunkSizeWarningLimit: 800,
  },
  server: {
    host: '0.0.0.0',
    port: 5174,
    cors: true,
    proxy: {
      '/api': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:3004',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.BACKEND_URL || 'http://127.0.0.1:3004',
        changeOrigin: true,
      },
    },
  },
  // @ts-ignore
  test: {
    environment: 'happy-dom',
    env: {
      NODE_ENV: 'test',
      ALLOW_TEMP_DATA_DIR: '1',
    },
    setupFiles: ['./src/test-setup.ts'],
    include: ['tests/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    exclude: ['backend/**', 'node_modules/**', 'tests/browser/**', 'tests/**/*.mjs'],
  },
}));
```

---

## Uğur Meyarı

- [ ] `npm run build` uğurla tamamlanır
- [ ] `dist/assets/*.js` fayllarında `console.log(` sətiri **yoxdur**:
  ```bash
  grep -r "console\.log" site/dist/assets/*.js | wc -l
  # Nəticə: 0
  ```
- [ ] `dist/` qovluğunda `.map` faylı yoxdur:
  ```bash
  find site/dist -name "*.map" | wc -l
  # Nəticə: 0
  ```
- [ ] Brauzerdə katalog düzgün açılır
- [ ] Brauzer konsolunda `console.log` çağırışları görünmür
- [ ] `npm test` heç bir test sınmır
