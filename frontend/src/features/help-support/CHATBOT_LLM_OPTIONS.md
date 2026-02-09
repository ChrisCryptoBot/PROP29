# Making the Chat Bot a Real LLM (AI) — Tokens & Subscriptions

## Short answer

- **Yes**, the bot can use a **real LLM** (like ChatGPT/OpenAI) and behave like an actual AI assistant.
- **Tokens and cost:** Using a **cloud API** (OpenAI, Anthropic, Azure, etc.) means you pay for usage:
  - **Tokens** = input + output (roughly 4 chars per token). You are charged **per token** (e.g. $0.15–$2+ per 1M input tokens depending on model).
  - **Subscriptions:** Optional. Many providers offer **pay-as-you-go** (no monthly subscription; you just pay for what you use). Some also offer subscription tiers for lower per-token cost or higher limits.
- **No tokens/subscription in the classic sense:** If you run a **self-hosted** model (e.g. Ollama, llama.cpp, or your own server), you don’t pay a vendor per token—you pay for your own compute (electricity, GPU, hosting) instead.

So: **real AI = possible**. **Cost** = either per-token (cloud API) or your own hardware (self-hosted).

---

## How it’s implemented in this project

The **backend** supports two modes:

1. **Rule-based + problem dissection (default)**  
   No API key needed. No token cost. The bot uses keyword/dissect logic and fixed knowledge (workflows, troubleshooting). Same behavior in the **frontend fallback** when the API is unreachable.

2. **Optional real LLM**  
   When an API key is set (see below), the backend calls **OpenAI** (or an **OpenAI-compatible** endpoint) with:
   - A **system prompt** that describes the Proper 2.9 assistant (modules, workflows, when to suggest tickets).
   - **Conversation context**: last user message + last bot reply + current message.
   - **Model**: configurable (default `gpt-4o-mini` for lower cost).

   If the LLM call **succeeds**, its reply is returned. If the key is missing or the call **fails** (network, quota, etc.), the backend **falls back** to the rule-based bot. So the app always responds; you only “pay” when the LLM is enabled and actually used.

---

## How to enable the real LLM

Set **one** of these in your backend environment (e.g. `.env` or your deployment config):

- **`OPENAI_API_KEY`** — your OpenAI API key (or a key from an OpenAI-compatible service).
- **`HELP_CHAT_LLM_API_KEY`** — same idea; used only for the help chat if you want a separate key.

Optional:

- **`HELP_CHAT_LLM_MODEL`** — model name (default: `gpt-4o-mini`). Examples: `gpt-4o`, `gpt-4o-mini`, `gpt-3.5-turbo`.
- **`HELP_CHAT_LLM_BASE_URL`** — base URL for an **OpenAI-compatible** API (e.g. Azure OpenAI, or a local server). Leave unset to use OpenAI’s default.

Example `.env`:

```bash
# Enable real AI for help chat (you will be charged per token by the provider)
OPENAI_API_KEY=sk-...

# Optional: use a cheaper/smaller model
HELP_CHAT_LLM_MODEL=gpt-4o-mini

# Optional: use Azure or another OpenAI-compatible endpoint
# HELP_CHAT_LLM_BASE_URL=https://your-resource.openai.azure.com/openai/deployments/your-deployment
```

After setting the key and restarting the backend, the next help chat message will use the LLM when the call succeeds; otherwise the rule-based bot is used.

---

## Rough cost (cloud API)

- **gpt-4o-mini**: typically a few cents per 1M input tokens and per 1M output tokens; a short chat (e.g. 10 exchanges) is often well under $0.01.
- **gpt-4o / larger models**: more per token; useful if you want higher quality and accept higher cost.

Check the provider’s pricing page (e.g. [OpenAI pricing](https://platform.openai.com/docs/pricing)) for current rates. No subscription is required for pay-as-you-go; you only need to add a payment method and pay for usage.

---

## Summary

| Question | Answer |
|----------|--------|
| Can the bot be a real LLM? | **Yes** — enable it with an API key (see above). |
| Does it require tokens? | **Yes** for cloud APIs — you pay per token (input + output). |
| Does it require a subscription? | **No** for pay-as-you-go; **optional** subscription tiers exist for some providers. |
| What if I don’t set a key? | The rule-based + dissect bot runs; **no token cost**. |
| What if the LLM fails? | The backend **falls back** to the rule-based bot automatically. |
