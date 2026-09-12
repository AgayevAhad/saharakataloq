import { describe, it, expect } from 'vitest';
import { canTransition, validatePublicationGate } from '../utils/publicationStateMachine';
import { ContentCompletenessReport } from '../types/contracts';

describe('PIM v2 Publication State Machine', () => {
  it('allows standard lifecycle transitions', () => {
    expect(canTransition('draft', 'in_review').allowed).toBe(true);
    expect(canTransition('in_review', 'approved').allowed).toBe(true);
    expect(canTransition('in_review', 'rejected').allowed).toBe(true);
    expect(canTransition('rejected', 'draft').allowed).toBe(true);
    expect(canTransition('approved', 'scheduled').allowed).toBe(true);
    expect(canTransition('approved', 'published').allowed).toBe(true);
    expect(canTransition('scheduled', 'published').allowed).toBe(true);
    expect(canTransition('published', 'archived').allowed).toBe(true);
  });

  it('strictly blocks illegal transitions', () => {
    expect(canTransition('draft', 'published').allowed).toBe(false);
    expect(canTransition('rejected', 'published').allowed).toBe(false);
    expect(canTransition('in_review', 'published').allowed).toBe(false);
    expect(canTransition('archived', 'published').allowed).toBe(false);
  });

  it('enforces completeness gate on publication', () => {
    const invalidReport: ContentCompletenessReport = {
      score: 60,
      isPublishable: false,
      missingFields: ['Brend', 'Şəkil'],
      recommendations: [],
    };

    const validReport: ContentCompletenessReport = {
      score: 90,
      isPublishable: true,
      missingFields: [],
      recommendations: [],
    };

    expect(validatePublicationGate('published', invalidReport).canProceed).toBe(false);
    expect(validatePublicationGate('scheduled', invalidReport).canProceed).toBe(false);
    expect(validatePublicationGate('draft', invalidReport).canProceed).toBe(true);
    expect(validatePublicationGate('published', validReport).canProceed).toBe(true);
  });
});
