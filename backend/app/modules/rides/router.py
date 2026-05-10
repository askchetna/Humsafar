import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user

from app.modules.rides.models import Ride

from app.modules.rides.schemas import (
    CreateRideSchema
)

router = APIRouter()


@router.post("/request")
def request_ride(
    data: CreateRideSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    ride = Ride(
        id=str(uuid.uuid4()),
        rider_id=current_user["user_id"],
        pickup_location=data.pickup_location,
        drop_location=data.drop_location,
        status="searching",
        fare="120"
    )

    db.add(ride)

    db.commit()

    db.refresh(ride)

    return {
        "message": "Ride requested successfully",
        "ride_id": ride.id,
        "status": ride.status
    }


@router.get("/my-rides")
def my_rides(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    rides = db.query(
        Ride
    ).filter(
        Ride.rider_id == current_user["user_id"]
    ).all()

    return rides


@router.post("/accept/{ride_id}")
def accept_ride(
    ride_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    ride = db.query(
        Ride
    ).filter(
        Ride.id == ride_id
    ).first()

    if not ride:
        raise HTTPException(
            status_code=404,
            detail="Ride not found"
        )

    if ride.status != "searching":
        raise HTTPException(
            status_code=400,
            detail="Ride already accepted"
        )

    ride.driver_id = current_user["user_id"]

    ride.status = "accepted"

    db.commit()

    return {
        "message": "Ride accepted",
        "ride_id": ride.id,
        "status": ride.status
    }
