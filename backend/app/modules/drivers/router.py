import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user

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
        vehicle_type=data.vehicle_type
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