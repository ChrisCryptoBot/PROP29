/**
 * Help & Support API service.
 * Uses backend when available; falls back to in-memory seed data for demo/offline.
 */
import apiService from '../../../services/ApiService';
import type {
  HelpArticle,
  SupportTicket,
  ContactInfo,
  CreateTicketPayload,
  UpdateTicketPayload
} from '../types';
import { SEED_ARTICLES, SEED_TICKETS, SEED_CONTACTS } from '../constants/seedData';

const PREFIX = '/help';

export async function getArticles(): Promise<HelpArticle[]> {
  try {
    const res = await apiService.get<HelpArticle[]>(`${PREFIX}/articles`);
    if (res.data && Array.isArray(res.data)) return res.data;
  } catch {
    // Offline or /help not deployed
  }
  return SEED_ARTICLES;
}

export async function getArticle(id: string): Promise<HelpArticle | null> {
  try {
    const res = await apiService.get<HelpArticle>(`${PREFIX}/articles/${id}`);
    if (res.data) return res.data;
  } catch {
    // ignore
  }
  return SEED_ARTICLES.find((a) => a.id === id) ?? null;
}

export async function getTickets(): Promise<SupportTicket[]> {
  try {
    const res = await apiService.get<SupportTicket[]>(`${PREFIX}/tickets`);
    if (res.data && Array.isArray(res.data)) return res.data;
  } catch {
    // Offline or /help not deployed
  }
  return SEED_TICKETS;
}

export async function createTicket(payload: CreateTicketPayload): Promise<SupportTicket | null> {
  try {
    const res = await apiService.post<SupportTicket>(`${PREFIX}/tickets`, payload);
    if (res.data) return res.data;
  } catch {
    // Offline or /help not deployed
  }
  return null;
}

export async function getTicket(id: string): Promise<SupportTicket | null> {
  try {
    const res = await apiService.get<SupportTicket>(`${PREFIX}/tickets/${id}`);
    if (res.data) return res.data;
  } catch {
    // ignore
  }
  return SEED_TICKETS.find((t) => t.id === id) ?? null;
}

export async function updateTicket(id: string, payload: UpdateTicketPayload): Promise<SupportTicket | null> {
  try {
    const res = await apiService.put<SupportTicket>(`${PREFIX}/tickets/${id}`, payload);
    if (res.data) return res.data;
  } catch {
    // ignore
  }
  return null;
}

export async function getContactInfo(): Promise<ContactInfo[]> {
  try {
    const res = await apiService.get<ContactInfo[]>(`${PREFIX}/contact`);
    if (res.data && Array.isArray(res.data)) return res.data;
  } catch {
    // Offline or /help not deployed
  }
  return SEED_CONTACTS;
}

export interface ChatReply {
  reply: string;
  escalated?: boolean;
  ticket_created?: boolean;
  ticket_id?: string;
  /** Set when backend used LLM; display name for the model (e.g. "Claude 3.5 Sonnet") */
  model_display_name?: string;
}

export interface ValidateApiResponse {
  valid: boolean;
  model?: string;
  model_display_name?: string;
  error?: string;
}

export interface ChatContext {
  lastUserMessage?: string;
  lastBotReply?: string;
  sessionId?: string;
  /** If true, UI already showed the "Hi I'm your [model] Proper 2.9 AI agent" greeting (e.g. after validation); backend will not prepend it again. */
  greetingAlreadyShown?: boolean;
}

const OPENAI_KEY_STORAGE = 'help_chat_openai_api_key';
const SESSION_ID_STORAGE = 'help_chat_session_id';
const MODEL_STORAGE = 'help_chat_llm_model';
const BASE_URL_STORAGE = 'help_chat_llm_base_url';

