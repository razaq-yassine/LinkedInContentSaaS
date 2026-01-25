export const linkedinColors = {
  // Primary LinkedIn Blue
  primary: '#0A66C2',
  primaryHover: '#004182',
  primaryLight: '#378FE9',
  primaryDark: '#004182',
  
  // Background & Surface
  background: '#F3F2F0',
  surface: '#FFFFFF',
  surfaceHover: '#F9F9F9',
  
  // Text
  text: '#000000',
  textPrimary: '#000000E6', // 90% opacity
  textSecondary: '#00000099', // 60% opacity
  textTertiary: '#00000066', // 40% opacity
  
  // Borders
  border: '#E0DFDC',
  borderLight: '#EFEEEC',
  borderDark: '#CAC9C6',
  
  // Status Colors
  success: '#057642',
  successLight: '#E6F4EA',
  error: '#CC1016',
  errorLight: '#FAE9EA',
  warning: '#F5C75D',
  warningLight: '#FEF7E6',
  info: '#0A66C2',
  infoLight: '#E7F3FF',
  
  // Accent Colors
  accent: '#5E5E5E',
  accentLight: '#F0F0F0',
  
  // Shadows
  shadowSm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  shadowMd: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
  shadowLg: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
  shadowXl: '0 8px 24px 0 rgba(0, 0, 0, 0.2)',
}

export const linkedinSpacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '24px',
  '2xl': '32px',
  '3xl': '48px',
}

export const linkedinBorderRadius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
}

export const linkedinTypography = {
  fontFamily: {
    primary: '-apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Fira Sans", Ubuntu, Oxygen, "Oxygen Sans", Cantarell, "Droid Sans", "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Lucida Grande", Helvetica, Arial, sans-serif',
  },
  fontSize: {
    xs: '11px',
    sm: '12px',
    base: '14px',
    md: '14px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '32px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
}

export const linkedinTransition = {
  fast: '150ms ease',
  normal: '200ms ease',
  slow: '300ms ease',
}

// CSS Variable names for use in globals.css
export const cssVars = {
  '--linkedin-primary': linkedinColors.primary,
  '--linkedin-primary-hover': linkedinColors.primaryHover,
  '--linkedin-primary-light': linkedinColors.primaryLight,
  '--linkedin-background': linkedinColors.background,
  '--linkedin-surface': linkedinColors.surface,
  '--linkedin-text': linkedinColors.text,
  '--linkedin-text-secondary': linkedinColors.textSecondary,
  '--linkedin-border': linkedinColors.border,
  '--linkedin-success': linkedinColors.success,
  '--linkedin-error': linkedinColors.error,
}

