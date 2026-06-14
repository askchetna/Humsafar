import uuid
import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user
from app.middleware.rate_limit import rate_limit

from app.modules.rides.models import Ride
from app.modules.rides.state_machine import can_transition
from app.modules.rides.schemas import (
    CreateRideSchema,
    FareEstimateSchema,
    GeocodeRequestSchema,
    GeocodeResponse,
    FareEstimateResponse,
    RideResponse,
    RideRequestResponse,
    RideStatusResponse
)
from app.modules.rides.service import assign_driver_to_ride
from app.modules.rides.pricing import calculate_fare
from app.modules.notifications.service import create_notification
from app.utils.geocoding import geocode_address
from app.modules.drivers.models import DriverProfile
from app.modules.auth.models import User

from app.websocket.connection_manager import manager

router = APIRouter()


def _build_ride_response(ride: Ride, db: Session) -> dict:
    driver_info = None
    if ride.driver_id:
        driver = db.query(DriverProfile).filter(
            DriverProfile.id == ride.driver_id
        ).first()
        if driver:
            user = db.query(User).filter(User.id == driver.user_id).first()
            driver_info = {
                "id": driver.id,
                "name": user.full_name if user else "Driver",
                "phone": user.phone if user else "",
                "vehicle_type": driver.vehicle_type,
                "vehicle_number": driver.vehicle_number,
                "license_number": driver.license_number,
                "is_online": driver.is_online,
                "current_lat": driver.current_lat,
                "current_lng": driver.current_lng
            }

    return {
        "id": ride.id,
        "rider_id": ride.rider_id,
        "driver_id": ride.driver_id,
        "pickup_location": ride.pickup_location,
        "drop_location": ride.drop_location,
        "pickup_lat": ride.pickup_lat,
        "pickup_lng": ride.pickup_lng,
        "drop_lat": ride.drop_lat,
        "drop_lng": ride.drop_lng,
        "status": ride.status,
        "fare": ride.fare,
        "ride_type": getattr(ride, "ride_type", "standard"),
        "package_description": getattr(ride, "package_description", None),
        "created_at": getattr(ride, "created_at", None),
        "updated_at": getattr(ride, "updated_at", None),
        "driver": driver_info
    }


# =============================================
# GEOCODE
# =============================================
@router.post("/geocode", response_model=GeocodeResponse)
async def geocode_location(data: GeocodeRequestSchema):
    if not settings.GEOCODING_ENABLED:
        raise HTTPException(status_code=503, detail="Geocoding is disabled")

    result = await geocode_address(
        data.query,
        data.near_lat,
        data.near_lng
    )

    if not result:
        raise HTTPException(status_code=404, detail="Address not found")

    return GeocodeResponse(**result)


# =============================================
# FARE ESTIMATE
# =============================================
@router.post("/estimate", response_model=FareEstimateResponse)
def estimate_fare(data: FareEstimateSchema):
    return calculate_fare(
        data.pickup_lat,
        data.pickup_lng,
        data.drop_lat,
        data.drop_lng,
        data.ride_type or "standard"
    )


