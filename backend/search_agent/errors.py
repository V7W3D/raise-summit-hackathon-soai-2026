"""Search agent configuration errors."""


class ProviderNotConfiguredError(LookupError):
	"""Raised when a search provider or its credentials are not configured."""
