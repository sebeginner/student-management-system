export const designTokens = {
  color: {
    primary: '#2563eb',
    primaryDark: '#1d4ed8',
    primarySoft: '#eff6ff',
    educationGreen: '#15803d',
    educationGreenSoft: '#f0fdf4',
    managerPurple: '#4f46e5',
    managerPurpleSoft: '#eef2ff',
    background: '#f8fafc',
    surface: '#ffffff',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    text: '#0f172a',
    textMuted: '#64748b',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626',
    info: '#2563eb',
  },
  radius: {
    control: '6px',
    card: '8px',
    modal: '8px',
  },
  shadow: {
    card: '0 1px 2px rgb(15 23 42 / 0.08)',
    floating: '0 12px 30px rgb(15 23 42 / 0.14)',
  },
  table: {
    headerBackground: '#f8fafc',
    rowBorder: '#e2e8f0',
    rowHover: '#f8fafc',
  },
  badge: {
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    inactive: 'bg-slate-100 text-slate-700 border-slate-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    locked: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    rejected: 'bg-red-50 text-red-700 border-red-200',
  },
} as const;

export type DesignTokens = typeof designTokens;
