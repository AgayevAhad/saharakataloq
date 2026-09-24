import React, { useState } from 'react';
import { Sparkles, ArrowRight, RotateCcw, CheckCircle2, ChevronRight } from 'lucide-react';
import { Product } from '../../types/product';
import { ThemeColors } from '../../types/theme';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface SaharaMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  theme: ThemeColors;
  onSelectProduct: (product: Product) => void;
}

export const SaharaMatchModal: React.FC<SaharaMatchModalProps> = ({
  isOpen,
  onClose,
  products,
  theme,
  onSelectProduct,
}) => {
  const [step, setStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [familySize, setFamilySize] = useState<string | null>(null);
  const [priority, setPriority] = useState<string | null>(null);

  const resetMatch = () => {
    setStep(0);
    setSelectedCategory(null);
    setFamilySize(null);
    setPriority(null);
  };

  const matchedProducts = products.filter((p) => {
    if (selectedCategory && p.category !== selectedCategory) return false;
    return true;
  }).slice(0, 3);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetMatch();
        onClose();
      }}
      title="Sahara Match — Ağıllı Seçim Köməkçisi"
      description="Ehtiyaclarınıza və məkanınıza ən uyğun rəsmi modeli tapın"
      maxWidth="620px"
    >
      <div style={{ padding: '8px 0' }}>
        {step === 0 && (
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
              1. Hansı kateqoriyada texnika axtarırsınız?
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
              {[
                { id: 'cooktop', title: 'Qaz & Elektrik Plitəsi' },
                { id: 'oven', title: 'Quraşdırılan Soba' },
                { id: 'hood', title: 'Mətbəx Aspiratoru' },
                { id: 'refrigerator', title: 'Soyuducu' },
                { id: 'washer', title: 'Paltaryuyan' },
                { id: 'air_conditioner', title: 'Kondisioner' },
                { id: 'tv', title: 'Smart Televizor' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(item.id);
                    setStep(1);
                  }}
                  style={{
                    padding: '14px',
                    borderRadius: '12px',
                    border: `1.5px solid ${selectedCategory === item.id ? theme.primary : theme.border}`,
                    backgroundColor: selectedCategory === item.id ? 'rgba(220, 38, 38, 0.08)' : theme.bgCard,
                    color: theme.text,
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
              2. İstifadə intensivliyi və ailə üzvlərinin sayı:
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { id: 'small', title: '1-2 Nəfər (Kompakt / Gündəlik Yüngül İstifadə)' },
                { id: 'medium', title: '3-4 Nəfər (Standart Ailə & Tez-tez Bişirmə)' },
                { id: 'large', title: '5+ Nəfər (Geniş Həcm & Yüksək Güc Tələbatı)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setFamilySize(item.id);
                    setStep(2);
                  }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: `1.5px solid ${familySize === item.id ? theme.primary : theme.border}`,
                    backgroundColor: familySize === item.id ? 'rgba(220, 38, 38, 0.08)' : theme.bgCard,
                    color: theme.text,
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{item.title}</span>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '14px' }}>
              3. Sizin üçün ən vacib prioritet hansıdır?
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { id: 'efficiency', title: 'Maksimal Enerji Qənaəti (Inverter / A+++)' },
                { id: 'design', title: 'Zərif İtalyan Dizaynı & Şüşə/Inox Material' },
                { id: 'safety', title: 'Tam Təhlükəsizlik (Qaz Nəzarəti, Uşaq Kilidi)' },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setPriority(item.id);
                    setStep(3);
                  }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: `1.5px solid ${priority === item.id ? theme.primary : theme.border}`,
                    backgroundColor: priority === item.id ? 'rgba(220, 38, 38, 0.08)' : theme.bgCard,
                    color: theme.text,
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{item.title}</span>
                  <CheckCircle2 size={16} style={{ color: theme.primary }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#16a34a' }}>
              <CheckCircle2 size={20} />
              <span style={{ fontWeight: 700, fontSize: '15px' }}>
                Kriteriyalarınıza uyğun tövsiyə olunan modellər:
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {matchedProducts.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '12px',
                    borderRadius: '12px',
                    border: `1px solid ${theme.border}`,
                    backgroundColor: theme.bgCard,
                  }}
                >
                  <img
                    src={p.image || '/media/placeholder.png'}
                    alt={p.title}
                    style={{ width: '60px', height: '60px', objectFit: 'contain', borderRadius: '8px' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: theme.primary }}>
                      {p.code}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: theme.text }}>
                      {p.title}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      onSelectProduct(p);
                      onClose();
                    }}
                  >
                    Bax
                  </Button>
                </div>
              ))}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between' }}>
              <Button variant="outline" size="sm" onClick={resetMatch} leftIcon={<RotateCcw size={14} />}>
                Yenidən Başla
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
