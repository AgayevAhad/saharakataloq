import React, { useState } from 'react';
import { Tabs } from '../components/ui/Tabs';
import { Sparkles, FileText, Truck } from 'lucide-react';

export const DefaultTabs = () => {
  const [activeTab, setActiveTab] = useState('specs');

  const tabs = [
    { id: 'overview', label: 'Ümumi Məlumat', icon: <Sparkles size={16} /> },
    { id: 'specs', label: 'Texniki Göstəricilər', icon: <FileText size={16} />, badge: 8 },
    { id: 'delivery', label: 'Çatdırılma və Zəmanət', icon: <Truck size={16} /> },
  ];

  return (
    <div style={{ maxWidth: '600px', padding: '16px' }}>
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      <div
        style={{
          marginTop: '16px',
          padding: '16px',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: '12px',
        }}
      >
        {activeTab === 'overview' && <p>Məhsulun ümumi dizayn xüsusiyyətləri və icmalı.</p>}
        {activeTab === 'specs' && (
          <p>Ölçülər: 60x60x85 sm, SABAF qaz odluqları, İtaliya istehsalı.</p>
        )}
        {activeTab === 'delivery' && <p>Təhvil və çatdırılma məlumatları.</p>}
      </div>
    </div>
  );
};
