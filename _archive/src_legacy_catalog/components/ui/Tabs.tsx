import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  ariaLabel = 'Bölmələr',
  className = '',
  style,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const enabledTabs = tabs.filter((t) => !t.disabled);
    const currentIndex = enabledTabs.findIndex((t) => t.id === activeTab);
    if (currentIndex === -1) return;

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      const next = enabledTabs[(currentIndex + 1) % enabledTabs.length];
      if (next) onChange(next.id);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const prev = enabledTabs[(currentIndex - 1 + enabledTabs.length) % enabledTabs.length];
      if (prev) onChange(prev.id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      if (enabledTabs[0]) onChange(enabledTabs[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      if (enabledTabs[enabledTabs.length - 1]) onChange(enabledTabs[enabledTabs.length - 1].id);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
      className={`sahara-tabs ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px',
        borderRadius: '12px',
        backgroundColor: 'rgba(148, 163, 184, 0.08)',
        overflowX: 'auto',
        maxWidth: '100%',
        ...style,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls={`tabpanel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={`sahara-tab-btn ${isActive ? 'active' : ''}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 500,
              cursor: tab.disabled ? 'not-allowed' : 'pointer',
              backgroundColor: isActive ? 'var(--bg-card, #ffffff)' : 'transparent',
              color: isActive ? 'var(--primary, #dc2626)' : 'inherit',
              boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: tab.disabled ? 0.4 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {tab.icon && <span aria-hidden="true">{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.badge !== undefined && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '999px',
                  backgroundColor: isActive ? 'rgba(220, 38, 38, 0.12)' : 'rgba(148, 163, 184, 0.15)',
                  color: isActive ? '#dc2626' : 'inherit',
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
