import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  Headphones,
  Phone,
  RotateCcw,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { CatalogSettings } from '../types/product';
import { ThemeColors } from '../types/theme';
import { WhatsAppIcon } from '../components/WhatsAppIcon';

export type CustomerCareKind = 'delivery' | 'warranty' | 'returns' | 'faq';

interface CustomerCarePageProps {
  kind: CustomerCareKind;
  settings?: CatalogSettings;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  onNavigate: (route: string) => void;
  onWhatsApp: () => void;
  onCall: () => void;
}

const PAGE_CONTENT = {
  delivery: {
    eyebrow: 'Sifariş və təhvil prosesi',
    title: 'Çatdırılma',
    description:
      'Sifarişin təsdiqindən məhsulun təhvilinə qədər hər mərhələdə ünvan, vaxt və xidmət detalları sizinlə razılaşdırılır.',
    icon: Truck,
    steps: [
      {
        title: 'Sifarişin təsdiqi',
        text: 'Seçdiyiniz modelin mövcudluğu və əlaqə məlumatları əməkdaş tərəfindən yoxlanılır.',
      },
      {
        title: 'Ünvan və vaxtın razılaşdırılması',
        text: 'Əhatə dairəsi, təxmini vaxt və mümkün xidmət haqqı sifariş təsdiqlənərkən dəqiqləşdirilir.',
      },
      {
        title: 'Təhvil zamanı yoxlama',
        text: 'Məhsulun modeli, komplektliyi və xarici vəziyyəti təhvil sənədləri imzalanmazdan əvvəl yoxlanılır.',
      },
    ],
    note: 'Dəqiq çatdırılma müddəti və şərtləri ünvan, məhsulun ölçüsü və anbardakı mövcudluğa görə dəyişə bilər.',
  },
  warranty: {
    eyebrow: 'Rəsmi məhsul dəstəyi',
    title: 'Zəmanət',
    description:
      'Zəmanət şərtləri modelə, istehsalçıya və satış zamanı təqdim edilən rəsmi sənədlərə əsasən tətbiq olunur.',
    icon: ShieldCheck,
    steps: [
      {
        title: 'Sənədləri qoruyun',
        text: 'Alışı təsdiqləyən sənədi, zəmanət məlumatını və məhsulun seriya nömrəsini saxlayın.',
      },
      {
        title: 'Problemi qeydə alın',
        text: 'Nasazlığın necə yarandığını izah edin; mümkündürsə foto və ya qısa video əlavə edin.',
      },
      {
        title: 'Rəsmi yoxlama',
        text: 'Növbəti addım məhsulun və zəmanət sənədlərinin yoxlanılmasından sonra bildirilir.',
      },
    ],
    note: 'Zəmanət müddəti və istisnalar məhsul kartında və sizə təqdim olunan istehsalçı sənədində göstərilən məlumatla müəyyən edilir.',
  },
  returns: {
    eyebrow: 'Aydın müraciət prosesi',
    title: 'Qaytarma və dəyişdirmə',
    description:
      'Qaytarma və dəyişdirmə müraciətləri məhsulun vəziyyəti, satış sənədləri və qüvvədə olan istehlakçı hüquqları əsasında qiymətləndirilir.',
    icon: RotateCcw,
    steps: [
      {
        title: 'Əvvəlcə bizimlə əlaqə saxlayın',
        text: 'Sifariş məlumatını və müraciətin səbəbini WhatsApp və ya telefonla bildirin.',
      },
      {
        title: 'Məhsulu və komplekti qoruyun',
        text: 'Məhsulu, aksesuarları, sənədləri və mövcud qablaşdırmanı yoxlama üçün hazır saxlayın.',
      },
      {
        title: 'Nəticəni gözləyin',
        text: 'Yoxlamadan sonra dəyişdirmə, servis və ya qaytarma ilə bağlı uyğun həll sizə təqdim edilir.',
      },
    ],
    note: 'Məhsulu razılaşdırılmamış ünvana göndərməyin. İlkin müraciətdən sonra qəbul nöqtəsi və tələb olunan sənədlər sizə bildiriləcək.',
  },
} as const;

const FAQ_ITEMS = [
  {
    question: 'Sifarişi necə rəsmiləşdirə bilərəm?',
    answer:
      'Məhsulu səbətə əlavə edib sifariş məlumatlarını göndərə və ya məhsul kartındakı WhatsApp və zəng düymələri ilə satış əməkdaşına müraciət edə bilərsiniz.',
  },
  {
    question: 'Çatdırılma vaxtını haradan öyrənə bilərəm?',
    answer:
      'Dəqiq vaxt məhsulun mövcudluğu və ünvan yoxlanıldıqdan sonra əməkdaş tərəfindən sizinlə razılaşdırılır.',
  },
  {
    question: 'Zəmanət müddəti bütün məhsullarda eynidirmi?',
    answer:
      'Xeyr. Müddət və şərtlər istehsalçıya və modelə görə dəyişə bilər. Əsas məlumat məhsulun rəsmi zəmanət sənədində göstərilir.',
  },
  {
    question: 'Qaytarma müraciəti üçün nə lazımdır?',
    answer:
      'Sifariş və ya alış sənədi, məhsulun özü, komplekt hissələr və müraciətin səbəbi tələb oluna bilər. Dəqiq siyahı ilkin əlaqə zamanı bildirilir.',
  },
  {
    question: 'Məhsul seçimi üçün məsləhət ala bilərəm?',
    answer:
      'Bəli. Kataloqdakı modeldən WhatsApp və ya zəng vasitəsilə müraciət etdikdə əməkdaş məhsulun mövcud məlumatları əsasında seçimdə kömək edir.',
  },
];

