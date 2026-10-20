/**
 * Phase 1 stores booking *requests* (quotes pending approval).
 * These entities are the intended shape for Phase 4 operations:
 *
 * Customer, Property, CleaningPlan, Subscription, Booking,
 * ScheduledVisit, Cleaner, CleanerAssignment, Payment, CleaningChecklist
 *
 * Billing stays on the Subscription; visits stay on ScheduledVisit.
 * Do not treat a website enquiry as a confirmed booking or a live subscription.
 */

export const ENQUIRY_TYPES = {
  BOOKING: 'booking',
  PLAN: 'plan',
  COMMERCIAL: 'commercial',
  CONTACT: 'contact',
};

export const SERVICES = {
  CARPET: 'carpet',
  REGULAR: 'regular',
  DEEP: 'deep',
  END_OF_TENANCY: 'end_of_tenancy',
};
