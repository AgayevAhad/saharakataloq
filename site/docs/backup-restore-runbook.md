# Sahara Electronics — Verilənlər Bazasının Yedəklənməsi və Bərpası Qaydası (Backup & Restore Runbook)

> **Tarix:** 06.09.2026  
> **Tətbiq sahəsi:** repository rootundan `site/data/catalog.sqlite`, `site/data/catalog-draft.sqlite`

---

## 1. Avtomatik Snapshot və Backup Prinsipləri

1. **Hər Dərc Əməliyyatında Snapshot:** Admin paneldən "Dərc et" düyməsi basıldıqda, cari `site/data/catalog.sqlite` faylının JSON/SQLite tam nüsxəsi `catalog_snapshots` cədvəlinə və ya `site/data/snapshots/` qovluğuna yazılır.
2. **Cold Backup:** İstənilən struktur miqrasiyasından və ya toplu idxal əməliyyatından əvvəl `site/data/catalog.sqlite` faylı `site/data/backups/catalog_backup_YYYYMMDD_HHMMSS.sqlite` olaraq kopyalanır.
3. **Additive Miqrasiya:** Miqrasiyalar heç vaxt mövcud sütunları və cədvəlləri silmir; yalnız yeni sahələr əlavə edilir (`ALTER TABLE ADD COLUMN`).

---

## 2. Bərpa (Restore) Proseduru

### 2.1 Admin Panel Vasitəsilə (Online Rollback)

1. Admin panelində **"Snapshot İdarəetməsi"** bölməsinə daxil olun.
2. Mövcud snapshot-lar siyahısından bərpa etmək istədiyiniz tarixi və versiyanı seçin.
3. **"Bu versiyaya geri qayıt"** düyməsini basın. Sistem atomik transaction ilə public və qaralama bazalarını həmin nöqtəyə qaytaracaq.

### 2.2 Terminal / Fövqəladə Hal Vasitəsilə (Cold Restore)

Əgər server və ya baza zədələnibsə:

```bash
# 1. Server prosesini dayandırın
killall node

# 2. Cari zədələnmiş faylı arxivləşdirin
mv site/data/catalog.sqlite site/data/catalog_corrupted_$(date +%Y%m%d).sqlite

# 3. Ən son sağlam backup nüsxəsini bərpa edin
cp site/data/backups/catalog_backup_YYYYMMDD_HHMMSS.sqlite site/data/catalog.sqlite
cp site/data/backups/catalog_backup_YYYYMMDD_HHMMSS.sqlite site/data/catalog-draft.sqlite

# 4. Baza bütövlüyünü yoxlayın
sqlite3 site/data/catalog.sqlite "PRAGMA integrity_check;"

# 5. Serveri yenidən işə salın
npm start
```

---

## 3. İdempotentlik və Bərpanın Yoxlanması (Verification)

- Backup-ın düzgünlüyü təcrid olunmuş müvəqqəti mühitdə avtomatlaşdırılmış testlərlə (`backend/backupRestore.test.mjs`) hər dəfə yoxlanılmalıdır.
