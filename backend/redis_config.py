import redis
from backend.config import settings

# Connect to Redis using REDIS_URL
redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

# Test Redis connection
try:
    if redis_client.ping():
        print("✅ Redis connected successfully!")
except redis.exceptions.ConnectionError as e:
    print(f"❌ Redis connection failed: {e}")
