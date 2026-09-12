import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';

export const InteractiveModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div style={{ padding: '24px' }}>
      <Button onClick={() => setIsOpen(true)}>Modali Aç</Button>
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Məhsul Detalları"
        description="Məhsul haqqında tam texniki məlumat"
      >
        <div>
          <p style={{ marginBottom: '16px', lineHeight: 1.6 }}>
            ARDO Quraşdırılan Soba italyan keyfiyyəti və SABAF texnologiyası ilə təchiz olunmuşdur.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Bağla
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Təsdiqlə
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
