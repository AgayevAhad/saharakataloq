import { createCatalogDatabase } from '../backend/catalogDatabase.mjs';

const NEW_ARTICLES = [
  {
    id: 'art-inverter',
    title: 'Məişət Texnikasında İnvertor Texnologiyası',
    subtitle: 'İş gücünü ehtiyaca uyğun tənzimləyən, enerjiyə qənaət edən və səssiz işləyən idarəetmə prinsipi.',
    badge: '⚡ Qənaət & Səssiz',
    icon: 'Zap',
    active: true,
    advantages: [
      { title: 'Tənzimlənən enerji istifadəsi', desc: 'Mühərrik və ya kompressor tələb olunan gücə uyğun dəqiq idarə olunaraq 40%-dək enerji qənaəti təmin edir.' },
      { title: 'Səs və vibrasiyanın azaldılması', desc: 'Fasiləsiz minimum gücdə işləyərək kəskin start-stop səslərini və vibrasiyanı aradan qaldırır.' },
      { title: 'Daha sabit iş rejimi və temperatur', desc: 'Tez-tez sönüb-yanmadan qoyulmuş dərəcəni daimi və bərabər saxlayır.' },
      { title: 'Uzunömürlü etibarlı istismar', desc: 'Aşınma və elektrik gərginliyi dalğalanmalarına qarşı daha yüksək dayanıqlılıq göstərir.' },
    ],
  },
  {
    id: 'art-sabaf',
    title: 'İtalyan SABAF Qaz Yanma Sistemi',
    subtitle: 'Dünyanın ən etibarlı və təhlükəsiz qaz forsunkaları ilə 100% təhlükəsizlik və qənaət.',
    badge: '🔥 ARDO: SABAF Yanma',
    icon: 'Flame',
    active: true,
    advantages: [
      { title: 'Qaz Nəzarət Sistemi (Gas Control)', desc: 'Külək və ya daşma səbəbilə alov sönərsə, qaz təchizatı 0.5 saniyə ərzində avtomatik bağlanır.' },
      { title: 'Yüksək Yanma Səmərəliliyi', desc: 'Mavi alov texnologiyası ilə maksimum istilik verimi yaradır, qaz itkisinin qarşısını alır.' },
      { title: 'Paslanmaz Orijinal Ərinti', desc: 'Yüksək temperatura dözümlü xüsusi ərinti korroziyaya uğramır və deşiklər tutulmur.' },
      { title: 'Bərabər İstilik Paylanması', desc: 'Qazan və tavaların dibinə istiliyi tam bərabər yayaraq yeməklərin dibinin yanmasını önləyir.' },
    ],
  },
  {
    id: 'art-lotus-rapidair',
    title: 'Lotus 360° Rapid Air & Sağlam Qızartma',
    subtitle: 'Yağsız və 90%-dək daha az kalorili xırtıldayan yemək bişirmə texnologiyası.',
    badge: '🪷 LOTUS: 360° Rapid Air',
    icon: 'Flame',
    active: true,
    advantages: [
      { title: '360° İntensiv İsti Hava', desc: 'Sirkulyasiyalı isti hava ilə yeməklər bərabər və xırtıldayan bişir.' },
      { title: 'Şüşə Qab və İşıqlandırma', desc: 'Bişmə prosesini qapağı açmadan rahatlıqla izləmə imkanı.' },
      { title: '8 Sensorlu Proqram', desc: 'Ət, tərəvəz, xəmir və qızartmalar üçün bir toxunuşla hazır rejimlər.' },
      { title: 'Asan Təmizlənən Örtük', desc: 'Yanmağa və yapışmağa qarşı xüsusi dözümlü qab örtüyü.' },
    ],
  },
  {
    id: 'art-convection',
    title: '3D Dairəvi Konveksiya və Bərabər Bişirmə',
    subtitle: 'Sobada ventilyator və dairəvi qızdırıcı element vasitəsilə restoran səviyyəsində bişirmə imkanı.',
    badge: '🌪️ 3D Konveksiya',
    icon: 'Wind',
    active: true,
    advantages: [
      { title: 'Bərabər İstilik Sirkulyasiyası', desc: 'İsti hava kameranın hər nöqtəsinə çatır, yeməklər hər iki tərəfdən qızılı bişir.' },
      { title: 'Çoxsəviyyəli Eyni Vaxtda Bişirmə', desc: '2 və ya 3 səviyyədə fərqli yeməkləri qoxuları qarışmadan eyni anda bişirə bilərsiniz.' },
      { title: '25% Daha Tez Hazırlıq', desc: 'Ənənəvi statik sobalara nisbətən yeməklər daha qısa müddətdə hazır olur.' },
      { title: 'Şirəli Daxili, Xırtıldayan Qabıq', desc: 'Yeməyin şirəsini daxilində saxlayaraq xaricdən mükəmməl xırtıldayan dad verir.' },
    ],
  },
  {
    id: 'art-lotus-touch',
    title: 'Lotus Ağıllı Sensor İdarəetmə & LED Displey',
    subtitle: 'Dəqiq temperatur və vaxt nəzarəti ilə erqonomik və zərif istifadə təcrübəsi.',
    badge: '🎛️ LOTUS: Smart Sensor',
    icon: 'Zap',
    active: true,
    advantages: [
      { title: 'Dəqiq Rəqəmsal Nəzarət', desc: 'Dərəcə və taymeri saniyə dəqiqliyi ilə tənzimləmə.' },
      { title: 'Təhlükəsizlik Sistemi', desc: 'Həddindən artıq qızmadan qorunma və avtomatik sönmə.' },
      { title: 'Temperli Şüşə Panel', desc: 'Cızılmaya dözümlü və asan silinən premium material.' },
      { title: 'Səssiz Sensor Düymələr', desc: 'Yüksək həssaslıqlı sensor reaksiyası ilə rahat idarəetmə.' },
    ],
  },
];

for (const dbPath of ['./data/catalog.sqlite', './data/catalog-draft.sqlite']) {
  const db = createCatalogDatabase(dbPath);
  const current = db.getCatalog();
  current.articles = NEW_ARTICLES;
  db.saveCatalog(current);
  console.log('Successfully updated articles in:', dbPath, 'Total:', current.articles.length);
}
