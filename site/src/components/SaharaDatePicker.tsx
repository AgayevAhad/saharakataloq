import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { ThemeColors } from '../types/theme';

interface SaharaDatePickerProps {
  value: string; // YYYY-MM-DD or empty
  onChange: (value: string) => void;
  theme: ThemeColors;
  themeMode: 'light' | 'dark';
  placeholder?: string;
  minYear?: number;
  maxYear?: number;
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

const WEEK_DAYS_AZ = ['B.e', 'Ç.a', 'Ç.', 'C.a', 'C.', 'Ş.', 'B.'];

export const SaharaDatePicker: React.FC<SaharaDatePickerProps> = ({
  value,
  onChange,
  theme,
  themeMode,
  placeholder = 'Tarix seçin',
  minYear = 1940,
  maxYear = new Date().getFullYear(),
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to current date
  const parsedDate = value ? new Date(value + 'T00:00:00') : null;
  const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

  const [viewYear, setViewYear] = useState<number>(() =>
    isValidDate ? parsedDate.getFullYear() : 1995
  );
  const [viewMonth, setViewMonth] = useState<number>(() =>
    isValidDate ? parsedDate.getMonth() : 0
  );
  const [selectedDateStr, setSelectedDateStr] = useState<string>(value || '');

  useEffect(() => {
    if (value) {
      const d = new Date(value + 'T00:00:00');
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
        setSelectedDateStr(value);
      }
    } else {
      setSelectedDateStr('');
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Generate Year options
  const years = [];
  for (let y = maxYear; y >= minYear; y--) {
    years.push(y);
  }

  // Days in month calculation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  // First day of month (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  let firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  // Adjust so that Monday is 0, Sunday is 6
  firstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => Math.max(minYear, y - 1));
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => Math.min(maxYear, y + 1));
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const formatted = `${viewYear}-${mm}-${dd}`;
    setSelectedDateStr(formatted);
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedDateStr('');
    onChange('');
  };

  // Format display date: e.g. "15 May 1995"
  const formattedDisplay = isValidDate
    ? `${parsedDate.getDate()} ${MONTH_NAMES_AZ[parsedDate.getMonth()]} ${parsedDate.getFullYear()}`
    : '';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {/* Trigger Button */}
      <button
        type="button"
        data-testid="sahara-date-picker-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          width: '100%',
          padding: '11px 14px',
          borderRadius: '12px',
          border: isOpen ? '1px solid #dc2626' : `1px solid ${theme.border}`,
          backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
          color: selectedDateStr ? theme.text : theme.textMuted,
          fontSize: '14px',
          fontWeight: 600,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          boxSizing: 'border-box',
          boxShadow: isOpen ? '0 0 0 3px rgba(220, 38, 38, 0.15)' : 'none',
          transition: 'all 0.15s ease',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CalendarIcon size={17} color={isOpen ? '#dc2626' : theme.textMuted} />
          <span>{formattedDisplay || placeholder}</span>
        </div>

        {selectedDateStr && (
          <div
            onClick={handleClear}
            style={{
              padding: '2px',
              borderRadius: '50%',
              backgroundColor: themeMode === 'dark' ? '#1e293b' : '#e2e8f0',
              color: theme.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Təmizlə"
          >
            <X size={14} />
          </div>
        )}
      </button>

      {/* Floating Interactive Calendar Dropdown */}
      {isOpen && (
        <div
          data-testid="sahara-date-picker-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            zIndex: 100,
            width: '320px',
            maxWidth: '90vw',
            backgroundColor: themeMode === 'dark' ? '#1e293b' : '#ffffff',
            borderRadius: '18px',
            border: `1px solid ${theme.border}`,
            boxShadow:
              themeMode === 'dark'
                ? '0 16px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255,255,255,0.06)'
                : '0 16px 36px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0,0,0,0.04)',
            padding: '18px',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {/* Header Controls: Month & Year Dropdowns + Navigation */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
              marginBottom: '14px',
            }}
          >
            <button
              type="button"
              aria-label="Əvvəlki ay"
              onClick={handlePrevMonth}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f1f5f9',
                color: theme.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronLeft size={16} />
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              {/* Month Selector */}
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                style={{
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border}`,
                  backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                  color: theme.text,
                  fontSize: '13px',
                  fontWeight: 800,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {MONTH_NAMES_AZ.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>

              {/* Year Selector */}
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                style={{
                  padding: '6px 8px',
                  borderRadius: '8px',
                  border: `1px solid ${theme.border}`,
                  backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f8fafc',
                  color: theme.text,
                  fontSize: '13px',
                  fontWeight: 800,
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              aria-label="Növbəti ay"
              onClick={handleNextMonth}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: `1px solid ${theme.border}`,
                backgroundColor: themeMode === 'dark' ? '#0f172a' : '#f1f5f9',
                color: theme.text,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              textAlign: 'center',
              marginBottom: '6px',
            }}
          >
            {WEEK_DAYS_AZ.map((wd) => (
              <div
                key={wd}
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: theme.textMuted,
                  padding: '4px 0',
                }}
              >
                {wd}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '4px',
            }}
          >
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const mm = String(viewMonth + 1).padStart(2, '0');
              const dd = String(dayNum).padStart(2, '0');
              const cellDateStr = `${viewYear}-${mm}-${dd}`;
              const isSelected = selectedDateStr === cellDateStr;

              return (
                <button
                  key={cellDateStr}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  style={{
                    padding: '8px 0',
                    borderRadius: '8px',
                    border: isSelected ? 'none' : '1px solid transparent',
                    backgroundColor: isSelected ? '#dc2626' : 'transparent',
                    color: isSelected ? '#ffffff' : theme.text,
                    fontSize: '13px',
                    fontWeight: isSelected ? 900 : 600,
                    cursor: 'pointer',
                    transition: 'all 0.12s ease',
                    boxShadow: isSelected ? '0 2px 8px rgba(220, 38, 38, 0.4)' : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor =
                        themeMode === 'dark' ? '#0f172a' : '#f1f5f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* Quick Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '14px',
              paddingTop: '10px',
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <button
              type="button"
              onClick={() => {
                const now = new Date();
                const mm = String(now.getMonth() + 1).padStart(2, '0');
                const dd = String(now.getDate()).padStart(2, '0');
                const todayStr = `${now.getFullYear()}-${mm}-${dd}`;
                setSelectedDateStr(todayStr);
                onChange(todayStr);
                setIsOpen(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#dc2626',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                padding: '4px 6px',
              }}
            >
              Bugün
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: theme.textSecondary,
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '4px 6px',
              }}
            >
              Bağla
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
