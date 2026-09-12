import { describe, it, expect } from 'vitest';
import { DESIGN_TOKENS } from '../types/theme';

describe('Design Tokens & Z-Index Audit Suite', () => {
  it('defines structured 4px grid spacing tokens', () => {
    expect(DESIGN_TOKENS.spacing['1']).toBe('4px');
    expect(DESIGN_TOKENS.spacing['2']).toBe('8px');
    expect(DESIGN_TOKENS.spacing['4']).toBe('16px');
    expect(DESIGN_TOKENS.spacing['6']).toBe('24px');
    expect(DESIGN_TOKENS.spacing['8']).toBe('32px');
  });

  it('defines structured radius tokens from xs to 2xl and full', () => {
    expect(DESIGN_TOKENS.radii.xs).toBe('4px');
    expect(DESIGN_TOKENS.radii.md).toBe('8px');
    expect(DESIGN_TOKENS.radii.lg).toBe('12px');
    expect(DESIGN_TOKENS.radii.xl).toBe('16px');
    expect(DESIGN_TOKENS.radii.full).toBe('9999px');
  });

  it('maintains strict z-index hierarchy scale', () => {
    expect(DESIGN_TOKENS.zIndex.hide).toBe(-1);
    expect(DESIGN_TOKENS.zIndex.base).toBe(0);
    expect(DESIGN_TOKENS.zIndex.sticky).toBe(50);
    expect(DESIGN_TOKENS.zIndex.dock).toBe(60);
    expect(DESIGN_TOKENS.zIndex.overlay).toBe(100);
    expect(DESIGN_TOKENS.zIndex.modal).toBe(110);
    expect(DESIGN_TOKENS.zIndex.toast).toBe(150);
    expect(DESIGN_TOKENS.zIndex.tooltip).toBe(200);
    expect(DESIGN_TOKENS.zIndex.splash).toBe(250);

    // Verify ordering
    expect(DESIGN_TOKENS.zIndex.sticky).toBeLessThan(DESIGN_TOKENS.zIndex.overlay);
    expect(DESIGN_TOKENS.zIndex.overlay).toBeLessThan(DESIGN_TOKENS.zIndex.modal);
    expect(DESIGN_TOKENS.zIndex.modal).toBeLessThan(DESIGN_TOKENS.zIndex.toast);
    expect(DESIGN_TOKENS.zIndex.toast).toBeLessThan(DESIGN_TOKENS.zIndex.tooltip);
    expect(DESIGN_TOKENS.zIndex.tooltip).toBeLessThan(DESIGN_TOKENS.zIndex.splash);
  });

  it('defines motion duration and easing tokens', () => {
    expect(DESIGN_TOKENS.motion.durationFast).toBe('150ms');
    expect(DESIGN_TOKENS.motion.durationBase).toBe('250ms');
    expect(DESIGN_TOKENS.motion.easeStandard).toBe('cubic-bezier(0.16, 1, 0.3, 1)');
  });

  it('prohibits arbitrary hardcoded z-index > 250 across all source CSS, HTML and TSX files', () => {
    const fs = require('fs');
    const path = require('path');
    const siteRoot = path.resolve(__dirname, '../..');
    const srcDir = path.resolve(__dirname, '..');

    const checkFile = (filePath: string, fileName: string): string[] => {
      const violations: string[] = [];
      const content = fs.readFileSync(filePath, 'utf8');
      // Match z-index: \d+ or zIndex: \d+ (ignore var(--z-splash, 250) or values <= 250)
      const regex = /(?:z-index|zIndex)\s*[:=]\s*['"]?(\d+)['"]?/g;
      let match;
      while ((match = regex.exec(content)) !== null) {
        const val = parseInt(match[1], 10);
        if (val > 250) {
          violations.push(`${fileName}: found hardcoded z-index of ${val} (match: "${match[0]}")`);
        }
      }
      return violations;
    };

    const checkDir = (dir: string): string[] => {
      const violations: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (
            entry.name !== '__tests__' &&
            entry.name !== 'node_modules' &&
            entry.name !== 'dist' &&
            entry.name !== '.storybook-out'
          ) {
            violations.push(...checkDir(fullPath));
          }
        } else if (
          entry.isFile() &&
          (entry.name.endsWith('.tsx') ||
            entry.name.endsWith('.ts') ||
            entry.name.endsWith('.css') ||
            entry.name.endsWith('.html'))
        ) {
          violations.push(...checkFile(fullPath, entry.name));
        }
      }
      return violations;
    };

    const violations = checkDir(srcDir);
    // Also explicitly verify site/index.html
    const indexHtmlPath = path.join(siteRoot, 'index.html');
    if (fs.existsSync(indexHtmlPath)) {
      violations.push(...checkFile(indexHtmlPath, 'index.html'));
    }

    expect(violations).toEqual([]);
  });
});
