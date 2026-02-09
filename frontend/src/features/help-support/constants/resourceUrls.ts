/**
 * Resource URLs for Help & Support (downloads, app store, API docs, videos).
 * Override via env or backend config when available.
 */
export const RESOURCE_URLS = {
  userManual: '/docs/user-manual.pdf',
  mobileAppIos: 'https://apps.apple.com/app/proper-security/id000000000',
  mobileAppAndroid: 'https://play.google.com/store/apps/details?id=com.proper29.app',
  apiDocs: '/api-docs',
  videoGettingStarted: 'https://www.youtube.com/watch?v=example-getting-started',
  videoIncidentManagement: 'https://www.youtube.com/watch?v=example-incident',
  videoMobileApp: 'https://www.youtube.com/watch?v=example-mobile',
  liveChatUrl: '' // When available; empty = show "Coming soon"
} as const;
