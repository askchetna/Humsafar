import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user

from app.modules.drivers.models import DriverProfile
from app.modules.vehicles.models import Vehicle
from app.modules.vehicles.schemas import (
    CreateVehicleSchema
)

router = APIRouter()


@router.post("/add")
def add_vehicle(
    data: CreateVehicleSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    driver_profile = db.query(
        DriverProfile
    ).filter(
        DriverProfile.user_id == current_user["user_id"]
    ).first()

    if not driver_profile:
        raise HTTPException(
            status_code=404,
            detail="Driver profile not found"
        )

    existing_vehicle = db.query(
        Vehicle
    ).filter(
        Vehicle.vehicle_number == data.vehicle_number
    ).first()

    if existing_vehicle:
        raise HTTPException(
            status_code=400,
            detail="Vehicle already exists"
        )

    vehicle = Vehicle(
        id=str(uuid.uuid4()),
        driver_profile_id=driver_profile.id,
        vehicle_type=data.vehicle_type,
        vehicle_name=data.vehicle_name,
        vehicle_number=data.vehicle_number,
        vehicle_color=data.vehicle_color
    )

    db.add(vehicle)

    db.commit()

    db.refresh(vehicle)

    return {
        "message": "Vehicle added successfully",
        "vehicle_id": vehicle.id
    }


@router.get("/my-vehicles")
def get_my_vehicles(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    driver_profile = db.query(
        DriverProfile
    ).filter(
        DriverProfile.user_id == current_user["user_id"]
    ).first()

    vehicles = db.query(
        Vehicle
    ).filter(
        Vehicle.driver_profile_id == driver_profile.id
    ).all()

    return vehicles