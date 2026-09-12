// @vitest-environment happy-dom
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Tabs } from '../components/ui/Tabs';
import { Modal } from '../components/ui/Modal';
import { Drawer } from '../components/ui/Drawer';
import { Toast } from '../components/ui/Toast';
import { EmptyState } from '../components/ui/EmptyState';
import { NetworkState } from '../components/ui/NetworkState';

describe('axe Accessibility Audit Suite (Zero Critical/Serious Violations)', () => {
  it('Button passes axe accessibility rules', async () => {
    const { container } = render(<Button>Daxil ol</Button>);
    const results = await axe.run(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa'],
      },
    });

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toHaveLength(0);
  });

  it('Input with label and error passes axe accessibility rules', async () => {
    const { container } = render(
      <Input
        id="phone-input"
        label="Mobil nömrə"
        placeholder="+994"
        error="Düzgün nömrə daxil edin"
      />
    );
    const results = await axe.run(container, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa'],
      },
    });

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toHaveLength(0);
  });

  it('Badge passes axe accessibility rules', async () => {
    const { container } = render(<Badge variant="success">Stokda var</Badge>);
    const results = await axe.run(container);

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toHaveLength(0);
  });

  it('Tabs with real component tabpanel pass axe accessibility rules', async () => {
    const tabs = [
      { id: 'tab1', label: 'Birinci bölmə', content: <div>Birinci bölmənin mətni</div> },
      { id: 'tab2', label: 'İkinci bölmə', content: <div>İkinci bölmənin mətni</div> },
    ];
    const { container } = render(
      <Tabs tabs={tabs} activeTab="tab1" onChange={() => {}} ariaLabel="Məhsul bölmələri" />
    );

    const results = await axe.run(container);

    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toHaveLength(0);
  });

  it('Modal passes axe accessibility rules', async () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} title="Məhsul Detalları">
        <div>
          <p>Məhsul haqqında ətraflı məlumat.</p>
          <button type="button">Təsdiq et</button>
        </div>
      </Modal>
    );

    const results = await axe.run(container);
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toHaveLength(0);
  });

  it('Drawer passes axe accessibility rules', async () => {
    const { container } = render(
      <Drawer isOpen={true} onClose={() => {}} title="Filtr Seçimləri" position="right">
        <div>
          <button type="button">Tətbiq et</button>
        </div>
      </Drawer>
    );

    const results = await axe.run(container);
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toHaveLength(0);
  });

  it('Toast passes axe accessibility rules', async () => {
    const { container } = render(
      <Toast message="Məlumatlar yadda saxlanıldı" type="success" onClose={() => {}} />
    );

    const results = await axe.run(container);
    const criticalViolations = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalViolations).toHaveLength(0);
  });

  it('EmptyState and NetworkState pass axe accessibility rules', async () => {
    const { container: emptyContainer } = render(
      <EmptyState title="Məhsul tapılmadı" description="Zəhmət olmasa yenidən cəhd edin" />
    );
    const emptyResults = await axe.run(emptyContainer);
    expect(
      emptyResults.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    ).toHaveLength(0);

    const { container: netContainer } = render(<NetworkState onRetry={() => {}} />);
    const netResults = await axe.run(netContainer);
    expect(
      netResults.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')
    ).toHaveLength(0);
  });
});
