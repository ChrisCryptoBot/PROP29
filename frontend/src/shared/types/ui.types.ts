export interface Theme {
  mode: 'light' | 'dark' | 'auto';
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  breakpoints: Breakpoints;
  shadows: Shadows;
  borders: Borders;
}

export interface ColorPalette {
  primary: ColorScale;
  secondary: ColorScale;
  success: ColorScale;
  warning: ColorScale;
  error: ColorScale;
  info: ColorScale;
  gray: ColorScale;
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
  };
  border: {
    primary: string;
    secondary: string;
    focus: string;
  };
}

export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export interface Typography {
  fontFamily: {
    sans: string;
    mono: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface Spacing {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
}

export interface Breakpoints {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

export interface Shadows {
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
}

export interface Borders {
  radius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    full: string;
  };
  width: {
    0: string;
    1: string;
    2: string;
    4: string;
    8: string;
  };
}

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  progress?: number;
}

export interface TableColumn<T = any> {
  key: string;
  title: string;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  fixed?: 'left' | 'right';
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: boolean;
  rowSelection?: boolean;
  expandable?: boolean;
  onRowClick?: (record: T, index: number) => void;
} 