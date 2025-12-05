# Phase 1 AI Integration - Files for Cursor

This document contains all the files Cursor needs to add/update for the AI integration with **Gold Standard design**.

---

## Status Check

These files **already exist and are correct** (no action needed):
- ✅ `backend/.env.example` - Has AI configuration
- ✅ `backend/requirements.txt` - Has `anthropic==0.39.0`
- ✅ `backend/services/incident_service.py` - Has AI methods

---

## Files to CREATE

### 1. `backend/services/ai_ml_service/llm_service.py`

**Location:** Create this file at `backend/services/ai_ml_service/llm_service.py`

**Complete file content:** See PART 1 below

---

## Files to UPDATE

### 2. `backend/services/ai_ml_service/__init__.py`

**Action:** REPLACE entire file with this content:

```python
"""
AI/ML Service Package
Core AI and machine learning services for predictive analytics, pattern recognition, and optimization.
"""

from .llm_service import LLMService, get_llm_service

# Future imports (commented out until implemented)
# from .transcription_service import TranscriptionService, get_transcription_service
# from .prediction_service import PredictionService
# from .optimization_service import OptimizationService
# from .analytics_service import AnalyticsService
# from .model_service import ModelService

__all__ = [
    'LLMService',
    'get_llm_service',
    # 'TranscriptionService',
    # 'get_transcription_service',
    # 'PredictionService',
    # 'OptimizationService',
    # 'AnalyticsService',
    # 'ModelService'
]
```

---

### 3. `backend/api/incident_endpoints.py`

**Action:** REPLACE entire file with this content (see PART 2 below)

---

### 4. `frontend/src/pages/modules/IncidentLogModule.tsx`

**Action:** ADD AI integration with Gold Standard design (see PART 3 below)

---

## PART 1: llm_service.py Content

**File:** `backend/services/ai_ml_service/llm_service.py`

