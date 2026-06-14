from datetime import datetime

from app.modules.drivers.models import DriverProfile
from app.utils.redis_client import cache_driver_location, remove_driver_from_geo


def go_online(db, driver_id, lat, lng):

    driver = db.query(DriverProfile).filter(
        DriverProfile.id == driver_id
    ).first()

    if not driver:
        return None

    driver.is_online = True
    driver.current_lat = lat
    driver.current_lng = lng
    driver.last_seen = datetime.utcnow()

    db.commit()
    db.refresh(driver)

    cache_driver_location(driver.id, lat, lng)

    return driver


def go_offline(db, driver_id):

    driver = db.query(DriverProfile).filter(
        DriverProfile.id == driver_id
    ).first()

    if not driver:
        return None

    driver.is_online = False

    db.commit()
    db.refresh(driver)

    remove_driver_from_geo(driver.id)

    return driver