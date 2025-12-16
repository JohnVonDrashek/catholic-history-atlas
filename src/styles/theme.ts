/**
 * Theme constants for consistent styling across the application
 */

/**
 * Color palette
 */
export const colors = {
  // Background colors
  darkBg: '#1a1a1a',
  darkBg2: '#2a2a2a',
  darkBorder: '#333',

  // Text colors
  white: '#fff',
  lightGray: '#ddd',
  gray: '#aaa',
  mediumGray: '#666',

  // Brand colors
  blue: '#4a9eff',
  gold: '#d4af37',
  darkGold: '#b8941f',

  // Status colors
  red: '#b91c1c',
  darkRed: '#8b0000',
  lightRed: '#ff6b6b',
  green: '#2ecc71',
  darkGreen: '#58d68d',
  orange: '#ff6b35',
  lightOrange: '#ff8c5a',
  purple: '#9b59b6',
  lightPurple: '#bb7dd9',
  steelGray: '#708090',
  lightSteelGray: '#8fa0b0',
  skyBlue: '#87CEEB',
  lightSkyBlue: '#B0E0E6',

  // Basilica colors
  basilicaPurple: '#8B4CBF',
  basilicaPurpleDark: '#6B2A9F',
  basilicaGold: '#D4AF37',
  basilicaGoldDark: '#B8941F',
  basilicaBlue: '#4A90E2',
  basilicaBlueDark: '#2E6BB8',
  basilicaBronze: '#CD7F32',
  basilicaBronzeDark: '#A06628',
} as const;

/**
 * Spacing scale (using rem units for accessibility)
 */
export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
} as const;

/**
 * Font sizes
 */
export const fontSize = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
  '5xl': '3rem', // 48px
} as const;

/**
 * Border radius
 */
export const borderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

/**
 * Box shadows
 */
export const boxShadow = {
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px rgba(0, 0, 0, 0.1)',
} as const;

/**
 * Z-index layers
 */
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
} as const;
