import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Check, RotateCcw, X } from 'lucide-react';
import { ThemeColors } from '../types/theme';

interface ModernCalendarPickerProps {
  theme: ThemeColors;
  startDate: string;
  endDate: string;
  onApply: (start: string, end: string) => void;
  onClose?: () => void;
}

const MONTH_NAMES_AZ = [
  'Yanvar',
  'Fevral',
  'Mart',
  'Aprel',
  'May',
  'İyun',
  'İyul',
  'Avqust',
  'Sentyabr',
  'Oktyabr',
  'Noyabr',
  'Dekabr',
];

const WEEKDAY_NAMES_AZ = ['B.e', 'Ç.a', 'Ç', 'C.a', 'C', 'Ş', 'B'];

const formatDateIso = (year: number, month: number, day: number): string => {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
};

const formatDisplayDateAz = (isoDate: string): string => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  return `${d} ${MONTH_NAMES_AZ[m - 1]} ${y}`;
};

export const ModernCalendarPicker: React.FC<ModernCalendarPickerProps> = ({
  theme,
  startDate,
  endDate,
  onApply,
  onClose,
}) => {
  const initialDate = useMemo(() => {
    if (startDate) {
      const [y, m] = startDate.split('-').map(Number);
      if (y && m) return { year: y, month: m - 1 };
    }
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  }, [startDate]);

  const [currentYear, setCurrentYear] = useState<number>(initialDate.year);
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.month);
  const [selectedStart, setSelectedStart] = useState<string>(startDate || '');
  const [selectedEnd, setSelectedEnd] = useState<string>(endDate || '');
  const [hoverDate, setHoverDate] = useState<string | null>(null);

  const todayIso = useMemo(() => {
    const d = new Date();
    return formatDateIso(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const daysInMonth = useMemo(() => {
    return new Date(currentYear, currentMonth + 1, 0).getDate();
  }, [currentYear, currentMonth]);

  // First day offset (0 = Monday, 6 = Sunday in AZ)
  const firstDayOffset = useMemo(() => {
    const raw = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday
    return (raw + 6) % 7; // Convert 0(Sun) -> 6, 1(Mon) -> 0
  }, [currentYear, currentMonth]);

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleDateClick = (iso: string) => {
    if (!selectedStart || (selectedStart && selectedEnd)) {
      // First click: set start date, clear end date
      setSelectedStart(iso);
      setSelectedEnd('');
    } else if (selectedStart && !selectedEnd) {
      // Second click: set end date or swap if clicked before start
      if (iso < selectedStart) {
        setSelectedEnd(selectedStart);
        setSelectedStart(iso);
      } else {
        setSelectedEnd(iso);
      }
    }
  };

  const setPreset = (presetType: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let s = today;
    let e = today;

    if (presetType === 'today') {
      s = today;
      e = today;
    } else if (presetType === 'yesterday') {
      s = new Date(today);
      s.setDate(today.getDate() - 1);
      e = new Date(s);
    } else if (presetType === 'last7') {
      s = new Date(today);
      s.setDate(today.getDate() - 6);
      e = today;
    } else if (presetType === 'last14') {
      s = new Date(today);
      s.setDate(today.getDate() - 13);
      e = today;
    } else if (presetType === 'thisMonth') {
      s = new Date(today.getFullYear(), today.getMonth(), 1);
      e = today;
    } else if (presetType === 'lastMonth') {
      s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      e = new Date(today.getFullYear(), today.getMonth(), 0);
    } else if (presetType === 'last30') {
      s = new Date(today);
      s.setDate(today.getDate() - 29);
      e = today;
    }

    const sIso = formatDateIso(s.getFullYear(), s.getMonth(), s.getDate());
    const eIso = formatDateIso(e.getFullYear(), e.getMonth(), e.getDate());
    setSelectedStart(sIso);
    setSelectedEnd(eIso);
    setCurrentYear(s.getFullYear());
    setCurrentMonth(s.getMonth());
  };

  const handleApply = () => {
    const start = selectedStart || todayIso;
    const end = selectedEnd || selectedStart || todayIso;
    onApply(start, end);
  };

  const handleReset = () => {
    setSelectedStart('');
    setSelectedEnd('');
    setHoverDate(null);
  };

  return (
    <div
      className="modern-calendar-root"
      style={{
        background: theme.bgCard,
        borderColor: theme.border,
        color: theme.text,
      }}
    >
      {/* Top Header */}
      <div className="modern-calendar-topbar">
        <div className="modern-calendar-title-wrap">
          <CalendarIcon size={18} color={theme.primary} />
          <div>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Təqvim ilə Aralıq Seçin</h4>
            <span style={{ fontSize: '12px', color: theme.textMuted }}>
              İstədiyiniz başlanğıc və son günü birbaşa təqvimdən klikləyərək seçin
            </span>
          </div>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="modern-calendar-close-btn"
            style={{ color: theme.textMuted, borderColor: theme.border }}
            title="Bağla"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="modern-calendar-body-grid">
        {/* Left Side: Quick Presets */}
        <div className="modern-calendar-presets-col" style={{ borderColor: theme.border }}>
          <span className="presets-label" style={{ color: theme.textMuted }}>
            Sürətli Seçimlər
          </span>
          <button type="button" onClick={() => setPreset('today')} className="preset-btn">
            Bu gün
          </button>
          <button type="button" onClick={() => setPreset('yesterday')} className="preset-btn">
            Dünən
          </button>
          <button type="button" onClick={() => setPreset('last7')} className="preset-btn">
            Son 7 gün
          </button>
          <button type="button" onClick={() => setPreset('last14')} className="preset-btn">
            Son 14 gün
          </button>
          <button type="button" onClick={() => setPreset('thisMonth')} className="preset-btn">
            Bu ay
          </button>
          <button type="button" onClick={() => setPreset('lastMonth')} className="preset-btn">
            Ötən ay
          </button>
          <button type="button" onClick={() => setPreset('last30')} className="preset-btn">
            Son 30 gün
          </button>
        </div>

        {/* Right Side: Interactive Calendar */}
        <div className="modern-calendar-main-col">
          {/* Month / Year Navigator */}
          <div className="calendar-nav-row">
            <button
              type="button"
              onClick={prevMonth}
              className="calendar-nav-btn"
              style={{ borderColor: theme.border, color: theme.text }}
              title="Əvvəlki ay"
            >
              <ChevronLeft size={17} />
            </button>

            <span className="calendar-month-year-label">
              {MONTH_NAMES_AZ[currentMonth]} {currentYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              className="calendar-nav-btn"
              style={{ borderColor: theme.border, color: theme.text }}
              title="Növbəti ay"
            >
              <ChevronRight size={17} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="calendar-weekdays-grid">
            {WEEKDAY_NAMES_AZ.map((w, idx) => (
              <span
                key={w}
                className={`weekday-cell ${idx >= 5 ? 'weekend' : ''}`}
                style={{ color: theme.textMuted }}
              >
                {w}
              </span>
            ))}
          </div>

          {/* Days Matrix */}
          <div className="calendar-days-grid" onMouseLeave={() => setHoverDate(null)}>
            {/* Empty cells for offset */}
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="calendar-day-cell empty-cell" />
            ))}

            {/* Days of current month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const iso = formatDateIso(currentYear, currentMonth, dayNum);

              const isStart = selectedStart === iso;
              const isEnd = selectedEnd === iso;
              const isToday = todayIso === iso;

              let inRange = false;
              if (selectedStart && selectedEnd) {
                inRange = iso >= selectedStart && iso <= selectedEnd;
              } else if (selectedStart && hoverDate) {
                const min = selectedStart < hoverDate ? selectedStart : hoverDate;
                const max = selectedStart < hoverDate ? hoverDate : selectedStart;
                inRange = iso >= min && iso <= max;
              }

              return (
                <div
                  key={iso}
                  className={`calendar-day-cell ${isStart ? 'is-start' : ''} ${isEnd ? 'is-end' : ''} ${
                    inRange ? 'in-range' : ''
                  }`}
                  onClick={() => handleDateClick(iso)}
                  onMouseEnter={() => {
                    if (selectedStart && !selectedEnd) setHoverDate(iso);
                  }}
                >
                  <button
                    type="button"
                    className={`day-number-btn ${isStart || isEnd ? 'active-point' : ''} ${
                      isToday ? 'is-today' : ''
                    }`}
                    style={{
                      background: isStart || isEnd ? theme.primary : 'transparent',
                      color: isStart || isEnd ? '#ffffff' : theme.text,
                    }}
                  >
                    {dayNum}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Info & Actions */}
      <div className="modern-calendar-footer" style={{ borderColor: theme.border }}>
        <div className="selected-range-info">
          {selectedStart ? (
            <span style={{ fontSize: '13px', fontWeight: 700 }}>
              📅 Seçilmiş aralıq:{' '}
              <strong style={{ color: theme.primary }}>{formatDisplayDateAz(selectedStart)}</strong>
              {selectedEnd ? (
                <>
                  {' '}
                  — <strong style={{ color: theme.primary }}>{formatDisplayDateAz(selectedEnd)}</strong>
                </>
              ) : (
                <em style={{ color: theme.textMuted, fontWeight: 500, marginLeft: '6px' }}>
                  (Son tarixi seçin və ya eyni günü təsdiqləyin)
                </em>
              )}
            </span>
          ) : (
            <span style={{ fontSize: '13px', color: theme.textMuted }}>
              Təqvimdən başlanğıc və son tarixi seçin
            </span>
          )}
        </div>

        <div className="calendar-footer-actions">
          {selectedStart && (
            <button
              type="button"
              onClick={handleReset}
              className="calendar-reset-btn"
              style={{ borderColor: theme.border, color: theme.textSecondary }}
            >
              <RotateCcw size={13} />
              <span>Sıfırla</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleApply}
            disabled={!selectedStart}
            className="calendar-apply-btn"
            style={{
              background: selectedStart ? theme.primary : theme.bgSecondary,
              color: selectedStart ? '#ffffff' : theme.textMuted,
              cursor: selectedStart ? 'pointer' : 'not-allowed',
            }}
          >
            <Check size={15} />
            <span>Tətbiq et və Göstər</span>
          </button>
        </div>
      </div>
    </div>
  );
};
