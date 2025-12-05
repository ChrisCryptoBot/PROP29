"""
LLM Service for AI-powered features in PROPER 2.9
Supports incident classification, severity assessment, and text analysis
"""
import os
import time
import logging
from typing import Dict, Any, Optional, Tuple
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

    def generate_summary(self, content: str, max_length: int = 200) -> str:
        """
        Generate a concise summary of text content

        Args:
            content: The content to summarize
            max_length: Maximum length of summary in words

        Returns:
            Summarized text
        """
        if not self._check_rate_limit():
            return self._fallback_summary(content, max_length)

        try:
            if self.provider == "openai" and self.openai_api_key:
                return self._retry_with_backoff(self._summarize_with_openai, content, max_length)
            elif self.provider == "anthropic" and self.anthropic_api_key:
                return self._retry_with_backoff(self._summarize_with_anthropic, content, max_length)
            else:
                return self._fallback_summary(content, max_length)

        except Exception as e:
            logger.error(f"AI summarization failed: {e}")
            return self._fallback_summary(content, max_length)

    def _summarize_with_openai(self, content: str, max_length: int) -> str:
        """Summarize content using OpenAI"""
        client = self._init_openai_client()
        if not client:
            raise ValueError("OpenAI client not initialized")

        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": f"You are a professional summarizer. Create concise summaries under {max_length} words."},
                {"role": "user", "content": f"Summarize the following:\n\n{content}"}
            ],
            temperature=0.3,
            max_tokens=max_length * 2,
            timeout=self.timeout_seconds
        )

        return response.choices[0].message.content.strip()

    def _summarize_with_anthropic(self, content: str, max_length: int) -> str:
        """Summarize content using Anthropic Claude"""
        client = self._init_anthropic_client()
        if not client:
            raise ValueError("Anthropic client not initialized")

        response = client.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022"),
            max_tokens=max_length * 2,
            temperature=0.3,
            messages=[
                {"role": "user", "content": f"Summarize the following in under {max_length} words:\n\n{content}"}
            ],
            timeout=self.timeout_seconds
        )

        return response.content[0].text.strip()

    def _fallback_summary(self, content: str, max_length: int) -> str:
        """Fallback summary: just truncate the content"""
        words = content.split()
        if len(words) <= max_length:
            return content
        return " ".join(words[:max_length]) + "..."

    def explain_anomaly(self, sensor_data: Dict[str, Any], context: str = "") -> str:
        """
        Explain an anomaly detected in sensor/IoT data

        Args:
            sensor_data: The sensor data showing anomalies
            context: Additional context about the anomaly

        Returns:
            Human-readable explanation of the anomaly
        """
        if not self._check_rate_limit():
            return "Anomaly detected. Please review sensor data for details."

        try:
            sensor_info = json.dumps(sensor_data, indent=2)
            prompt = f"Explain this security sensor anomaly in simple terms:\n\nSensor Data:\n{sensor_info}\n\nContext: {context}"

            if self.provider == "openai" and self.openai_api_key:
                return self._retry_with_backoff(self._explain_with_openai, prompt)
            elif self.provider == "anthropic" and self.anthropic_api_key:
                return self._retry_with_backoff(self._explain_with_anthropic, prompt)
            else:
                return "Anomaly detected. AI explanation unavailable."

        except Exception as e:
            logger.error(f"AI anomaly explanation failed: {e}")
            return "Anomaly detected. Unable to generate explanation."

    def _explain_with_openai(self, prompt: str) -> str:
        """Explain anomaly using OpenAI"""
        client = self._init_openai_client()
        if not client:
            raise ValueError("OpenAI client not initialized")

        response = client.chat.completions.create(
            model=os.getenv("OPENAI_MODEL", "gpt-4o-mini"),
            messages=[
                {"role": "system", "content": "You are a security expert explaining sensor anomalies to security staff."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            max_tokens=300,
            timeout=self.timeout_seconds
        )

        return response.choices[0].message.content.strip()

    def _explain_with_anthropic(self, prompt: str) -> str:
        """Explain anomaly using Anthropic Claude"""
        client = self._init_anthropic_client()
        if not client:
            raise ValueError("Anthropic client not initialized")

        response = client.messages.create(
            model=os.getenv("ANTHROPIC_MODEL", "claude-3-5-haiku-20241022"),
            max_tokens=300,
            temperature=0.5,
            messages=[
                {"role": "user", "content": prompt}
            ],
            timeout=self.timeout_seconds
        )

        return response.content[0].text.strip()

# Singleton instance
_llm_service_instance = None

def get_llm_service() -> LLMService:
    """Get or create LLM service singleton instance"""
    global _llm_service_instance
    if _llm_service_instance is None:
        _llm_service_instance = LLMService()
    return _llm_service_instance
