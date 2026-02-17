// Historical Country Tags
export const TAGS = [
  'QII', // Qi
  'CHU', // Chu
  'JIN', // Jin
  'QIN', // Qin
  'YAN', // Yan
  'ZHA', // Zhao
  'WEI', // Wei
  'HAN', // Han
  'YUE', // Yue
  'SON', // Song
  'LUU', // Lu
  'ZHO', // Zhou
  'BAA', // Ba
  'SHU', // Shu
  'WUU', // Wu
  'CAI', // Cai
  'CHE', // Chen
  'ZHE', // Zheng
] as const

export type CountryTag = typeof TAGS[number]

export const COUNTRY_NAMES: Record<CountryTag, string> = {
  QII: 'State of Qi',
  CHU: 'State of Chu',
  JIN: 'State of Jin',
  QIN: 'State of Qin',
  YAN: 'State of Yan',
  ZHA: 'State of Zhao',
  WEI: 'State of Wei',
  HAN: 'State of Han',
  YUE: 'State of Yue',
  SON: 'State of Song',
  LUU: 'State of Lu',
  ZHO: 'State of Zhou',
  BAA: 'State of Ba',
  SHU: 'State of Shu',
  WUU: 'State of Wu',
  CAI: 'State of Cai',
  CHE: 'State of Chen',
  ZHE: 'State of Zheng',
}

export const COUNTRY_COLORS: Record<CountryTag, string> = {
  QII: '#ef4444', // red
  CHU: '#22c55e', // green
  JIN: '#3b82f6', // blue
  QIN: '#1f2937', // dark grey/black
  YAN: '#f59e0b', // amber
  ZHA: '#8b5cf6', // purple
  WEI: '#ec4899', // pink
  HAN: '#14b8a6', // teal
  YUE: '#84cc16', // lime
  SON: '#a855f7',
  LUU: '#6366f1',
  ZHO: '#fbbf24', // gold
  BAA: '#78716c',
  SHU: '#10b981',
  WUU: '#06b6d4',
  CAI: '#d946ef',
  CHE: '#f43f5e',
  ZHE: '#64748b',
}
