import { PublicationStatus, ContentCompletenessReport } from '../types/contracts';

/**
 * Sahara Electronics — Publication State Machine
 * Strictly governs catalog lifecycle transitions:
 * draft → in_review → approved → scheduled → published → archived
 *              ↘ rejected → draft
 */

export const ALLOWED_TRANSITIONS: Record<PublicationStatus, PublicationStatus[]> = {
  draft: ['in_review', 'archived'],
  in_review: ['approved', 'rejected', 'draft'],
  rejected: ['draft'],
  approved: ['scheduled', 'published', 'draft', 'archived'],
  scheduled: ['published', 'draft', 'approved', 'archived'],
  published: ['draft', 'archived'],
  archived: ['draft'],
};

export function canTransition(
  currentStatus: PublicationStatus,
  targetStatus: PublicationStatus
): { allowed: boolean; reason?: string } {
  if (currentStatus === targetStatus) {
    return { allowed: true };
  }

  const allowedTargets = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowedTargets.includes(targetStatus)) {
    return {
      allowed: false,
      reason: `'${currentStatus}' statusundan '${targetStatus}' statusuna birbaşa keçid qadağandır.`,
    };
  }

  return { allowed: true };
}

export function validatePublicationGate(
  targetStatus: PublicationStatus,
  completeness: ContentCompletenessReport
): { canProceed: boolean; error?: string } {
  if (targetStatus === 'published' || targetStatus === 'scheduled') {
    if (!completeness.isPublishable) {
      return {
        canProceed: false,
        error: `Məhsul nəşr edilə bilməz: məzmun tamlığı (${completeness.score}%) tələb olunan minimum 80% həddindən aşağıdır və ya məcburi sahələr çatışmır: ${completeness.missingFields.join(', ')}`,
      };
    }
  }
  return { canProceed: true };
}
