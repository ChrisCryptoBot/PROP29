"""
Circuit breaker for external/hardware calls.
Prevents cascading failures when bridge or devices are unavailable.
"""
import logging
import time
from enum import Enum
from typing import Callable, TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")


class CircuitState(str, Enum):
    CLOSED = "closed"   # Normal; calls pass through
    OPEN = "open"       # Failing; calls fail fast
    HALF_OPEN = "half_open"  # Testing; one call allowed


class CircuitBreaker:
    """In-memory circuit breaker with configurable failure threshold and recovery."""

    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout_seconds: float = 60.0,
        expected_exception: type = Exception,
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout_seconds = recovery_timeout_seconds
        self.expected_exception = expected_exception
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._last_failure_time: float | None = None

    @property
    def state(self) -> CircuitState:
        now = time.monotonic()
        if self._state == CircuitState.OPEN and self._last_failure_time is not None:
            if now - self._last_failure_time >= self.recovery_timeout_seconds:
                self._state = CircuitState.HALF_OPEN
                self._failure_count = 0
                logger.info("Circuit breaker %s: OPEN -> HALF_OPEN (recovery timeout)", self.name)
        return self._state

    def _record_success(self) -> None:
        if self._state == CircuitState.HALF_OPEN:
            self._state = CircuitState.CLOSED
            self._failure_count = 0
            logger.info("Circuit breaker %s: HALF_OPEN -> CLOSED (success)", self.name)
        elif self._state == CircuitState.CLOSED:
            self._failure_count = 0

    def _record_failure(self) -> None:
        self._last_failure_time = time.monotonic()
        self._failure_count += 1
        if self._failure_count >= self.failure_threshold:
            self._state = CircuitState.OPEN
            logger.warning(
                "Circuit breaker %s: OPEN (failures=%s >= threshold=%s)",
                self.name, self._failure_count, self.failure_threshold,
            )
        elif self._state == CircuitState.HALF_OPEN:
            self._state = CircuitState.OPEN
            logger.warning("Circuit breaker %s: HALF_OPEN -> OPEN (failure)", self.name)

    def call(self, func: Callable[..., T], *args: object, **kwargs: object) -> T:
        """Execute func; on expected exception, record failure and re-raise. On success, record success."""
        s = self.state
        if s == CircuitState.OPEN:
            raise RuntimeError(f"Circuit breaker '{self.name}' is OPEN; call rejected")
        try:
            result = func(*args, **kwargs)
            self._record_success()
            return result
        except self.expected_exception as e:
            self._record_failure()
            raise


# Shared instance for hardware bridge calls (locker release, etc.)
_hardware_bridge_breaker: CircuitBreaker | None = None


def get_hardware_bridge_circuit_breaker() -> CircuitBreaker:
    global _hardware_bridge_breaker
    if _hardware_bridge_breaker is None:
        _hardware_bridge_breaker = CircuitBreaker(
            name="hardware_bridge",
            failure_threshold=5,
            recovery_timeout_seconds=60.0,
            expected_exception=Exception,
        )
    return _hardware_bridge_breaker
