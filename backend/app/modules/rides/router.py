import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user

from app.modules.rides.models import Ride
from app.modules.rides.schemas import (
    CreateRideSchema
)

from app.modules.rides.service import (
    assign_driver_to_ride
)

from app.modules.drivers.models import (
    DriverProfile
)

router = APIRouter()


# REQUEST RIDE
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

        pickup_lat=data.pickup_lat,
        pickup_lng=data.pickup_lng,

        status="searching",

        fare="120"
    )

    db.add(ride)

    db.commit()

    db.refresh(ride)

    # AUTO DRIVER ASSIGNMENT
    ride = assign_driver_to_ride(db, ride)

    db.commit()

    db.refresh(ride)

    return {
        "message": "Ride requested successfully",
        "ride_id": ride.id,
        "status": ride.status,
        "driver_id": ride.driver_id
    }


# MY RIDES
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


# DRIVER RIDES
@router.get("/driver-rides")
def driver_rides(
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

    rides = db.query(
        Ride
    ).filter(
        Ride.driver_id == driver.id
    ).all()

    return rides


# ACCEPT RIDE
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

    ride.driver_id = driver.id

    ride.status = "accepted"

    db.commit()

    db.refresh(ride)

    return {
        "message": "Ride accepted",
        "ride_id": ride.id,
        "status": ride.status,
        "driver_id": ride.driver_id
    }


# START RIDE
@router.post("/start/{ride_id}")
def start_ride(
    ride_id: str,
    db: Session = Depends(get_db)
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

    ride.status = "started"

    db.commit()

    db.refresh(ride)

    return {
        "message": "Ride started",
        "status": ride.status
    }


# COMPLETE RIDE
@router.post("/complete/{ride_id}")
def complete_ride(
    ride_id: str,
    db: Session = Depends(get_db)
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

    ride.status = "completed"

    db.commit()

    db.refresh(ride)

    return {
        "message": "Ride completed",
        "status": ride.status
    }