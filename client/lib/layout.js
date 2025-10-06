export const GUTTER = 12;
export const PADDING = 12;

export const BREAKPOINTS = {
  sm: 360,   // very small phones viewport
  md: 600,   // phones in landscape viewport
  lg: 900,   // tablets viewport
  xl: 1280,  // wide desktop viewport
};

export function getNumColumns(width) {
  if (width < BREAKPOINTS.sm) return 1;
  if (width < BREAKPOINTS.md) return 2;
  if (width < BREAKPOINTS.lg) return 3;
  if (width < BREAKPOINTS.xl) return 4;
  return 5;
}

export function computeCardWidth(totalWidth, numColumns) {
  const available = totalWidth - PADDING * 2 - GUTTER * (numColumns - 1);
  return Math.floor(available / numColumns);
}
