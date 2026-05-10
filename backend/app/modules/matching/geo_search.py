from app.modules.drivers.models import DriverProfile

def get_nearby_drivers(db):
    return db.query(DriverProfile).filter(
        DriverProfile.is_online == True,
        DriverProfile.is_approved == True
    ).all()
