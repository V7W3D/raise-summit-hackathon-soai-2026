"""In-memory live progress for running mission searches.

The search agent runs in a background thread inside the same process, so a
module-level registry is enough to stream counters to the polling frontend.
The final snapshot is kept after completion so the verdict screen can show
"scanned N pages in Xs" without persisting anything.
"""

from __future__ import annotations

import threading
import time
from typing import Any

_lock = threading.Lock()
_progress: dict[int, dict[str, Any]] = {}

_COUNTER_FIELDS = (
	"queries_planned",
	"queries_run",
	"results_found",
	"pages_fetched",
	"emails_found",
	"phones_found",
	"candidates_built",
	"duplicates_removed",
	"leads_scored",
	"shortlisted",
	"rejected",
)


def _empty(phase: str = "idle") -> dict[str, Any]:
	entry: dict[str, Any] = {field: 0 for field in _COUNTER_FIELDS}
	entry["phase"] = phase
	entry["elapsed_ms"] = 0
	return entry


def start_progress(mission_id: int) -> None:
	with _lock:
		entry = _empty(phase="planning")
		entry["_started_at"] = time.monotonic()
		_progress[mission_id] = entry


def update_progress(mission_id: int, **fields: Any) -> None:
	with _lock:
		entry = _progress.get(mission_id)
		if entry is None:
			return
		entry.update(fields)


def finish_progress(mission_id: int, *, failed: bool = False) -> None:
	with _lock:
		entry = _progress.get(mission_id)
		if entry is None:
			return
		entry["phase"] = "failed" if failed else "done"
		started = entry.pop("_started_at", None)
		if started is not None:
			entry["elapsed_ms"] = int((time.monotonic() - started) * 1000)


def get_progress(mission_id: int) -> dict[str, Any]:
	with _lock:
		entry = _progress.get(mission_id)
		if entry is None:
			return _empty()
		snapshot = dict(entry)
	started = snapshot.pop("_started_at", None)
	if started is not None:
		snapshot["elapsed_ms"] = int((time.monotonic() - started) * 1000)
	return snapshot