export function getStoredOpenAIKey(): string | null {
  try {
    return localStorage.getItem(OPENAI_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function setStoredOpenAIKey(key: string | null): void {
  try {
    if (key == null || key.trim() === '') localStorage.removeItem(OPENAI_KEY_STORAGE);
    else localStorage.setItem(OPENAI_KEY_STORAGE, key.trim());
  } catch {
    // ignore
  }
}

export function getOrCreateSessionId(): string {
  try {
    let sessionId = sessionStorage.getItem(SESSION_ID_STORAGE);
    if (!sessionId) {
      // Try to get user ID from auth context if available
      // For now, generate a UUID for anonymous users
      sessionId = `anon_${crypto.randomUUID()}`;
      sessionStorage.setItem(SESSION_ID_STORAGE, sessionId);
    }
    return sessionId;
  } catch {
    // Fallback if sessionStorage not available
    return `anon_${Date.now()}`;
  }
}

export function getStoredModel(): string | null {
  try {
    return localStorage.getItem(MODEL_STORAGE);
  } catch {
    return null;
  }
}

export function setStoredModel(model: string | null): void {
  try {
    if (model == null || model.trim() === '') localStorage.removeItem(MODEL_STORAGE);
    else localStorage.setItem(MODEL_STORAGE, model.trim());
  } catch {
    // ignore
  }
}

export function getStoredBaseUrl(): string | null {
  try {
    return localStorage.getItem(BASE_URL_STORAGE);
  } catch {
    return null;
  }
}

export function setStoredBaseUrl(baseUrl: string | null): void {
  try {
    if (baseUrl == null || baseUrl.trim() === '') localStorage.removeItem(BASE_URL_STORAGE);
    else localStorage.setItem(BASE_URL_STORAGE, baseUrl.trim());
  } catch {
    // ignore
  }
}

export function clearSessionId(): void {
  try {
    sessionStorage.removeItem(SESSION_ID_STORAGE);
  } catch {
    // ignore
  }
}

/** Validate that the API key and LLM config are received and fully functional (backend performs a minimal LLM call). */
export async function validateHelpApi(): Promise<ValidateApiResponse> {
  try {
    const openaiKey = getStoredOpenAIKey();
    const model = getStoredModel();
    const baseUrl = getStoredBaseUrl();
    if (!openaiKey?.trim()) {
      return { valid: false, error: 'API key is required' };
    }
    const res = await apiService.post<ValidateApiResponse>(`${PREFIX}/validate-api`, {
      openai_api_key: openaiKey.trim(),
      ...(model ? { model } : {}),
      ...(baseUrl ? { base_url: baseUrl } : {}),
    });
    const data = res.data;
    if (data?.valid === true) {
      return {
        valid: true,
        model: data.model,
        model_display_name: data.model_display_name,
      };
    }
    return {
      valid: false,
      error: data?.error || 'API validation failed',
    };
  } catch (err: unknown) {
    const ax = err as { response?: { data?: { error?: string }; status?: number }; message?: string };
    const status = ax.response?.status;
    const errorMessage = status === 404
      ? 'Validation endpoint not found. Restart the backend server and try again.'
      : (ax.response?.data as { error?: string })?.error || ax.message || String(err);
    return { valid: false, error: errorMessage };
  }
}

export async function sendChatMessage(
  message: string,
  context?: ChatContext
): Promise<ChatReply | null> {
  try {
    const openaiKey = getStoredOpenAIKey();
    const sessionId = context?.sessionId || getOrCreateSessionId();
    const model = getStoredModel(); // Get stored model preference
    const baseUrl = getStoredBaseUrl(); // Get stored base URL preference
    
    // Debug logging
    const debugInfo = {
      hasApiKey: !!openaiKey,
      apiKeyPrefix: openaiKey ? openaiKey.substring(0, 15) + '...' : 'none',
      apiKeyLength: openaiKey ? openaiKey.length : 0,
      model: model || 'none',
      baseUrl: baseUrl || 'none',
      sessionId
    };
    console.log('[Help Chat] Sending message:', JSON.stringify(debugInfo, null, 2));
    
    const res = await apiService.post<ChatReply>(`${PREFIX}/chat`, {
      message,
      last_user_message: context?.lastUserMessage,
      last_bot_reply: context?.lastBotReply,
      session_id: sessionId,
      ...(openaiKey ? { openai_api_key: openaiKey } : {}),
      ...(model ? { model } : {}), // Include model if set
      ...(baseUrl ? { base_url: baseUrl } : {}), // Include base_url if set
      ...(context?.greetingAlreadyShown === true ? { greeting_already_shown: true } : {})
    });
    if (res.data?.reply != null) return res.data;
    } catch (err: unknown) {
    const ax = err as { response?: { status?: number; data?: { detail?: string | Array<{ msg?: string; loc?: unknown[] }> } }; message?: string };
    const status = ax.response?.status;
    const detail = ax.response?.data?.detail;
    const errorMessage = ax.message || String(err);
    
    // Log detailed error for debugging
    console.error('[Help Chat] API Error:', {
      status,
      detail,
      errorMessage,
      fullError: err,
      responseData: ax.response?.data
    });
    
    if (status === 400 && detail) return { reply: typeof detail === 'string' ? detail : String(detail) };
    // FastAPI validation (e.g. message too long) returns 422 with detail array
    if (status === 422 && detail) {
      const msg = Array.isArray(detail)
        ? detail.map((d: { msg?: string }) => d?.msg).filter(Boolean).join('. ') || 'Your message could not be sent. Check length (max 2000 characters) and try again.'
        : String(detail);
      return { reply: msg || 'Your message could not be sent. Maximum length is 2000 characters.' };
    }
    if (status === 429) return { reply: (typeof detail === 'string' ? detail : null) || 'Too many messages. Please wait a minute before sending more.' };
    if (status === 500) {
      console.error('[Help Chat] Backend server error - check backend console for details');
      // Don't return error message to user, let fallback handle it
    }
    // Offline or /help not deployed: return null so caller uses fallback
  }
  return null;
}