```python
"""
LLM Service for AI-powered features in PROPER 2.9
Supports incident classification, severity assessment, and text analysis
"""
import os
import time
import logging
from typing import Dict, Any, Optional
from enum import Enum
import json

logger = logging.getLogger(__name__)

class LLMProvider(str, Enum):
    """Supported LLM providers"""
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    FALLBACK = "fallback"

class LLMService:
    """Service for interacting with Large Language Models"""

    def __init__(self):
        """Initialize LLM service with environment configuration"""
        self.provider = os.getenv("AI_MODEL_PROVIDER", "openai").lower()
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.anthropic_api_key = os.getenv("ANTHROPIC_API_KEY")
        self.confidence_threshold = float(os.getenv("AI_CONFIDENCE_THRESHOLD", "0.7"))
        self.rate_limit_per_minute = int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "60"))
        self.max_retries = int(os.getenv("AI_MAX_RETRIES", "3"))
        self.timeout_seconds = int(os.getenv("AI_TIMEOUT_SECONDS", "30"))

        # Initialize rate limiting
        self._request_times = []

        # Initialize clients
        self._openai_client = None
        self._anthropic_client = None

        logger.info(f"LLM Service initialized with provider: {self.provider}")

    def _init_openai_client(self):
        """Lazy initialization of OpenAI client"""
        if self._openai_client is None and self.openai_api_key:
            try:
                import openai
                self._openai_client = openai.OpenAI(api_key=self.openai_api_key)
                logger.info("OpenAI client initialized successfully")
            except ImportError:
                logger.error("OpenAI package not installed. Run: pip install openai")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
        return self._openai_client

    def _init_anthropic_client(self):
        """Lazy initialization of Anthropic client"""
        if self._anthropic_client is None and self.anthropic_api_key:
            try:
                import anthropic
                self._anthropic_client = anthropic.Anthropic(api_key=self.anthropic_api_key)
                logger.info("Anthropic client initialized successfully")
            except ImportError:
                logger.error("Anthropic package not installed. Run: pip install anthropic")
            except Exception as e:
                logger.error(f"Failed to initialize Anthropic client: {e}")
        return self._anthropic_client

    def _check_rate_limit(self) -> bool:
        """Check if we're within rate limits"""
        current_time = time.time()
        # Remove requests older than 1 minute
        self._request_times = [t for t in self._request_times if current_time - t < 60]

        if len(self._request_times) >= self.rate_limit_per_minute:
            logger.warning(f"Rate limit exceeded: {len(self._request_times)}/{self.rate_limit_per_minute} requests in last minute")
            return False

        self._request_times.append(current_time)
        return True

    def _retry_with_backoff(self, func, *args, **kwargs) -> Any:
        """Execute function with exponential backoff retry logic"""
        for attempt in range(self.max_retries):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if attempt < self.max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff: 1s, 2s, 4s
                    logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    logger.error(f"All {self.max_retries} attempts failed: {e}")
                    raise

    def classify_incident(self, description: str, title: str = "", location: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Classify an incident using AI to suggest incident type and severity

        Args:
            description: The incident description
            title: Optional incident title
            location: Optional location information

        Returns:
            Dict containing:
                - incident_type: Suggested incident type
                - severity: Suggested severity level
                - confidence: Confidence score (0-1)
                - reasoning: Explanation of the classification
                - fallback_used: Whether fallback logic was used
        """
        if not self._check_rate_limit():
            return self._fallback_classification(description, title)

        try:
            # Prepare context
            context = f"Title: {title}\n" if title else ""
            context += f"Description: {description}\n"
            if location:
                context += f"Location: {location.get('area', 'Unknown')}\n"

            # Try primary provider
            if self.provider == "openai" and self.openai_api_key:
                return self._retry_with_backoff(self._classify_with_openai, context)
            elif self.provider == "anthropic" and self.anthropic_api_key:
                return self._retry_with_backoff(self._classify_with_anthropic, context)
            else:
                logger.warning(f"Provider {self.provider} not configured, using fallback")
                return self._fallback_classification(description, title)

        except Exception as e:
            logger.error(f"AI classification failed: {e}")
            return self._fallback_classification(description, title)

    def _classify_with_openai(self, context: str) -> Dict[str, Any]:
        """Classify incident using OpenAI"""
        client = self._init_openai_client()
        if not client:
            raise ValueError("OpenAI client not initialized")

        prompt = self._build_classification_prompt(context)

        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "You are an expert security incident classifier for hotels. Provide classifications in JSON format."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=500,
            timeout=self.timeout_seconds
        )

        result_text = response.choices[0].message.content.strip()
        logger.info(f"OpenAI classification result: {result_text}")

        return self._parse_classification_result(result_text)

    def _classify_with_anthropic(self, context: str) -> Dict[str, Any]:
        """Classify incident using Anthropic Claude"""
        client = self._init_anthropic_client()
        if not client:
            raise ValueError("Anthropic client not initialized")

        prompt = self._build_classification_prompt(context)

        response = client.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022"),
            max_tokens=500,
            temperature=0.3,
            messages=[
                {"role": "user", "content": prompt}
            ],
            timeout=self.timeout_seconds
        )

        result_text = response.content[0].text.strip()
        logger.info(f"Anthropic classification result: {result_text}")

        return self._parse_classification_result(result_text)

    def _build_classification_prompt(self, context: str) -> str:
        """Build the classification prompt"""
        return f"""Analyze this hotel security incident and classify it.

{context}

Incident Types:
- theft: Theft or burglary
- disturbance: Noise complaints, fights, disorderly conduct
- medical: Medical emergencies, injuries
- fire: Fire hazards or alarms
- flood: Water damage, flooding
- cyber: Cybersecurity incidents
- guest_complaint: General guest complaints
- other: Other incidents

Severity Levels:
- low: Minor issues, no immediate threat
- medium: Moderate issues, requires attention
- high: Serious issues, requires urgent response
- critical: Life-threatening or major property damage

Respond ONLY with a JSON object in this exact format:
{{
  "incident_type": "theft",
  "severity": "high",
  "confidence": 0.85,
  "reasoning": "Brief explanation of why this classification was chosen"
}}"""

    def _parse_classification_result(self, result_text: str) -> Dict[str, Any]:
        """Parse the LLM response and extract classification"""
        try:
            # Try to extract JSON from the response
            result_text = result_text.strip()

            # Remove markdown code blocks if present
            if result_text.startswith("```"):
                result_text = result_text.split("```")[1]
                if result_text.startswith("json"):
                    result_text = result_text[4:]
                result_text = result_text.strip()

            data = json.loads(result_text)

            # Validate required fields
            required_fields = ["incident_type", "severity", "confidence", "reasoning"]
            if not all(field in data for field in required_fields):
                raise ValueError(f"Missing required fields in response: {data}")

            # Ensure confidence is a float
            data["confidence"] = float(data["confidence"])
            data["fallback_used"] = False

            logger.info(f"Successfully parsed classification: {data['incident_type']} ({data['severity']}) with {data['confidence']} confidence")

            return data

        except Exception as e:
            logger.error(f"Failed to parse LLM response: {e}\nResponse: {result_text}")
            raise

    def _fallback_classification(self, description: str, title: str = "") -> Dict[str, Any]:
        """Fallback classification using simple keyword matching"""
        logger.info("Using fallback classification logic")

        text = f"{title} {description}".lower()

        # Simple keyword-based classification
        if any(word in text for word in ["theft", "stolen", "missing", "robbery", "burglar"]):
            return {
                "incident_type": "theft",
                "severity": "high",
                "confidence": 0.6,
                "reasoning": "Keyword-based detection: theft-related terms found",
                "fallback_used": True
            }
        elif any(word in text for word in ["fire", "smoke", "alarm", "burning"]):
            return {
                "incident_type": "fire",
                "severity": "critical",
                "confidence": 0.7,
                "reasoning": "Keyword-based detection: fire-related terms found",
                "fallback_used": True
            }
        elif any(word in text for word in ["medical", "injury", "hurt", "ambulance", "emergency"]):
            return {
                "incident_type": "medical",
                "severity": "high",
                "confidence": 0.65,
                "reasoning": "Keyword-based detection: medical-related terms found",
                "fallback_used": True
            }
        elif any(word in text for word in ["flood", "water", "leak", "overflow"]):
            return {
                "incident_type": "flood",
                "severity": "medium",
                "confidence": 0.6,
                "reasoning": "Keyword-based detection: water-related terms found",
                "fallback_used": True
            }
        elif any(word in text for word in ["noise", "loud", "fight", "argument", "disturbance"]):
            return {
                "incident_type": "disturbance",
                "severity": "medium",
                "confidence": 0.65,
                "reasoning": "Keyword-based detection: disturbance-related terms found",
                "fallback_used": True
            }
        elif any(word in text for word in ["hack", "cyber", "breach", "password", "phishing"]):
            return {
                "incident_type": "cyber",
                "severity": "high",
                "confidence": 0.6,
                "reasoning": "Keyword-based detection: cyber-related terms found",
                "fallback_used": True
            }
        elif any(word in text for word in ["complaint", "dissatisfied", "unhappy", "problem"]):
            return {
                "incident_type": "guest_complaint",
                "severity": "low",
                "confidence": 0.5,
                "reasoning": "Keyword-based detection: complaint-related terms found",
                "fallback_used": True
            }
        else:
            return {
                "incident_type": "other",
                "severity": "medium",
                "confidence": 0.4,
                "reasoning": "No specific keywords detected, defaulting to 'other'",
                "fallback_used": True
            }

# Singleton instance
_llm_service_instance = None

def get_llm_service() -> LLMService:
    """Get or create LLM service singleton instance"""
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = LLMService()
    return _llm_service_instance
```

---

## Testing the Backend

```bash
cd backend
pip install -r requirements.txt
python main.py
```

Test the AI endpoint:
```bash
curl -X POST http://localhost:8000/incidents/ai-classify \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Suspicious activity",
    "description": "Multiple individuals loitering near guest vehicles for extended period. Behaving suspiciously.",
    "location": {"area": "Parking Garage"}
  }'
```

Expected response:
```json
{
  "incident_type": "disturbance",
  "severity": "medium",
  "confidence": 0.75,
  "reasoning": "...",
  "fallback_used": false
}
```

---

## Next: Frontend Integration

See PART 3 in the next message for the Gold Standard frontend UI code.
