import type { DisplayStatus } from './calc';

export const colors = {
  bg: '#F4F6FA',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#64748B',
  faint: '#94A3B8',
  border: '#E2E8F0',
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primarySoft: '#EAF1FF',
  success: '#059669',
  successSoft: '#E7F8F1',
  warning: '#D97706',
  warningSoft: '#FEF5E7',
  danger: '#DC2626',
  dangerSoft: '#FDECEC',
  gold: '#F59E0B',
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 22 };

export const ACCENTS = ['#2563EB', '#0F766E', '#7C3AED', '#DB2777', '#EA580C', '#0F172A', '#15803D', '#B45309'];

export const statusStyle: Record<DisplayStatus, { label: string; fg: string; bg: string }> = {
  draft: { label: 'Draft', fg: colors.muted, bg: '#EEF1F5' },
  sent: { label: 'Sent', fg: colors.primary, bg: colors.primarySoft },
  paid: { label: 'Paid', fg: colors.success, bg: colors.successSoft },
  overdue: { label: 'Overdue', fg: colors.danger, bg: colors.dangerSoft },
  accepted: { label: 'Accepted', fg: colors.success, bg: colors.successSoft },
  declined: { label: 'Declined', fg: colors.danger, bg: colors.dangerSoft },
  expired: { label: 'Expired', fg: colors.warning, bg: colors.warningSoft },
};
