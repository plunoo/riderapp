import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent

# Load the .env that lives next to this file so it works regardless of where
# uvicorn is started from.
load_dotenv(BASE_DIR / ".env")

# Require an explicit DATABASE_URL; don't fall back to a test DB in prod.
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Please configure it in the environment.")
JWT_SECRET = os.getenv("JWT_SECRET", "CHANGE_ME")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

# Dev bootstrap settings (can be disabled in prod)
AUTO_SEED_ADMIN = os.getenv("AUTO_SEED_ADMIN", "true").lower() == "true"
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin123")
ADMIN_NAME = os.getenv("ADMIN_NAME", "System Admin")

# Prime admin (highest privileges)
PRIME_ADMIN_USERNAME = os.getenv("PRIME_ADMIN_USERNAME", "primeadmin")
PRIME_ADMIN_PASSWORD = os.getenv("PRIME_ADMIN_PASSWORD", "primepass123")
PRIME_ADMIN_NAME = os.getenv("PRIME_ADMIN_NAME", "Prime Admin")
