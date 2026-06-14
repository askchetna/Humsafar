import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user

from app.modules.drivers.schemas import DriverOnlineSchema
from app.modules.drivers.schemas import (UpdateLocationSchema)
from app.modules.drivers.service import go_online, go_offline
from app.modules.auth.models import User
from app.modules.drivers.models import DriverProfile
from app.modules.drivers.schemas import (
    CreateDriverProfileSchema
)

router = APIRouter()


@router.post("/create-profile")
def create_driver_profile(
    data: CreateDriverProfileSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    existing_profile = db.query(
        DriverProfile
    ).filter(
        DriverProfile.user_id == current_user["user_id"]
    ).first()

    if existing_profile:
        raise HTTPException(
            status_code=400,
            detail="Driver profile already exists"
        )

    profile = DriverProfile(
        id=str(uuid.uuid4()),
        user_id=current_user["user_id"],
        license_number=data.license_number,
        vehicle_type=data.vehicle_type,
        vehicle_number=data.vehicle_number
    )

    db.add(profile)

    db.commit()

    db.refresh(profile)

    return {
        "message": "Driver profile created",
        "driver_profile_id": profile.id
    }


@router.get("/me")
def get_driver_profile(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    profile = db.query(
        DriverProfile
    ).filter(
        DriverProfile.user_id == current_user["user_id"]
    ).first()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Driver profile not found"
        )

    return {
        "id": profile.id,
        "license_number": profile.license_number,
        "vehicle_type": profile.vehicle_type,
        "is_online": profile.is_online
    }

@router.post("/go-online/{driver_id}")
def driver_online(
    driver_id: str,
    payload: DriverOnlineSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    profile = db.query(DriverProfile).filter(
        DriverProfile.id == driver_id
    ).first()

    if not profile or profile.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to go online for this driver"
        )

    driver = go_online(
        db,
        driver_id,
        payload.lat,
        payload.lng
    )

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    return {
        "message": "Driver online"
    }


@router.post("/go-offline/{driver_id}")
def driver_offline(
    driver_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    profile = db.query(DriverProfile).filter(
        DriverProfile.id == driver_id
    ).first()

    if not profile or profile.user_id != current_user["user_id"]:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to go offline for this driver"
        )

    driver = go_offline(db, driver_id)

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver not found"
        )

    return {
        "message": "Driver offline"
    }

@router.post("/update-location")
def update_location(
    data: UpdateLocationSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    driver = db.query(
        DriverProfile
    ).filter(
        DriverProfile.user_id ==
        current_user["user_id"]
    ).first()

    if not driver:
        raise HTTPException(
            status_code=404,
            detail="Driver profile not found"
        )

    driver.current_lat = data.lat

    driver.current_lng = data.lng

    from app.utils.redis_client import cache_driver_location
    cache_driver_location(driver.id, data.lat, data.lng)

    db.commit()

    db.refresh(driver)

    return {
        "message": "Location updated",
        "lat": driver.current_lat,
        "lng": driver.current_lng
    }