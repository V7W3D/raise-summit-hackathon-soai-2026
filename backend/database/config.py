import os
from pathlib import Path

from dotenv import load_dotenv

_BACKEND_DIR = Path(__file__).resolve().parent.parent

load_dotenv(_BACKEND_DIR / ".env")

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./data/raise_summit.db")

# Ensure SQLite parent directory exists (db file is gitignored).
if DATABASE_URL.startswith("sqlite"):
	_relative_path = DATABASE_URL.removeprefix("sqlite:///")
	if _relative_path not in {":memory:", ""}:
		db_path = Path(_relative_path)
		if not db_path.is_absolute():
			db_path = _BACKEND_DIR / db_path
		if db_path.suffix == ".db":
			db_path.parent.mkdir(parents=True, exist_ok=True)
