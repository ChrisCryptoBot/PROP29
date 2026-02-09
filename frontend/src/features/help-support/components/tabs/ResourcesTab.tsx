import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { RESOURCE_URLS } from '../../constants/resourceUrls';

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string;
  isDownload?: boolean;
  isExternal?: boolean;
}

const DOWNLOADS: ResourceItem[] = [
  {
    id: 'manual',
    title: 'User Manual',
    description: 'Complete system documentation',
    url: RESOURCE_URLS.userManual,
    icon: 'fas fa-download',
    isDownload: true
  },
  {
    id: 'mobile-ios',
    title: 'Mobile App (iOS)',
    description: 'Download from App Store',
    url: RESOURCE_URLS.mobileAppIos,
    icon: 'fas fa-apple-alt',
    isExternal: true
  },
  {
    id: 'mobile-android',
    title: 'Mobile App (Android)',
    description: 'Download from Google Play',
    url: RESOURCE_URLS.mobileAppAndroid,
    icon: 'fas fa-android',
    isExternal: true
  },
  {
    id: 'api-docs',
    title: 'API Documentation',
    description: 'Developer integration guide',
    url: RESOURCE_URLS.apiDocs,
    icon: 'fas fa-code',
    isExternal: true
  }
];

const VIDEOS: ResourceItem[] = [
  {
    id: 'video-getting-started',
    title: 'Getting Started',
    description: '5-minute overview video',
    url: RESOURCE_URLS.videoGettingStarted,
    icon: 'fas fa-play',
    isExternal: true
  },
  {
    id: 'video-incident',
    title: 'Incident Management',
    description: 'How to report and manage incidents',
    url: RESOURCE_URLS.videoIncidentManagement,
    icon: 'fas fa-play',
    isExternal: true
  },
  {
    id: 'video-mobile',
    title: 'Mobile App Training',
    description: 'Patrol agent mobile app guide',
    url: RESOURCE_URLS.videoMobileApp,
    icon: 'fas fa-play',
    isExternal: true
  }
];

function ResourceLinkButton({ item }: { item: ResourceItem }) {
  const className =
    'inline-flex items-center justify-center h-8 px-3 text-xs rounded-md font-medium border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors';
  if (item.isDownload) {
    return (
      <a href={item.url} download className={className}>
        <i className={`${item.icon} mr-1`} aria-hidden />
        Download
      </a>
    );
  }
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <i className={`${item.icon} mr-1`} aria-hidden />
      {item.id.startsWith('video') ? 'Watch' : item.id.startsWith('mobile') ? 'Download' : 'View'}
    </a>
  );
}

export const ResourcesTab: React.FC = () => {
  return (
    <div className="space-y-6" role="main" aria-label="Resources">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Resources</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            User manual, mobile app, API docs, and training videos
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border border-white/5">
          <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
            <CardTitle className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
                <i className="fas fa-download text-white" />
              </div>
              <span className="card-title-text">Downloads</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            {DOWNLOADS.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]"
              >
                <div className="min-w-0">
                  <h4 className="font-semibold text-white">{item.title}</h4>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
                <ResourceLinkButton item={item} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border border-white/5">
          <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
            <CardTitle className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
                <i className="fas fa-video text-white" />
              </div>
              <span className="card-title-text">Training Videos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            {VIDEOS.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]"
              >
                <div className="min-w-0">
                  <h4 className="font-semibold text-white">{item.title}</h4>
                  <p className="text-sm text-slate-400">{item.description}</p>
                </div>
                <ResourceLinkButton item={item} />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