# =============================================
# REQUEST RIDE
# =============================================
@router.post("/request", response_model=RideRequestResponse, dependencies=[
    Depends(rate_limit(
        "ride_request",
        settings.RATE_LIMIT_RIDE_MAX,
        settings.RATE_LIMIT_RIDE_WINDOW
    ))
])
async def request_ride(
    data: CreateRideSchema,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    fare_value = data.fare
    if fare_value is None and data.drop_lat and data.drop_lng:
        fare_value = calculate_fare(
            data.pickup_lat,
            data.pickup_lng,
            data.drop_lat,
            data.drop_lng,
            data.ride_type or "standard"
        )["fare"]

    ride = Ride(
        id=str(uuid.uuid4()),
        rider_id=current_user["user_id"],
        pickup_location=data.pickup_location,
        drop_location=data.drop_location,
        pickup_lat=data.pickup_lat,
        pickup_lng=data.pickup_lng,
        drop_lat=data.drop_lat,
        drop_lng=data.drop_lng,
        status="searching",
        fare=str(fare_value or 120),
        ride_type=data.ride_type or "standard",
        package_description=data.package_description,
        rejected_drivers=[]
    )

    db.add(ride)
    db.commit()
    db.refresh(ride)

    ride = await assign_driver_to_ride(db, ride)

    create_notification(
        db,
        user_id=current_user["user_id"],
        title="Ride requested",
        message=f"Searching for a driver to {data.drop_location}",
        notification_type="ride"
    )

    db.commit()
    db.refresh(ride)

    return RideRequestResponse(
        message="Ride requested successfully",
        ride_id=ride.id,
        status=ride.status,
        driver_id=ride.driver_id,
        fare=ride.fare
    )


# =============================================
# GET RIDE BY ID
# =============================================
@router.get("/{ride_id}", response_model=RideResponse)
def get_ride(
    ride_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    return _build_ride_response(ride, db)


# =============================================
# MY RIDES (RIDER)
# =============================================
@router.get("/my-rides/list", response_model=list[RideResponse])
def my_rides(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    rides = db.query(Ride).filter(
        Ride.rider_id == current_user["user_id"]
    ).order_by(Ride.id.desc()).all()

    return rides


# =============================================
# DRIVER RIDES
# =============================================
@router.get("/driver-rides/list", response_model=list[RideResponse])
def driver_rides(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    driver = db.query(DriverProfile).filter(
        DriverProfile.user_id == current_user["user_id"]
    ).first()

    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    rides = db.query(Ride).filter(
        Ride.driver_id == driver.id
    ).order_by(Ride.id.desc()).all()

    return rides


# =============================================
# ACCEPT RIDE
# =============================================
@router.post("/accept/{ride_id}", response_model=RideStatusResponse)
async def accept_ride(
    ride_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    driver = db.query(DriverProfile).filter(
        DriverProfile.user_id == current_user["user_id"]
    ).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver profile not found")

    if ride.driver_id and ride.driver_id != driver.id:
        raise HTTPException(
            status_code=403,
            detail="You are not assigned to this ride"
        )

    if not can_transition(ride.status, "accepted"):
        raise HTTPException(status_code=400, detail=f"Cannot accept ride in status: {ride.status}")

    ride.driver_id = driver.id
    ride.status = "accepted"
    db.commit()
    db.refresh(ride)

    asyncio.create_task(
        manager.send_to_rider(
            str(ride.rider_id),
            {
                "type": "ride_accepted",
                "ride_id": ride.id,
                "driver_id": driver.id
            }
        )
    )

    return RideStatusResponse(
        message="Ride accepted",
        ride_id=ride.id,
        status=ride.status,
        driver_id=ride.driver_id
    )


# =============================================
# ARRIVED
# =============================================
@router.post("/arrived/{ride_id}", response_model=RideStatusResponse)
async def arrived_ride(
    ride_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if not can_transition(ride.status, "arrived"):
        raise HTTPException(status_code=400, detail=f"Cannot mark arrived in status: {ride.status}")

    ride.status = "arrived"
    db.commit()
    db.refresh(ride)

    asyncio.create_task(
        manager.send_to_rider(
            str(ride.rider_id),
            {"type": "driver_arrived", "ride_id": ride.id}
        )
    )

    return RideStatusResponse(message="Driver arrived", status=ride.status)


# =============================================
# START RIDE
# =============================================
@router.post("/start/{ride_id}", response_model=RideStatusResponse)
async def start_ride(
    ride_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if not can_transition(ride.status, "started"):
        raise HTTPException(status_code=400, detail=f"Cannot start ride in status: {ride.status}")

    ride.status = "started"
    db.commit()
    db.refresh(ride)

    asyncio.create_task(
        manager.send_to_rider(
            str(ride.rider_id),
            {"type": "ride_started", "ride_id": ride.id}
        )
    )

    return RideStatusResponse(message="Ride started", status=ride.status)


# =============================================
# COMPLETE RIDE
# =============================================
@router.post("/complete/{ride_id}", response_model=RideStatusResponse)
async def complete_ride(
    ride_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if not can_transition(ride.status, "completed"):
        raise HTTPException(status_code=400, detail=f"Cannot complete ride in status: {ride.status}")

    ride.status = "completed"
    db.commit()
    db.refresh(ride)

    create_notification(
        db,
        user_id=str(ride.rider_id),
        title="Ride completed",
        message=f"Your trip is complete. Fare: ₨{ride.fare}",
        notification_type="ride"
    )

    if ride.driver_id:
        driver = db.query(DriverProfile).filter(
            DriverProfile.id == ride.driver_id
        ).first()
        if driver:
            create_notification(
                db,
                user_id=driver.user_id,
                title="Ride completed",
                message=f"Trip completed. Fare: ₨{ride.fare}",
                notification_type="ride"
            )

    asyncio.create_task(
        manager.send_to_rider(
            str(ride.rider_id),
            {
                "type": "ride_completed",
                "ride_id": ride.id,
                "fare": ride.fare
            }
        )
    )

    return RideStatusResponse(
        message="Ride completed",
        status=ride.status,
        fare=ride.fare
    )


# =============================================
# CANCEL RIDE
# =============================================
@router.post("/cancel/{ride_id}", response_model=RideStatusResponse)
async def cancel_ride(
    ride_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

    if not can_transition(ride.status, "cancelled"):
        raise HTTPException(status_code=400, detail=f"Cannot cancel ride in status: {ride.status}")

    ride.status = "cancelled"
    db.commit()
    db.refresh(ride)

    if ride.driver_id:
        asyncio.create_task(
            manager.send_to_driver(
                str(ride.driver_id),
                {"type": "ride_cancelled", "ride_id": ride.id}
            )
        )

    return RideStatusResponse(message="Ride cancelled", status=ride.status)
