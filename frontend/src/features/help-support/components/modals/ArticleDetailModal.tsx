import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { getCategoryDisplayName } from '../../utils/helpSupportHelpers';
import type { HelpArticle } from '../../types';

interface ArticleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: HelpArticle | null;
  helpfulCountDelta: number;
  onMarkHelpful: (articleId: string, helpful: boolean) => void;
}

const INCIDENT_ARTICLE_ID = '2';
const ACCESS_ARTICLE_ID = '3';

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  isOpen,
  onClose,
  article,
  helpfulCountDelta,
  onMarkHelpful
}) => {
  const navigate = useNavigate();

  if (!article) return null;

  const displayHelpful = article.helpful + helpfulCountDelta;
  const goToIncidentLog = () => {
    onClose();
    navigate('/modules/event-log');
  };
  const goToAccessControl = () => {
    onClose();
    navigate('/modules/access-control');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={article.title}
      size="lg"
      footer={
        <>
          <div className="flex items-center gap-2 mr-auto text-slate-400 text-sm">
            <span>Was this helpful?</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkHelpful(article.id, true)}
            >
              <i className="fas fa-thumbs-up mr-1" aria-hidden />
              Yes
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMarkHelpful(article.id, false)}
            >
              <i className="fas fa-thumbs-down mr-1" aria-hidden />
              No
            </Button>
            <span className="text-white font-mono">{displayHelpful}</span>
          </div>
          {article.id === INCIDENT_ARTICLE_ID && (
            <Button variant="outline" onClick={goToIncidentLog}>
              Open Incident Log
            </Button>
          )}
          {article.id === ACCESS_ARTICLE_ID && (
            <Button variant="outline" onClick={goToAccessControl}>
              Open Access Control
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-[10px] text-slate-500">
          <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5">
            {getCategoryDisplayName(article.category)}
          </span>
          <span>{article.views} views</span>
          <span>Updated {new Date(article.lastUpdated).toLocaleDateString()}</span>
        </div>
        <div className="prose prose-invert max-w-none">
          <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{article.content}</p>
        </div>
        {article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
            {article.tags.map((tag) => (
              <span key={tag} className="px-2 py-1 bg-white/5 text-slate-400 text-xs rounded border border-white/5">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
