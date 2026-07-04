from __future__ import annotations

_LOGO_COLORS = ("#475569", "#0ea5e9", "#16a34a", "#6366f1", "#f43f5e", "#2563eb", "#7c5cf0")


def lead_initials(name: str) -> str:
	parts = name.split()
	if len(parts) >= 2:
		return f"{parts[0][0]}{parts[1][0]}".upper()
	return name[:2].upper()


def lead_logo_color(name: str) -> str:
	return _LOGO_COLORS[sum(ord(char) for char in name) % len(_LOGO_COLORS)]
