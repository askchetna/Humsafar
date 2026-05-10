from datetime import datetime

from app.modules.drivers.models import DriverProfile


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

    return driver