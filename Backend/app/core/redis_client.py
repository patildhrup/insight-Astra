import os
import redis
from pathlib import Path
from dotenv import load_dotenv

# Robustly find .env
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

REDIS_URL = os.getenv("REDIS_URL")
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD", None)

def get_redis_client():
    """Returns a standalone Redis client, supporting URL or Host/Port."""
    if REDIS_URL:
        # Use from_url for easy SSL/auth support (rediss:// for SSL)
        return redis.Redis.from_url(
            REDIS_URL,
            decode_responses=True,
            socket_timeout=5,
            retry_on_timeout=True
        )
    
    # Fallback to Host/Port/DB/Password
    # Note: If password is empty string but defined, it might cause issues on some servers.
    # Better to pass None if empty string.
    password = REDIS_PASSWORD if REDIS_PASSWORD and REDIS_PASSWORD.strip() else None
    
    return redis.Redis(
        host=REDIS_HOST,
        port=REDIS_PORT,
        db=REDIS_DB,
        password=password,
        decode_responses=True,
        socket_timeout=5,
        retry_on_timeout=True
    )

# Global client singleton
try:
    redis_client = get_redis_client()
    # Test connection lazily (don't block but log if it fails)
    # We don't ping here because it might block app startup if Redis is down
except Exception as e:
    print(f"[REDIS ERROR] Failed to initialize client: {e}")
    redis_client = None
