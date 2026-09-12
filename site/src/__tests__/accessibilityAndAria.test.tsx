// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Tabs } from '../components/ui/Tabs';
import {
  isBrandContract,
  isCategoryContract,
  isMediaAssetContract,
  isStoreLocationContract,
} from '../types/contracts';

describe('Accessibility, ARIA & Runtime Contract Validation Suite', () => {
  it('Modal manages accessible ARIA roles and labels', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Diqqət" description="Vacib bildiriş">
        <div>Məzmun</div>
      </Modal>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-labelledby')).toContain('modal-title-');
    expect(dialog.getAttribute('aria-describedby')).toContain('modal-desc-');
  });

  it('Input sets correct aria-invalid and aria-describedby for errors', () => {
    render(<Input id="email-field" label="E-poçt" error="Düzgün e-poçt daxil edin" />);

    const input = screen.getByLabelText('E-poçt');
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-describedby')).toBe('email-field-error');
  });

  it('Tabs associate with tabpanels and manage focus with roving tabindex', () => {
    const handleTabChange = vi.fn();
    const tabs = [
      { id: 'tab1', label: 'Birinci' },
      { id: 'tab2', label: 'İkinci' },
    ];

    render(<Tabs tabs={tabs} activeTab="tab1" onChange={handleTabChange} ariaLabel="Test tabs" />);

    const tab1 = screen.getByRole('tab', { name: 'Birinci' });
    const tab2 = screen.getByRole('tab', { name: 'İkinci' });

    expect(tab1.getAttribute('aria-selected')).toBe('true');
    expect(tab1.getAttribute('tabIndex')).toBe('0');
    expect(tab2.getAttribute('aria-selected')).toBe('false');
    expect(tab2.getAttribute('tabIndex')).toBe('-1');
  });

  it('validates runtime type guards correctly', () => {
    expect(isBrandContract({ id: 'ardo', name: 'ARDO', slug: 'ardo', active: true })).toBe(true);
    expect(isBrandContract({ id: 'ardo' })).toBe(false);

    expect(isCategoryContract({ id: 'c1', name: 'Sobalar', slug: 'sobalar', active: true })).toBe(
      true
    );
    expect(isCategoryContract({ id: 'c1', name: 123 })).toBe(false);

    expect(isMediaAssetContract({ id: 'm1', type: 'image', url: '/img.jpg' })).toBe(true);
    expect(isMediaAssetContract({ id: 'm1', type: 'audio' })).toBe(false);

    expect(
      isStoreLocationContract({
        id: 's1',
        title: 'Əsas Filial',
        address: 'Bakı',
        phoneNumbers: ['012'],
      })
    ).toBe(true);
    expect(isStoreLocationContract({ id: 's1', title: 'Əsas Filial' })).toBe(false);
  });
});
