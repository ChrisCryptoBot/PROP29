/**
 * Help & Support state and data loading.
 * Loads articles, tickets, contact from service (API + fallback); manages modals and form state.
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  getArticles,
  getTickets,
  getContactInfo,
  createTicket as createTicketApi,
  updateTicket as updateTicketApi
} from '../services/helpSupportService';
import type {
  HelpArticle,
  SupportTicket,
  ContactInfo,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  CreateTicketPayload,
  UpdateTicketPayload
} from '../types';

function generateLocalTicketId(): string {
  return 'TICKET-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

export function useHelpSupportState() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [helpArticles, setHelpArticles] = useState<HelpArticle[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [contactInfo, setContactInfo] = useState<ContactInfo[]>([]);

  const [newTicketForm, setNewTicketForm] = useState<CreateTicketPayload>({
    title: '',
    description: '',
    priority: 'medium',
    category: 'technical'
  });
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketDetailModal, setShowTicketDetailModal] = useState(false);
  const [ticketEditMode, setTicketEditMode] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [showArticleDetailModal, setShowArticleDetailModal] = useState(false);
  const [articleHelpfulCount, setArticleHelpfulCount] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const showSuccess = useCallback((message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 5000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [articles, tickets, contacts] = await Promise.all([
        getArticles(),
        getTickets(),
        getContactInfo()
      ]);
      setHelpArticles(articles);
      setSupportTickets(tickets);
      setContactInfo(contacts);
    } catch (e) {
      showError('Failed to load help and support data.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openNewTicketModal = useCallback(() => setShowNewTicketModal(true), []);
  const closeNewTicketModal = useCallback(() => {
    setShowNewTicketModal(false);
    setNewTicketForm({ title: '', description: '', priority: 'medium', category: 'technical' });
  }, []);

  const createTicket = useCallback(
    async (payload: CreateTicketPayload) => {
      if (!payload.title?.trim() || !payload.description?.trim()) {
        showError('Title and description are required.');
        return false;
      }
      const created = await createTicketApi(payload);
      if (created) {
        setSupportTickets((prev) => [created, ...prev]);
        closeNewTicketModal();
        showSuccess('Support ticket created successfully.');
        return true;
      }
      const now = new Date().toISOString();
      const local: SupportTicket = {
        id: generateLocalTicketId(),
        title: payload.title,
        description: payload.description,
        status: 'open',
        priority: payload.priority,
        category: payload.category,
        createdAt: now,
        updatedAt: now
      };
      setSupportTickets((prev) => [local, ...prev]);
      closeNewTicketModal();
      showSuccess('Support ticket created (saved locally).');
      return true;
    },
    [closeNewTicketModal, showError, showSuccess]
  );

  const openTicketDetail = useCallback((ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setTicketEditMode(false);
    setShowTicketDetailModal(true);
  }, []);

  const closeTicketDetail = useCallback(() => {
    setShowTicketDetailModal(false);
    setSelectedTicket(null);
    setTicketEditMode(false);
  }, []);

  const updateTicket = useCallback(
    async (id: string, payload: UpdateTicketPayload) => {
      const updated = await updateTicketApi(id, payload);
      if (updated) {
        setSupportTickets((prev) => prev.map((t) => (t.id === id ? updated : t)));
        setSelectedTicket(updated);
        showSuccess('Ticket updated.');
        return true;
      }
      setSupportTickets((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;
          return {
            ...t,
            ...payload,
            updatedAt: new Date().toISOString()
          };
        })
      );
      const next = { ...selectedTicket!, ...payload, id, updatedAt: new Date().toISOString() } as SupportTicket;
      setSelectedTicket(next);
      showSuccess('Ticket updated (saved locally).');
      return true;
    },
    [selectedTicket, showSuccess]
  );

  const openArticleDetail = useCallback((article: HelpArticle) => {
    setSelectedArticle(article);
    setShowArticleDetailModal(true);
  }, []);

  const closeArticleDetail = useCallback(() => {
    setShowArticleDetailModal(false);
    setSelectedArticle(null);
  }, []);

  const markArticleHelpful = useCallback((articleId: string, helpful: boolean) => {
    setArticleHelpfulCount((prev) => ({
      ...prev,
      [articleId]: (prev[articleId] ?? 0) + (helpful ? 1 : 0)
    }));
  }, []);

  const filteredArticles = useMemo(() => {
    return helpArticles.filter((article) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.content.toLowerCase().includes(q) ||
        article.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [helpArticles, searchQuery, selectedCategory]);

  return {
    loading,
    error,
    success,
    helpArticles,
    supportTickets,
    contactInfo,
    setSupportTickets,
    newTicketForm,
    setNewTicketForm,
    showNewTicketModal,
    openNewTicketModal,
    closeNewTicketModal,
    createTicket,
    selectedTicket,
    showTicketDetailModal,
    openTicketDetail,
    closeTicketDetail,
    ticketEditMode,
    setTicketEditMode,
    updateTicket,
    selectedArticle,
    showArticleDetailModal,
    openArticleDetail,
    closeArticleDetail,
    articleHelpfulCount,
    markArticleHelpful,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    filteredArticles,
    showError,
    showSuccess,
    loadData
  };
}
