"""
Voice-to-Text Transcription Service for PROPER 2.9
Supports transcription of audio patrol notes and voice observations
"""
import os
import logging
from typing import Dict, Any, Optional
from enum import Enum
import base64

logger = logging.getLogger(__name__)


class TranscriptionProvider(str, Enum):
    """Supported transcription providers"""
    DEEPGRAM = "deepgram"
    ASSEMBLYAI = "assemblyai"
    OPENAI_WHISPER = "openai_whisper"
    FALLBACK = "fallback"


class TranscriptionService:
    """Service for transcribing audio to text"""

    def __init__(self):
        """Initialize transcription service with environment configuration"""
        self.provider = os.getenv("TRANSCRIPTION_PROVIDER", "openai_whisper").lower()
        self.deepgram_api_key = os.getenv("DEEPGRAM_API_KEY")
        self.assemblyai_api_key = os.getenv("ASSEMBLYAI_API_KEY")
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        self.max_audio_duration_seconds = int(os.getenv("MAX_AUDIO_DURATION_SECONDS", "300"))  # 5 minutes
        self.max_file_size_mb = int(os.getenv("MAX_AUDIO_FILE_SIZE_MB", "25"))
        self.supported_formats = ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"]

        # Initialize clients
        self._deepgram_client = None
        self._assemblyai_client = None
        self._openai_client = None

        logger.info(f"Transcription Service initialized with provider: {self.provider}")

    def _init_openai_client(self):
        """Lazy initialization of OpenAI Whisper client"""
        if self._openai_client is None and self.openai_api_key:
            try:
                import openai
                self._openai_client = openai.OpenAI(api_key=self.openai_api_key)
                logger.info("OpenAI Whisper client initialized successfully")
            except ImportError:
                logger.error("OpenAI package not installed. Run: pip install openai")
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI client: {e}")
        return self._openai_client

    def _init_deepgram_client(self):
        """Lazy initialization of Deepgram client"""
        if self._deepgram_client is None and self.deepgram_api_key:
            try:
                from deepgram import DeepgramClient
                self._deepgram_client = DeepgramClient(self.deepgram_api_key)
                logger.info("Deepgram client initialized successfully")
            except ImportError:
                logger.error("Deepgram package not installed. Run: pip install deepgram-sdk")
            except Exception as e:
                logger.error(f"Failed to initialize Deepgram client: {e}")
        return self._deepgram_client

    def _init_assemblyai_client(self):
        """Lazy initialization of AssemblyAI client"""
        if self._assemblyai_client is None and self.assemblyai_api_key:
            try:
                import assemblyai as aai
                aai.settings.api_key = self.assemblyai_api_key
                self._assemblyai_client = aai.Transcriber()
                logger.info("AssemblyAI client initialized successfully")
            except ImportError:
                logger.error("AssemblyAI package not installed. Run: pip install assemblyai")
            except Exception as e:
                logger.error(f"Failed to initialize AssemblyAI client: {e}")
        return self._assemblyai_client

    def transcribe_audio(
        self,
        audio_file_path: Optional[str] = None,
        audio_data: Optional[bytes] = None,
        audio_format: str = "mp3",
        language: str = "en"
    ) -> Dict[str, Any]:
        """
        Transcribe audio file or audio data to text

        Args:
            audio_file_path: Path to audio file on disk
            audio_data: Raw audio bytes (if not using file path)
            audio_format: Audio format (mp3, wav, etc.)
            language: Language code (default: en)

        Returns:
            Dict containing:
                - transcript: The transcribed text
                - confidence: Overall confidence score (0-1)
                - duration: Audio duration in seconds
                - word_count: Number of words transcribed
                - provider_used: Which provider was used
                - fallback_used: Whether fallback was used
        """
        try:
            # Validate inputs
            if not audio_file_path and not audio_data:
                raise ValueError("Either audio_file_path or audio_data must be provided")

            if audio_format.lower() not in self.supported_formats:
                raise ValueError(f"Unsupported audio format: {audio_format}. Supported: {self.supported_formats}")

            # Choose provider and transcribe
            if self.provider == "openai_whisper" and self.openai_api_key:
                return self._transcribe_with_openai_whisper(audio_file_path, audio_data, language)
            elif self.provider == "deepgram" and self.deepgram_api_key:
                return self._transcribe_with_deepgram(audio_file_path, audio_data, language)
            elif self.provider == "assemblyai" and self.assemblyai_api_key:
                return self._transcribe_with_assemblyai(audio_file_path, audio_data, language)
            else:
                logger.warning(f"Provider {self.provider} not configured, using fallback")
                return self._fallback_transcription()

        except Exception as e:
            logger.error(f"Transcription failed: {e}")
            return self._fallback_transcription(error_message=str(e))

    def _transcribe_with_openai_whisper(
        self,
        audio_file_path: Optional[str],
        audio_data: Optional[bytes],
        language: str
    ) -> Dict[str, Any]:
        """Transcribe using OpenAI Whisper"""
        client = self._init_openai_client()
        if not client:
            raise ValueError("OpenAI client not initialized")

        try:
            if audio_file_path:
                with open(audio_file_path, "rb") as audio_file:
                    transcript_response = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=audio_file,
                        language=language,
                        response_format="verbose_json"
                    )
            elif audio_data:
                # OpenAI requires a file-like object
                import io
                audio_file_obj = io.BytesIO(audio_data)
                audio_file_obj.name = "audio.mp3"
                transcript_response = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file_obj,
                    language=language,
                    response_format="verbose_json"
                )
            else:
                raise ValueError("No audio data provided")

            transcript_text = transcript_response.text
            duration = getattr(transcript_response, 'duration', 0)

            logger.info(f"OpenAI Whisper transcription successful: {len(transcript_text)} characters")

            return {
                "transcript": transcript_text,
                "confidence": 0.9,  # Whisper doesn't provide confidence scores
                "duration": duration,
                "word_count": len(transcript_text.split()),
                "provider_used": "openai_whisper",
                "fallback_used": False,
                "language": language
            }

        except Exception as e:
            logger.error(f"OpenAI Whisper transcription failed: {e}")
            raise

    def _transcribe_with_deepgram(
        self,
        audio_file_path: Optional[str],
        audio_data: Optional[bytes],
        language: str
    ) -> Dict[str, Any]:
        """Transcribe using Deepgram"""
        client = self._init_deepgram_client()
        if not client:
            raise ValueError("Deepgram client not initialized")

        try:
            from deepgram import PrerecordedOptions

            options = PrerecordedOptions(
                model="nova-2",
                language=language,
                punctuate=True,
                diarize=False
            )

            if audio_file_path:
                with open(audio_file_path, "rb") as audio:
                    source = {"buffer": audio.read()}
            elif audio_data:
                source = {"buffer": audio_data}
            else:
                raise ValueError("No audio data provided")

            response = client.listen.prerecorded.v("1").transcribe_file(source, options)

            result = response["results"]["channels"][0]["alternatives"][0]
            transcript = result["transcript"]
            confidence = result.get("confidence", 0.0)

            logger.info(f"Deepgram transcription successful: {len(transcript)} characters")

            return {
                "transcript": transcript,
                "confidence": confidence,
                "duration": response["metadata"].get("duration", 0),
                "word_count": len(transcript.split()),
                "provider_used": "deepgram",
                "fallback_used": False,
                "language": language
            }

        except Exception as e:
            logger.error(f"Deepgram transcription failed: {e}")
            raise

    def _transcribe_with_assemblyai(
        self,
        audio_file_path: Optional[str],
        audio_data: Optional[bytes],
        language: str
    ) -> Dict[str, Any]:
        """Transcribe using AssemblyAI"""
        client = self._init_assemblyai_client()
        if not client:
            raise ValueError("AssemblyAI client not initialized")

        try:
            import assemblyai as aai

            config = aai.TranscriptionConfig(
                language_code=language,
                punctuate=True,
                format_text=True
            )

            if audio_file_path:
                transcript = client.transcribe(audio_file_path, config=config)
            elif audio_data:
                # AssemblyAI requires uploading data first
                upload_url = aai.upload(audio_data)
                transcript = client.transcribe(upload_url, config=config)
            else:
                raise ValueError("No audio data provided")

            if transcript.status == aai.TranscriptStatus.error:
                raise Exception(f"AssemblyAI transcription error: {transcript.error}")

            logger.info(f"AssemblyAI transcription successful: {len(transcript.text)} characters")

            return {
                "transcript": transcript.text,
                "confidence": transcript.confidence if hasattr(transcript, 'confidence') else 0.85,
                "duration": transcript.audio_duration,
                "word_count": len(transcript.text.split()),
                "provider_used": "assemblyai",
                "fallback_used": False,
                "language": language
            }

        except Exception as e:
            logger.error(f"AssemblyAI transcription failed: {e}")
            raise

    def _fallback_transcription(self, error_message: str = "") -> Dict[str, Any]:
        """Fallback when transcription is unavailable"""
        logger.warning("Using fallback transcription - returning empty result")

        return {
            "transcript": "[Voice transcription unavailable - please type your observation]",
            "confidence": 0.0,
            "duration": 0,
            "word_count": 0,
            "provider_used": "fallback",
            "fallback_used": True,
            "error": error_message or "No transcription provider configured",
            "language": "en"
        }

    def transcribe_patrol_observation(
        self,
        audio_file_path: Optional[str] = None,
        audio_data: Optional[bytes] = None,
        patrol_id: str = None,
        location: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Transcribe a patrol observation with additional context

        Args:
            audio_file_path: Path to audio file
            audio_data: Raw audio bytes
            patrol_id: ID of the patrol
            location: Location information

        Returns:
            Dict with transcription and metadata
        """
        try:
            result = self.transcribe_audio(
                audio_file_path=audio_file_path,
                audio_data=audio_data
            )

            # Add patrol-specific metadata
            result["patrol_id"] = patrol_id
            result["location"] = location
            result["transcription_type"] = "patrol_observation"

            logger.info(f"Patrol observation transcribed for patrol {patrol_id}")

            return result

        except Exception as e:
            logger.error(f"Failed to transcribe patrol observation: {e}")
            return self._fallback_transcription(error_message=str(e))


# Singleton instance
_transcription_service_instance = None


def get_transcription_service() -> TranscriptionService:
    """Get or create transcription service singleton instance"""
    global _transcription_service_instance
    if _transcription_service_instance is None:
        _transcription_service_instance = TranscriptionService()
    return _transcription_service_instance
