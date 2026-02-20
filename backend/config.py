import os
import sys
from dotenv import load_dotenv

load_dotenv()

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
SECRET_KEY = os.environ.get("SECRET_KEY")

if not MONGO_URL:
    sys.exit("FATAL: MONGO_URL environment variable is not set.")
if not DB_NAME:
    sys.exit("FATAL: DB_NAME environment variable is not set.")
if not SECRET_KEY:
    sys.exit("FATAL: SECRET_KEY environment variable is not set. Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(48))\"")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7
