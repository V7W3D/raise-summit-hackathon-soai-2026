"""Small deterministic helpers shared across the search agent."""

import unicodedata
import uuid
from datetime import datetime, timezone

from .schemas import SearchTraceEvent


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


def normalize_text(text: str) -> str:
    """Lowercase and strip accents so 'Rhône' matches 'rhone'."""
    decomposed = unicodedata.normalize("NFKD", text.lower())
    return "".join(c for c in decomposed if not unicodedata.combining(c))


class TraceRecorder:
    """Collects trace events explaining what the agent did."""

    def __init__(self) -> None:
        self.events: list[SearchTraceEvent] = []

    def add(self, step: str, message: str, metadata: dict | None = None) -> None:
        self.events.append(
            SearchTraceEvent(
                timestamp=now_iso(), step=step, message=message, metadata=metadata
            )
        )
