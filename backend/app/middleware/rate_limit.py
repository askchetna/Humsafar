import logging
from collections import defaultdict
from time import time

from fastapi import Request, HTTPException

logger = logging.getLogger(__name__)

_buckets: dict[str, list[float]] = defaultdict(list)


def _client_key(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def rate_limit(key: str, max_calls: int, window_seconds: int):
    """Dependency factory for per-IP rate limiting."""

    async def dependency(request: Request):
        bucket_key = f"{key}:{_client_key(request)}"
        now = time()
        window_start = now - window_seconds

        _buckets[bucket_key] = [
            ts for ts in _buckets[bucket_key] if ts > window_start
        ]

        if len(_buckets[bucket_key]) >= max_calls:
            logger.warning("Rate limit exceeded: %s", bucket_key)
            raise HTTPException(
                status_code=429,
                detail="Too many requests. Please try again later."
            )

        _buckets[bucket_key].append(now)

    return dependency
