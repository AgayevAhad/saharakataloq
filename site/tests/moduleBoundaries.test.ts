import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

function getAllSourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== 'build') {
        files.push(...getAllSourceFiles(fullPath));
      }
    } else if (/\.(ts|tsx|js|mjs)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

export function checkModuleBoundaryViolations(
  filePath: string,
  content: string,
  layer: 'domain' | 'application' | 'infrastructure' | 'ui'
): string[] {
  const violations: string[] = [];
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Check import or require statements
    const match = line.match(/(?:import|require)\s*(?:[\w\s{},*]+from\s*)?['"]([^'"]+)['"]/);
    if (!match) return;

    const importPath = match[1];

    if (layer === 'domain') {
      // Domain (types, schemas) MUST NOT import from components, pages, services, or backend
      if (
        importPath.includes('/components/') ||
        importPath.includes('/pages/') ||
        importPath.includes('/services/') ||
        importPath.includes('/backend/') ||
        importPath.includes('/stories/')
      ) {
        violations.push(
          `[Domain Violation] Line ${idx + 1}: ${filePath} illegally imports UI/Service: "${importPath}"`
        );
      }
    } else if (layer === 'application') {
      // Application (services, utils, hooks) MUST NOT import from presentation (components, pages) or backend
      if (
        importPath.includes('/components/') ||
        importPath.includes('/pages/') ||
        importPath.includes('/stories/') ||
        importPath.includes('/backend/')
      ) {
        violations.push(
          `[Application Violation] Line ${idx + 1}: ${filePath} illegally imports UI/Backend: "${importPath}"`
        );
      }
    } else if (layer === 'infrastructure') {
      // Infrastructure / Backend MUST NOT import from frontend components or React
      if (
        importPath.includes('/components/') ||
        importPath.includes('/pages/') ||
        importPath === 'react' ||
        importPath === 'react-dom'
      ) {
        violations.push(
          `[Infrastructure Violation] Line ${idx + 1}: ${filePath} illegally imports Frontend/React: "${importPath}"`
        );
      }
    } else if (layer === 'ui') {
      // UI MUST NOT directly import backend node database files
      if (
        importPath.includes('/backend/catalogDatabase') ||
        importPath.includes('better-sqlite3')
      ) {
        violations.push(
          `[UI Violation] Line ${idx + 1}: ${filePath} illegally imports server database directly: "${importPath}"`
        );
      }
    }
  });

  return violations;
}

describe('Recursive Module Boundaries & Layer Architectural Integrity', () => {
  const siteRoot = path.resolve(__dirname, '..');
  const srcDir = path.join(siteRoot, 'src');

  describe('1. Domain Layer (src/types)', () => {
    it('ensures all recursive domain files have zero forbidden imports', () => {
      const domainFiles = getAllSourceFiles(path.join(srcDir, 'types'));
      expect(domainFiles.length).toBeGreaterThan(0);

      const allViolations: string[] = [];
      for (const file of domainFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const violations = checkModuleBoundaryViolations(file, content, 'domain');
        allViolations.push(...violations);
      }
      expect(allViolations).toEqual([]);
    });

    it('intentional failure test: correctly flags forbidden UI/Service imports in domain fixture', () => {
      const fixture = `
        import { Button } from '../components/ui/Button';
        import { apiClient } from '../services/apiClient';
        export interface TestModel { id: string; }
      `;
      const violations = checkModuleBoundaryViolations('fake/types/test.ts', fixture, 'domain');
      expect(violations.length).toBe(2);
      expect(violations[0]).toContain('[Domain Violation]');
    });
  });

  describe('2. Application Layer (src/services, src/utils, src/hooks)', () => {
    it('ensures all recursive application files have zero UI/Backend imports', () => {
      const appFiles = [
        ...getAllSourceFiles(path.join(srcDir, 'services')),
        ...getAllSourceFiles(path.join(srcDir, 'utils')),
        ...getAllSourceFiles(path.join(srcDir, 'hooks')),
      ];
      expect(appFiles.length).toBeGreaterThan(0);

      const allViolations: string[] = [];
      for (const file of appFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const violations = checkModuleBoundaryViolations(file, content, 'application');
        allViolations.push(...violations);
      }
      expect(allViolations).toEqual([]);
    });

    it('intentional failure test: correctly flags forbidden UI component import in application fixture', () => {
      const fixture = `
        import { Modal } from '../components/ui/Modal';
        export function computeTotal() { return 42; }
      `;
      const violations = checkModuleBoundaryViolations(
        'fake/utils/math.ts',
        fixture,
        'application'
      );
      expect(violations.length).toBe(1);
      expect(violations[0]).toContain('[Application Violation]');
    });
  });

  describe('3. Infrastructure Layer (site/backend, site/server.mjs)', () => {
    it('ensures backend infrastructure files do not import UI or React', () => {
      const infraFiles = [
        ...getAllSourceFiles(path.join(siteRoot, 'backend')),
        path.join(siteRoot, 'server.mjs'),
      ].filter((f) => fs.existsSync(f));

      const allViolations: string[] = [];
      for (const file of infraFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const violations = checkModuleBoundaryViolations(file, content, 'infrastructure');
        allViolations.push(...violations);
      }
      expect(allViolations).toEqual([]);
    });

    it('intentional failure test: correctly flags React/UI imports in backend infrastructure fixture', () => {
      const fixture = `
        import React from 'react';
        import { Header } from '../src/components/Header';
      `;
      const violations = checkModuleBoundaryViolations(
        'fake/backend/db.mjs',
        fixture,
        'infrastructure'
      );
      expect(violations.length).toBe(2);
      expect(violations[0]).toContain('[Infrastructure Violation]');
    });
  });

  describe('4. Presentation & UI Layer (src/components, src/pages)', () => {
    it('ensures all recursive UI components do not directly import server SQLite databases', () => {
      const uiFiles = [
        ...getAllSourceFiles(path.join(srcDir, 'components')),
        ...getAllSourceFiles(path.join(srcDir, 'pages')),
      ];
      expect(uiFiles.length).toBeGreaterThan(0);

      const allViolations: string[] = [];
      for (const file of uiFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const violations = checkModuleBoundaryViolations(file, content, 'ui');
        allViolations.push(...violations);
      }
      expect(allViolations).toEqual([]);
    });

    it('intentional failure test: correctly flags direct server database access in UI component fixture', () => {
      const fixture = `
        import { openDatabase } from '../../backend/catalogDatabase.mjs';
        export const MyComponent = () => null;
      `;
      const violations = checkModuleBoundaryViolations('fake/components/Widget.tsx', fixture, 'ui');
      expect(violations.length).toBe(1);
      expect(violations[0]).toContain('[UI Violation]');
    });
  });
});
