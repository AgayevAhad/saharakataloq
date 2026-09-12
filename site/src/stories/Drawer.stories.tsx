import React, { useState } from 'react';
import { Drawer } from '../components/ui/Drawer';
import { Button } from '../components/ui/Button';

export const InteractiveDrawer = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ padding: '24px' }}>
      <Button onClick={() => setIsOpen(true)}>Yan Paneli Aç</Button>
      <Drawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Filterlər və Seçimlər"
        position="right"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p>Məhsulları brend və kateqoriyaya görə seçin.</p>
          <Button fullWidth onClick={() => setIsOpen(false)}>
            Filterləri Tətbiq Et
          </Button>
        </div>
      </Drawer>
    </div>
  );
};