export const CustomerCarePage: React.FC<CustomerCarePageProps> = ({
  kind,
  settings,
  theme,
  themeMode,
  onNavigate,
  onWhatsApp,
  onCall,
}) => {
  const [openFaq, setOpenFaq] = useState(0);
  const page = kind === 'faq' ? null : PAGE_CONTENT[kind];
  const PageIcon = page?.icon || Headphones;
  const phone = settings?.phoneNumbers?.find(Boolean) || settings?.phoneNumber;

  const relatedLinks = useMemo(
    () => [
      { route: 'delivery', label: 'Çatdırılma', icon: Truck },
      { route: 'warranty', label: 'Zəmanət', icon: ShieldCheck },
      { route: 'returns', label: 'Qaytarma', icon: RotateCcw },
      { route: 'faq', label: 'Tez-tez verilən suallar', icon: Headphones },
    ],
    []
  );

  return (
    <div className="customer-care-page catalog-container">
      <section
        className="customer-care-hero"
        style={{
          backgroundColor: themeMode === 'dark' ? '#111827' : '#ffffff',
          borderColor: theme.border,
        }}
      >
        <div className="customer-care-icon" aria-hidden="true">
          <PageIcon size={28} />
        </div>
        <div>
          <span className="customer-care-eyebrow">{page?.eyebrow || 'Müştəri dəstəyi'}</span>
          <h1>{page?.title || 'Tez-tez verilən suallar'}</h1>
          <p style={{ color: theme.textSecondary }}>
            {page?.description ||
              'Sifariş, çatdırılma, zəmanət və qaytarma ilə bağlı ən çox verilən sualların qısa və aydın cavabları.'}
          </p>
        </div>
      </section>

      {page ? (
        <>
          <section className="customer-care-steps" aria-label={`${page.title} mərhələləri`}>
            {page.steps.map((step, index) => (
              <article
                key={step.title}
                className="customer-care-step-card scroll-reveal-item"
                style={{
                  backgroundColor: themeMode === 'dark' ? '#111827' : '#ffffff',
                  borderColor: theme.border,
                }}
              >
                <span className="customer-care-step-number">{index + 1}</span>
                <div>
                  <h2 style={{ color: theme.text }}>{step.title}</h2>
                  <p style={{ color: theme.textSecondary }}>{step.text}</p>
                </div>
              </article>
            ))}
          </section>

          <div
            className="customer-care-note scroll-reveal-item"
            style={{
              backgroundColor: themeMode === 'dark' ? 'rgba(30, 41, 59, 0.7)' : '#f8fafc',
              borderColor: theme.border,
            }}
          >
            <ClipboardCheck size={22} color="#e31e24" />
            <p style={{ color: theme.textSecondary }}>{page.note}</p>
          </div>
        </>
      ) : (
        <section className="customer-care-faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index;
            return (
              <article
                key={item.question}
                className="scroll-reveal-item"
                style={{
                  backgroundColor: themeMode === 'dark' ? '#111827' : '#ffffff',
                  borderColor: theme.border,
                }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenFaq(isOpen ? -1 : index)}
                  style={{ color: theme.text }}
                >
                  <span>{item.question}</span>
                  <ChevronDown size={18} className={isOpen ? 'is-open' : ''} />
                </button>
                {isOpen && <p style={{ color: theme.textSecondary }}>{item.answer}</p>}
              </article>
            );
          })}
        </section>
      )}

      <section
        className="customer-care-contact scroll-reveal-item"
        style={{
          backgroundColor: themeMode === 'dark' ? '#111827' : '#ffffff',
          borderColor: theme.border,
        }}
      >
        <div>
          <span>
            <CheckCircle2 size={15} /> Birbaşa dəstək
          </span>
          <h2 style={{ color: theme.text }}>Sualınız cavabsız qaldı?</h2>
          <p style={{ color: theme.textSecondary }}>
            {phone
              ? `${phone} nömrəsi ilə əlaqə saxlayın`
              : 'Satış və dəstək komandamızla əlaqə saxlayın'}{' '}
            və ya WhatsApp-dan yazın.
          </p>
        </div>
        <div
          className="customer-care-contact-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            onClick={onWhatsApp}
            style={{
              height: '46px',
              padding: '0 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              color: '#16a34a',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 700,
              transition: 'background-color 0.2s ease, transform 0.15s ease',
            }}
          >
            <WhatsAppIcon size={18} color="#16a34a" /> WhatsApp ilə yazın
          </button>
          <button
            type="button"
            onClick={onCall}
            style={{
              height: '46px',
              padding: '0 20px',
              borderRadius: '12px',
              backgroundColor: 'rgba(220, 38, 38, 0.10)',
              color: '#dc2626',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 700,
              transition: 'background-color 0.2s ease, transform 0.15s ease',
            }}
          >
            <Phone size={18} color="#dc2626" /> Zəng edin
          </button>
        </div>
      </section>

      <nav
        className="customer-care-related scroll-reveal-item"
        aria-label="Müştəri məlumat səhifələri"
      >
        {relatedLinks.map((link) => {
          const Icon = link.icon;
          return (
            <button
              type="button"
              key={link.route}
              className={kind === link.route ? 'is-active' : ''}
              onClick={() => onNavigate(link.route)}
              style={{
                color: kind === link.route ? '#ffffff' : theme.text,
                borderColor: theme.border,
              }}
            >
              <Icon size={16} />
              <span>{link.label}</span>
              <ArrowRight size={14} />
            </button>
          );
        })}
      </nav>
    </div>
  );
};
