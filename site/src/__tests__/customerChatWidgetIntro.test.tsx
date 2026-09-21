import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { CustomerChatWidget } from '../components/site/CustomerChatWidget';

describe('CustomerChatWidget 1.5s Center Hold & Smooth Helper Dismissal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initially mounts with is-intro class and helper message', () => {
    const { container } = render(<CustomerChatWidget user={null} onOpenAccount={vi.fn()} />);
    const widget = container.querySelector('.customer-chat-widget');
    expect(widget).toBeTruthy();
    expect(widget?.classList.contains('is-intro')).toBe(true);

    const helper = container.querySelector('.customer-chat-helper');
    expect(helper).toBeTruthy();
    expect(helper?.textContent).toContain('Sualınız var? Bura yazın.');
  });

  it('stays in intro phase for center hold then completes intro transition', () => {
    const { container } = render(<CustomerChatWidget user={null} onOpenAccount={vi.fn()} />);
    const widget = container.querySelector('.customer-chat-widget');

    // At 1.5s, intro is still active (center hold)
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(widget?.classList.contains('is-intro')).toBe(true);

    // After glide completes (> 2.7s), is-intro is removed
    act(() => {
      vi.advanceTimersByTime(1300);
    });
    expect(widget?.classList.contains('is-intro')).toBe(false);
  });

  it('plays helper leaving animation over 1.5s and cleanly dismisses text at bottom right', () => {
    const { container } = render(<CustomerChatWidget user={null} onOpenAccount={vi.fn()} />);
    const helper = container.querySelector('.customer-chat-helper');
    expect(helper).toBeTruthy();
    expect(helper?.classList.contains('is-leaving')).toBe(false);

    // At 2.7s, helper begins 1.5s leaving animation
    act(() => {
      vi.advanceTimersByTime(2750);
    });
    const leavingHelper = container.querySelector('.customer-chat-helper');
    expect(leavingHelper?.classList.contains('is-leaving')).toBe(true);

    // Mid-animation at 3.5s, helper is still in DOM animating out
    act(() => {
      vi.advanceTimersByTime(750);
    });
    expect(container.querySelector('.customer-chat-helper')).toBeTruthy();

    // At 4.3s (full 1.5s animation finished), helper is completely unmounted
    act(() => {
      vi.advanceTimersByTime(900);
    });
    expect(container.querySelector('.customer-chat-helper')).toBeNull();
    expect(container.querySelector('.customer-chat-trigger')).toBeTruthy();
  });
});
