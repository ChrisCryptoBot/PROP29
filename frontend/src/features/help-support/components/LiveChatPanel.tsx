/**
 * Live chat panel — narrow, bottom-right floating widget. Resizable by dragging the top-left corner to pull and expand for accessibility.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '../../../components/UI/Button';
import { sendChatMessage, validateHelpApi, getStoredOpenAIKey, setStoredOpenAIKey, getStoredModel, setStoredModel, getStoredBaseUrl, setStoredBaseUrl, getOrCreateSessionId, clearSessionId } from '../services/helpSupportService';
import { getChatReplyFallback } from '../utils/chatBotFallback';

const DEFAULT_WIDTH = 340;
const DEFAULT_HEIGHT = 420;
const MIN_WIDTH = 320;
const MAX_WIDTH = 560;
const MIN_HEIGHT = 320;
const MAX_HEIGHT = 720;
const DEFAULT_OFFSET = 20; // right/bottom when not dragged

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  at: number;
}

const FALLBACK_REPLY =
  "We're having trouble reaching the support server right now. You're seeing answers from our built-in assistant. For a live agent or to create a ticket, try again in a moment or go to Help & Support → Support Tickets.";

// Popular LLM models by provider with their base URLs
interface ModelOption {
  label: string;
  value: string;
  baseUrl: string;
}

const POPULAR_MODELS: ModelOption[] = [
  { label: 'Use backend default', value: '', baseUrl: '' },
  { label: 'GPT-4o (latest)', value: 'gpt-4o-2024-11-20', baseUrl: '' },
  { label: 'GPT-4o Mini', value: 'gpt-4o-mini-2024-07-18', baseUrl: '' },
  { label: 'GPT-4 Turbo', value: 'gpt-4-turbo', baseUrl: '' },
  { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo', baseUrl: '' },
  { label: 'Grok 2', value: 'grok-2-1212', baseUrl: 'https://api.x.ai/v1' },
  { label: 'Grok 4', value: 'grok-4', baseUrl: 'https://api.x.ai/v1' },
  { label: 'Grok 4 Fast', value: 'grok-4-fast', baseUrl: 'https://api.x.ai/v1' },
  { label: 'Claude Sonnet 4.5', value: 'claude-sonnet-4-5-20250929', baseUrl: 'https://api.anthropic.com/v1' },
  { label: 'Claude Opus 4.6', value: 'claude-opus-4-6', baseUrl: 'https://api.anthropic.com/v1' },
  { label: 'Claude Haiku 4.5', value: 'claude-haiku-4-5-20251001', baseUrl: 'https://api.anthropic.com/v1' },
  { label: 'Custom model...', value: '__custom__', baseUrl: '' }
];

const QUICK_START_OPTIONS: { label: string; message: string }[] = [
  { label: 'Password / Login', message: "I can't log in or forgot my password" },
  { label: 'Report an incident', message: 'How do I report an incident?' },
  { label: 'Camera offline', message: 'A camera is offline—what do I do?' },
  { label: 'Error message help', message: 'I see an error message—how do I fix it?' },
  { label: 'Dashboard not updating', message: 'My dashboard is not updating in real-time' },
  { label: 'Changes not saving', message: 'My changes are not saving' },
  { label: 'How patrols work', message: 'How do patrols work from start to finish?' },
  { label: 'Access & lockdown', message: 'How does access control and lockdown work?' },
  { label: 'Create a ticket', message: 'Create a ticket' },
  { label: 'How modules connect', message: 'How do modules work together?' },
  { label: 'Something else', message: "I need help with something else" }
];

const SUGGESTED_FOLLOW_UPS: { label: string; message: string }[] = [
  { label: 'What next?', message: 'What next?' },
  { label: "Still not working", message: "It didn't work" },
  { label: 'Report this gap', message: 'report this gap' },
  { label: 'Create a ticket', message: 'Create a ticket' }
];

const WRAP_UP_MARKER = 'start a new conversation';
const WRAP_UP_MARKER_2 = 'close the chat';

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'agent',
  text: "Hi! I'm the Proper 2.9 support assistant. I know what this system is, how every module works, and how they connect. Choose a topic below or type your question—I'll guide you step-by-step.",
  at: Date.now()
};

interface LiveChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveChatPanel: React.FC<LiveChatPanelProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastReplyWasFallback, setLastReplyWasFallback] = useState(false);
  const [size, setSize] = useState({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT });
  /** When set, panel is positioned by left/top (user has dragged). When null, use default right/bottom. */
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasStoredKey, setHasStoredKey] = useState(() => !!getStoredOpenAIKey());
  const [selectedModel, setSelectedModel] = useState(() => getStoredModel() || '');
  const [customModelInput, setCustomModelInput] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState(() => getStoredBaseUrl() || '');
  const [apiValidated, setApiValidated] = useState(false);
  const [apiValidationError, setApiValidationError] = useState<string | null>(null);
  const [validatedModelDisplayName, setValidatedModelDisplayName] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);
  const [greetingAlreadyShownInSession, setGreetingAlreadyShownInSession] = useState(false);
  const resizeStartRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; left: number; top: number } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSaveApiKey = () => {
    setStoredOpenAIKey(apiKeyInput.trim() || null);
    setHasStoredKey(!!apiKeyInput.trim());
    setApiKeyInput('');
    setApiValidated(false);
    setApiValidationError(null);
    setValidatedModelDisplayName(null);
    setConfigOpen(false);
  };

  const handleTestConnection = async () => {
    setValidating(true);
    setApiValidationError(null);
    try {
      // Persist current form values before validating so chat requests always have the key.
      // This avoids "API validated" but later messages using preset answers (key not sent).
      const keyToUse = apiKeyInput.trim() || getStoredOpenAIKey();
      if (keyToUse) {
        setStoredOpenAIKey(keyToUse);
        setHasStoredKey(true);
      }
      const modelToUse = selectedModel === '__custom__' ? (customModelInput.trim() || getStoredModel()) : selectedModel;
      if (modelToUse) setStoredModel(modelToUse);
      const baseUrlToUse = customBaseUrl.trim() || getStoredBaseUrl();
      if (baseUrlToUse) setStoredBaseUrl(baseUrlToUse);

      const result = await validateHelpApi();
      if (result.valid) {
        setApiValidated(true);
        setValidatedModelDisplayName(result.model_display_name ?? null);
        const displayName = result.model_display_name ?? 'AI';
        const isOnlyWelcome = messages.length === 1 && messages[0]?.id === 'welcome';
        if (isOnlyWelcome) {
          setMessages((prev) => [
            ...prev,
            {
              id: `agent-greeting-${Date.now()}`,
              role: 'agent',
              text: `Hi, I'm your ${displayName} Proper 2.9 AI agent. How can I help you today?`,
              at: Date.now()
            }
          ]);
          setGreetingAlreadyShownInSession(true);
        }
      } else {
        setApiValidated(false);
        setValidatedModelDisplayName(null);
        setApiValidationError(result.error ?? 'Validation failed');
      }
    } catch {
      setApiValidated(false);
      setApiValidationError('Could not reach server');
    } finally {
      setValidating(false);
    }
  };
  
  // Initialize custom model input if stored model is custom
  useEffect(() => {
    const stored = getStoredModel();
    const storedBaseUrl = getStoredBaseUrl();
    if (stored) {
      const modelObj = POPULAR_MODELS.find(m => m.value === stored && m.value !== '__custom__');
      if (!modelObj) {
        setSelectedModel('__custom__');
        setCustomModelInput(stored);
      }
    }
    if (storedBaseUrl) {
      setCustomBaseUrl(storedBaseUrl);
    }
  }, []);
  const handleClearApiKey = () => {
    setStoredOpenAIKey(null);
    setHasStoredKey(false);
    setApiKeyInput('');
    setApiValidated(false);
    setApiValidationError(null);
    setValidatedModelDisplayName(null);
    setConfigOpen(false);
  };

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeStartRef.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
    const onMove = (ev: MouseEvent) => {
      const start = resizeStartRef.current;
      if (!start) return;
      const deltaX = start.x - ev.clientX; // pull left = positive = wider
      const deltaY = start.y - ev.clientY; // pull up = positive = taller
      setSize((prev) => ({
        width: Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, start.w + deltaX)),
        height: Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, start.h + deltaY))
      }));
    };
    const onUp = () => {
      resizeStartRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [size.width, size.height]);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('select') || target.closest('textarea') || target.closest('label')) return;
    e.preventDefault();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const left = position?.left ?? window.innerWidth - size.width - DEFAULT_OFFSET;
    const top = position?.top ?? window.innerHeight - size.height - DEFAULT_OFFSET;
    dragStartRef.current = { x: e.clientX, y: e.clientY, left, top };
    const onMove = (ev: MouseEvent) => {
      const start = dragStartRef.current;
      if (!start) return;
      const dx = ev.clientX - start.x;
      const dy = ev.clientY - start.y;
      const newLeft = Math.max(0, Math.min(window.innerWidth - MIN_WIDTH, start.left + dx));
      const newTop = Math.max(0, Math.min(window.innerHeight - MIN_HEIGHT, start.top + dy));
      setPosition({ left: newLeft, top: newTop });
    };
    const onUp = () => {
      dragStartRef.current = null;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [position, size.width, size.height]);

  const hasUserSentMessage = messages.some((m) => m.role === 'user');
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.text;
  const lastBotReply = [...messages].reverse().find((m) => m.role === 'agent')?.text;

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || sending) return;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      at: Date.now()
    };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    try {
      const currentApiKey = getStoredOpenAIKey();
      // If user had API validated but key is missing now (e.g. other tab cleared storage), don't silently use built-in help
      if (hasStoredKey && apiValidated && !currentApiKey?.trim()) {
        const lostMsg: ChatMessage = {
          id: `agent-lost-${Date.now()}`,
          role: 'agent',
          text: "Your API connection was lost (e.g. storage was cleared). To use the AI again: open the config (gear), enter your API key, and click Test connection. Until then you'll see built-in help only.",
          at: Date.now()
        };
        setMessages((prev) => [...prev, lostMsg]);
        setSending(false);
        return;
      }
      const sessionId = getOrCreateSessionId();
      const context =
        lastUserMessage && lastBotReply
          ? { lastUserMessage, lastBotReply, sessionId, greetingAlreadyShown: greetingAlreadyShownInSession }
          : { sessionId, greetingAlreadyShown: greetingAlreadyShownInSession };
      
      const currentModel = getStoredModel();
      const currentBaseUrl = getStoredBaseUrl();
      console.log('[Help Chat Panel] Current config:', {
        hasApiKey: !!currentApiKey,
        apiKeyLength: currentApiKey?.length || 0,
        model: currentModel || 'none',
        baseUrl: currentBaseUrl || 'none'
      });
      
      const apiResponse = await sendChatMessage(text.trim(), context);
      const hasStoredAndValidated = hasStoredKey && apiValidated;
      const fromFallback = apiResponse?.reply == null;
      if (fromFallback) {
        console.warn('[Help Chat] API response was null.');
        if (hasStoredAndValidated) {
          console.warn('[Help Chat] API was validated — not using preset answers; showing error.');
        }
      } else {
        console.log('[Help Chat] ✅ LLM response received successfully');
        if (apiResponse?.model_display_name) {
          setApiValidated(true);
          setApiValidationError(null);
          setValidatedModelDisplayName(apiResponse.model_display_name);
        }
      }
      // When API is connected and validated, use ONLY the LLM — never preset/rule-based answers
      const reply = apiResponse?.reply ?? (hasStoredAndValidated
        ? "The AI couldn't respond right now. Please check your connection and try again, or open the config (gear) to re-test the API."
        : (getChatReplyFallback(text.trim(), context) ?? FALLBACK_REPLY));
      setLastReplyWasFallback(fromFallback);
      const agentMsg: ChatMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        text: reply,
        at: Date.now()
      };
      setMessages((prev) => [...prev, agentMsg]);
    } finally {
      setSending(false);
    }
  };

  const CHAT_MESSAGE_MAX_LENGTH = 2000;

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendMessage(text.length > CHAT_MESSAGE_MAX_LENGTH ? text.slice(0, CHAT_MESSAGE_MAX_LENGTH) : text);
  };

  const handleQuickStart = (option: { label: string; message: string }) => {
    sendMessage(option.message);
  };

  const isWrapUpMessage = (text: string) =>
    text.includes(WRAP_UP_MARKER) && text.includes(WRAP_UP_MARKER_2);

  const handleStartNewConversation = () => {
    setMessages([{ ...WELCOME_MESSAGE, at: Date.now() }]);
    setLastReplyWasFallback(false);
    setGreetingAlreadyShownInSession(false);
    clearSessionId(); // Clear session for new conversation
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  // Scale text with panel size: ~0.95 at min width to ~1.4 at max width
  const textScale =
    0.95 + ((size.width - MIN_WIDTH) / (MAX_WIDTH - MIN_WIDTH)) * 0.45;
  const panelStyle: React.CSSProperties = {
    width: size.width,
    height: size.height,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    ['--chat-text-scale' as string]: String(textScale),
    ...(position != null ? { left: position.left, top: position.top } : { right: DEFAULT_OFFSET, bottom: DEFAULT_OFFSET })
  };

  return (
    <div
      className="fixed z-[100] flex flex-col rounded-tl-lg rounded-tr-lg rounded-bl-lg shadow-lg border border-white/10 bg-slate-900 [font-size:calc(0.75rem*var(--chat-text-scale,1))]"
      style={panelStyle}
      role="dialog"
      aria-label="Live chat — IT Support"
    >
      {/* Header — drag handle: drag to move panel */}
      <div
        className="shrink-0 border-b border-white/10 bg-slate-800/80 rounded-tl-lg rounded-tr-lg text-[calc(0.75rem*var(--chat-text-scale,1))] cursor-move select-none"
        onMouseDown={handleDragStart}
        role="button"
        tabIndex={0}
        aria-label="Drag to move chat panel"
        title="Drag to move chat panel"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') e.preventDefault(); }}
      >
        <div className="flex items-center justify-between px-3 py-2">
          <span className="font-black uppercase tracking-widest text-white pointer-events-none">Live Chat</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSize((prev) => ({ width: prev.width >= MAX_WIDTH && prev.height >= MAX_HEIGHT ? DEFAULT_WIDTH : MAX_WIDTH, height: prev.width >= MAX_WIDTH && prev.height >= MAX_HEIGHT ? DEFAULT_HEIGHT : MAX_HEIGHT }))}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label={size.width >= MAX_WIDTH && size.height >= MAX_HEIGHT ? 'Restore chat size' : 'Expand chat'}
              title={size.width >= MAX_WIDTH && size.height >= MAX_HEIGHT ? 'Restore size' : 'Expand chat (larger panel)'}
            >
              <i className={`fas ${size.width >= MAX_WIDTH && size.height >= MAX_HEIGHT ? 'fa-compress-alt' : 'fa-expand-alt'}`} aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setConfigOpen((o) => !o)}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Configure chat"
              title={
                apiValidated && validatedModelDisplayName
                  ? `API validated: ${validatedModelDisplayName}`
                  : hasStoredKey
                    ? 'API key saved — Test connection to validate'
                    : 'Add API key for AI replies'
              }
            >
              <i className={`fas fa-cog ${apiValidated ? 'text-green-400' : hasStoredKey ? 'text-amber-400' : ''}`} aria-hidden />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[calc(0.875rem*var(--chat-text-scale,1))]"
              aria-label="Close chat"
            >
              <i className="fas fa-times" aria-hidden />
            </button>
          </div>
        </div>
        {configOpen && (
          <div className="px-3 pb-3 pt-0 space-y-3">
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                OpenAI API key (optional — for AI replies)
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder={hasStoredKey ? '••••••••' : 'sk-...'}
                className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="off"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">
                LLM Model (optional — overrides backend default)
              </label>
              <select
                value={selectedModel === '__custom__' ? '__custom__' : selectedModel}
                onChange={(e) => {
                  const value = e.target.value;
                  const selectedModelObj = POPULAR_MODELS.find(m => m.value === value);
                  if (value === '__custom__') {
                    setSelectedModel('__custom__');
                  } else {
                    setSelectedModel(value);
                    setStoredModel(value || null);
                    // Auto-set base URL for non-OpenAI models
                    if (selectedModelObj?.baseUrl) {
                      setStoredBaseUrl(selectedModelObj.baseUrl);
                      setCustomBaseUrl(selectedModelObj.baseUrl);
                    } else {
                      // Clear base URL for OpenAI models (use default)
                      setStoredBaseUrl(null);
                      setCustomBaseUrl('');
                    }
                  }
                }}
                className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {POPULAR_MODELS.map((model) => (
                  <option key={model.value} value={model.value} className="bg-slate-800">
                    {model.label}
                  </option>
                ))}
              </select>
              {selectedModel === '__custom__' && (
                <input
                  type="text"
                  value={customModelInput}
                  onChange={(e) => {
                    const value = e.target.value.trim();
                    setCustomModelInput(e.target.value);
                    setStoredModel(value || null);
                    setSelectedModel(value || '__custom__');
                  }}
                  placeholder="Enter model name (e.g. llama3.2, qwen2.5)"
                  className="w-full mt-1 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="off"
                />
              )}
              {selectedModel && selectedModel !== '__custom__' && (
                <p className="mt-1 text-[9px] text-slate-500">
                  Using: <span className="font-mono">{selectedModel}</span>
                  {getStoredBaseUrl() && (
                    <><br />API: <span className="font-mono">{getStoredBaseUrl()}</span></>
                  )}
                  <br />
                  <span className="text-[8px] text-slate-600">
                    {hasStoredKey ? '✓ API key saved' : '⚠ No API key'}
                    {apiValidated && validatedModelDisplayName && (
                      <> · <span className="text-green-500">API validated and fully functional ({validatedModelDisplayName})</span></>
                    )}
                  </span>
                </p>
              )}
              {apiValidationError && (
                <p className="mt-1 text-[9px] text-red-400" role="alert">
                  {apiValidationError}
                </p>
              )}
              {selectedModel === '__custom__' && (
                <div className="mt-2">
                  <label className="block text-[9px] text-slate-400 uppercase tracking-wider mb-1">
                    API Base URL (optional — leave empty for OpenAI)
                  </label>
                  <input
                    type="text"
                    value={customBaseUrl}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      setCustomBaseUrl(e.target.value);
                      setStoredBaseUrl(value || null);
                    }}
                    placeholder="https://api.anthropic.com/v1 (for Claude) or https://api.x.ai/v1 (for Grok)"
                    className="w-full px-2 py-1.5 rounded bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoComplete="off"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1 items-center">
              <Button size="sm" variant="outline" onClick={handleSaveApiKey} className="text-xs">
                Save
              </Button>
              {(hasStoredKey || apiKeyInput.trim()) && (
                <>
                  <Button size="sm" variant="outline" onClick={handleTestConnection} className="text-xs" disabled={validating}>
                    {validating ? 'Testing…' : 'Test connection'}
                  </Button>
                  {hasStoredKey && (
                    <Button size="sm" variant="outline" onClick={handleClearApiKey} className="text-xs">
                      Clear key
                    </Button>
                  )}
                </>
              )}
            </div>
            {hasStoredKey && !apiValidated && (
              <p className="text-[9px] text-amber-400">
                Click &quot;Test connection&quot; to confirm the API key and model work. The chat will then show a greeting from your AI agent.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Messages — aria-live so new messages are announced to screen readers; text scales with panel */}
      <div
        className="flex-1 min-h-0 overflow-y-auto space-y-2 p-2 text-[calc(0.75rem*var(--chat-text-scale,1))]"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.map((m) => (
          <div key={m.id}>
            <div
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[88%] rounded-lg px-2.5 py-1.5 ${
                  m.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 border border-white/10 text-slate-200'
                }`}
              >
                {m.role === 'agent' && (
                  <p className="text-[calc(0.5625rem*var(--chat-text-scale,1))] font-black uppercase tracking-widest text-slate-500 mb-0.5">
                    IT Support
                  </p>
                )}
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
              </div>
            </div>
            {m.role === 'agent' && m.id !== 'welcome' && (
              <div className="flex flex-wrap gap-1 mt-1 ml-1">
                {isWrapUpMessage(m.text) ? (
                  <>
                    <button
                      type="button"
                      onClick={handleStartNewConversation}
                      className="text-[calc(0.625rem*var(--chat-text-scale,1))] px-2 py-1 rounded border border-white/20 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      Start new conversation
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-[calc(0.625rem*var(--chat-text-scale,1))] px-2 py-1 rounded border border-white/20 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      Close
                    </button>
                  </>
                ) : (
                  SUGGESTED_FOLLOW_UPS.map((s) => (
                    <button
                      key={s.message}
                      type="button"
                      onClick={() => sendMessage(s.message)}
                      disabled={sending}
                      className="text-[calc(0.625rem*var(--chat-text-scale,1))] px-2 py-1 rounded border border-white/20 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      {s.label}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ))}
        {!hasUserSentMessage && (
          <div className="space-y-1.5 mt-2">
            <p className="text-[calc(0.5625rem*var(--chat-text-scale,1))] font-black uppercase tracking-widest text-slate-500 px-0.5">
              What do you need help with?
            </p>
            <div className="flex flex-wrap gap-1">
              {QUICK_START_OPTIONS.map((opt) => (
                <button
                  key={opt.message}
                  type="button"
                  onClick={() => handleQuickStart(opt)}
                  disabled={sending}
                  className="text-[calc(0.625rem*var(--chat-text-scale,1))] px-2 py-1.5 rounded border border-white/20 bg-white/5 text-slate-300 hover:bg-white/10 hover:border-white/30 transition-colors text-left max-w-full truncate"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {sending && (
          <div className="flex justify-start" aria-live="polite">
            <div className="rounded-lg px-2.5 py-1.5 bg-slate-800 border border-white/10 text-slate-400 text-[calc(0.75rem*var(--chat-text-scale,1))]">
              <i className="fas fa-spinner fa-spin mr-1.5" aria-hidden />
              Typing...
            </div>
          </div>
        )}
        {lastReplyWasFallback && hasUserSentMessage && (
          <p className="text-[calc(0.625rem*var(--chat-text-scale,1))] text-slate-500 px-1 mt-1" role="status">
            You&apos;re seeing built-in help. For a live agent, try again later or create a ticket in Support Tickets. If the assistant didn&apos;t answer your question, use &quot;Report this gap&quot; so the team can improve it.
          </p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input — scales with panel */}
      <div className="shrink-0 flex flex-col gap-0.5 p-2 border-t border-white/10 bg-slate-800/50 rounded-bl-lg">
        <div className="flex gap-1.5 items-end">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 2000))}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            maxLength={2000}
            className="flex-1 min-h-[36px] max-h-20 px-2.5 py-2 rounded-md bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-[calc(0.75rem*var(--chat-text-scale,1))]"
            style={{ minHeight: 'calc(2.25rem * var(--chat-text-scale, 1))' }}
            disabled={sending}
            aria-describedby={input.length > 1800 ? 'chat-char-count' : undefined}
          />
            <Button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            size="sm"
            className="shrink-0 self-end h-9 w-9 p-0"
            aria-label="Send"
          >
            <i className="fas fa-paper-plane" aria-hidden />
          </Button>
        </div>
        {input.length > 1800 && (
          <p id="chat-char-count" className="text-[10px] text-slate-500 px-0.5" aria-live="polite">
            {input.length}/2000 characters
          </p>
        )}
      </div>

      {/* Resize handle — top-left: pull to expand for readability / accessibility */}
      <div
        aria-label="Pull to resize chat panel"
        tabIndex={0}
        onMouseDown={handleResizeStart}
        className="absolute left-0 top-0 w-6 h-6 cursor-nwse-resize flex items-center justify-center rounded-tl-lg bg-slate-700/80 hover:bg-slate-600 text-slate-400 hover:text-white border border-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[calc(0.625rem*var(--chat-text-scale,1))]"
        title="Pull to resize chat (expand for larger text)"
      >
        <i className="fas fa-expand-alt rotate-[135deg]" aria-hidden />
      </div>
    </div>
  );
};
