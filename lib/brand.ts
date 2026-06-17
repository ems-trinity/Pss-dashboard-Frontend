export const BRAND = {
  blue:    '#2563EB',
  blueDk:  '#1D4ED8',
  blueL:   '#EFF6FF',
  green:   '#16A34A',
  yellow:  '#D97706',
  red:     '#DC2626',
  text:    '#111827',
  textSec: '#6B7280',
  textMut: '#9CA3AF',
  border:  '#E5E7EB',
  bgPage:  '#F9FAFB',
  bgCard:  '#FFFFFF',
} as const;

export const STATUS = {
  normal:   { color: '#16A34A', bg: '#DCFCE7', label: 'Normal'   },
  warning:  { color: '#D97706', bg: '#FEF3C7', label: 'Warning'  },
  critical: { color: '#DC2626', bg: '#FEE2E2', label: 'Critical' },
  offline:  { color: '#9CA3AF', bg: '#F3F4F6', label: 'Offline'  },
} as const;

export type PssStatus = keyof typeof STATUS;
