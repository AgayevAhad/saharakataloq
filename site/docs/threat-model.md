# Sahara Electronics — Təhlükəsizlik Modeli və Məlumat Təsnifatı (Threat Model & Data Classification)

> **Standartlar:** OWASP ASVS 5.0, STRIDE Threat Model  
> **Tarix:** 06.09.2026

---

## 1. Məlumat Təsnifatı (Data Classification)

| Səviyyə                    | Məlumat Növü                                                                                   | Saxlanma Məkanı                        | Mühafizə Tədbiri                                 |
| :------------------------- | :--------------------------------------------------------------------------------------------- | :------------------------------------- | :----------------------------------------------- |
| **İctimai (Public)**       | Məhsul adları, modellər, texniki xüsusiyyətlər, şəkillər, mağaza ünvanları, ictimai telefonlar | `data/catalog.sqlite`, CDN, Public API | Keşlənmə, Integrity Check, Sanitization          |
| **Daxili (Internal)**      | Qaralama məhsul məlumatları, audit loqları, sayt parametrləri                                  | `data/catalog-draft.sqlite`, Admin API | Admin Autentifikasiyası, Rol əsaslı icazə (RBAC) |
| **Məxfi (Confidential)**   | Admin parolları, API açarları, sessiya tokenləri                                               | `.env`, HTTP-Only Cookies              | Şifrələnmə, Git-dən kənarlaşdırma, Rate-limiting |
| **Fərdi Məlumatlar (PII)** | Müştəri əlaqə nömrələri, müraciət qeydləri                                                     | Müvəqqəti emal                         | Analitika bazasına yazılmır, loglarda maskalanır |

---

## 2. STRIDE Təhdid Təhlili və Müdafiə Strategiyası

### 2.1 Spoofing (Kimliyin Saxtalaşdırılması)

- **Təhdid:** Admin sessiyasını oğurlamaq və ya saxta admin sorğuları göndərmək.
- **Müdafiə:** Şifrələnmiş `admin_token`, sessiya müddəti məhdudiyyəti və IP/User-Agent bağlama.

### 2.2 Tampering (Məlumatların Qəsdən Dəyişdirilməsi)

- **Təhdid:** SQL Injection və ya fayl yüklənməsi vasitəsilə SQLite bazasını və ya fayl sistemini zədələmək.
- **Müdafiə:** Parameterized SQL queries (`better-sqlite3` prepared statements), ciddi MIME-type və fayl uzantısı yoxlaması, zərərli `.exe`/`.php`/`.sh` fayllarının upload-dan bloklanması.

### 2.3 Repudiation (İnkar Etmə)

- **Təhdid:** İnzibatçının etdiyi səhv dəyişikliyi inkar etməsi.
- **Müdafiə:** İmmutable `audit_logs` cədvəlində hər əməliyyatın tarixi, hərəkət növü (`action`), dəyişən sahələr və icraçı qeyd olunur.

### 2.4 Information Disclosure (Məlumatın Sızması)

- **Təhdid:** Xəta mesajlarında daxili fayl yollarının və ya database sxeminin sızması; Git-ə `.env` və ya xam faylların düşməsi.
- **Müdafiə:** İstehsal rejimində mərkəzləşdirilmiş error boundary və generic xəta cavabları. `.gitignore` qaydalarının CI vasitəsilə məcburi yoxlanılması.

### 2.5 Denial of Service (Xidmətin Dayandırılması - DoS)

- **Təhdid:** `/api/catalog/track` və ya `/api/catalog` endpoint-lərinə flood hücumları.
- **Müdafiə:** Express səviyyəsində in-memory və IP-based rate limiting, JSON payload ölçü məhdudiyyəti (max 25MB).

### 2.6 Elevation of Privilege (İcazələrin Qanunsuz Artırılması)

- **Təhdid:** Adi istifadəçinin `/api/admin/*` endpoint-lərinə daxil olması.
- **Müdafiə:** Hər bir admin endpoint-i `verifyAdminToken` middleware-i ilə qorunur; UI-dən düyməni gizlətmək authorization sayılmır.
