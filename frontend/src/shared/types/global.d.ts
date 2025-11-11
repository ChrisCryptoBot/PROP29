// Global Type Declarations for PROPER 2.9
// This file contains ambient module declarations for assets and CSS modules

// CSS/SCSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}

// Image assets
declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}

declare module '*.gif' {
  const content: string;
  export default content;
}

declare module '*.webp' {
  const content: string;
  export default content;
}

// Global type augmentations
declare global {
  interface Window {
    __PROPER_29_DEV__?: boolean;
    __PERFORMANCE_MONITOR__?: any;
    __MODULE_REGISTRY__?: any;
    __EVENT_BUS__?: any;
  }

  // Environment variables
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_API_BASE_URL: string;
      REACT_APP_ENV: 'development' | 'staging' | 'production';
      REACT_APP_VERSION: string;
      REACT_APP_BUILD_TIME: string;
      REACT_APP_SENTRY_DSN?: string;
      REACT_APP_ANALYTICS_ID?: string;
    }
  }
}

export {};

