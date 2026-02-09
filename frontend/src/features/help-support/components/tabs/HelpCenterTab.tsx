import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { getCategoryDisplayName, getCategoryBadgeVariant } from '../../utils/helpSupportHelpers';
import type { HelpArticle } from '../../types';

interface HelpCenterTabProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  filteredArticles: HelpArticle[];
  openArticleDetail: (article: HelpArticle) => void;
}

const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'getting_started', label: 'Getting Started' },
  { value: 'incident_management', label: 'Incident Management' },
  { value: 'user_management', label: 'User Management' },
  { value: 'system_settings', label: 'System Settings' },
  { value: 'mobile_app', label: 'Mobile App' },
  { value: 'troubleshooting', label: 'Troubleshooting' }
];

export const HelpCenterTab: React.FC<HelpCenterTabProps> = ({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  filteredArticles,
  openArticleDetail
}) => {
  return (
    <div className="space-y-6" role="main" aria-label="Help Center">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Help Center</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Search and browse help articles
          </p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
              <i className="fas fa-search text-white" />
            </div>
            <span className="card-title-text">Search Help</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search help articles..."
              />
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-md bg-white/5 border border-white/5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by category"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                <i className="fas fa-times mr-2" aria-hidden />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {filteredArticles.length === 0 ? (
          <EmptyState
            icon="fas fa-search"
            title="No articles found"
            description="Try adjusting your search terms or category filter."
          />
        ) : (
          filteredArticles.map((article) => (
            <Card key={article.id} className="bg-slate-900/50 border border-white/5">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-white mb-2">{article.title}</h3>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{article.content}</p>
                    <div className="flex items-center gap-4 text-[10px] text-slate-500">
                      <span>
                        <i className="fas fa-eye mr-1" aria-hidden />
                        {article.views} views
                      </span>
                      <span>
                        <i className="fas fa-thumbs-up mr-1" aria-hidden />
                        {article.helpful} helpful
                      </span>
                      <span>
                        <i className="fas fa-calendar mr-1" aria-hidden />
                        Updated {new Date(article.lastUpdated).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge variant={getCategoryBadgeVariant(article.category)}>
                      {getCategoryDisplayName(article.category)}
                    </Badge>
                    <Button size="sm" onClick={() => openArticleDetail(article)}>
                      <i className="fas fa-external-link-alt mr-1" aria-hidden />
                      Read More
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.tags.map((tag) => (
                    <span key={tag} className="px-2 py-1 bg-white/5 text-slate-400 text-xs rounded border border-white/5">
                      #{tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
