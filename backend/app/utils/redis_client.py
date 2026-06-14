import logging

logger = logging.getLogger(__name__)

_redis_client = None


def get_redis():
    global _redis_client

    from app.config.settings import settings

    if not settings.REDIS_ENABLED:
        return None

    if _redis_client is None:
        try:
            import redis
            _redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)
            _redis_client.ping()
            logger.info("Redis connected")
        except Exception as exc:
            logger.warning("Redis unavailable: %s", exc)
            _redis_client = None

    return _redis_client


def cache_driver_location(driver_id: str, lat: float, lng: float):
    client = get_redis()
    if not client:
        return

    client.geoadd("drivers:locations", (lng, lat, driver_id))
    client.hset(f"driver:{driver_id}", mapping={"lat": lat, "lng": lng})


def remove_driver_from_geo(driver_id: str):
    client = get_redis()
    if not client:
        return

    try:
        client.zrem("drivers:locations", driver_id)
        client.delete(f"driver:{driver_id}")
    except Exception as exc:
        logger.warning("Redis remove driver failed: %s", exc)


def get_redis_nearby_driver_ids(lat: float, lng: float, radius_km: float):
    client = get_redis()
    if not client:
        return None

    try:
        return client.georadius(
            "drivers:locations",
            lng,
            lat,
            radius_km,
            unit="km"
        )
    except Exception:
        return None
