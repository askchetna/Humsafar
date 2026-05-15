import uuid
import json
import asyncio

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user

from app.modules.rides.models import Ride
from app.modules.rides.state_machine import can_transition
from app.modules.rides.schemas import CreateRideSchema
from app.modules.rides.service import assign_driver_to_ride
from app.modules.drivers.models import DriverProfile
from app.modules.auth.models import User

from app.websocket.connection_manager import manager

router = APIRouter()


# =============================================
# REQUEST RIDE
# =============================================
@router.post("/request")
async def request_ride(
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
        drop_lat=data.drop_lat,
        drop_lng=data.drop_lng,
        status="searching",
        fare=str(data.fare or 120),
        rejected_drivers=[]
    )

    db.add(ride)
    db.commit()
    db.refresh(ride)

    ride = await assign_driver_to_ride(db, ride)

    db.commit()
    db.refresh(ride)

    return {
        "message": "Ride requested successfully",
        "ride_id": ride.id,
        "status": ride.status,
        "driver_id": ride.driver_id,
        "fare": ride.fare
    }


# =============================================
# GET RIDE BY ID
# =============================================
@router.get("/{ride_id}")
def get_ride(
    ride_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    ride = db.query(Ride).filter(Ride.id == ride_id).first()

    if not ride:
        raise HTTPException(status_code=404, detail="Ride not found")

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
        "driver": driver_info
    }


# =============================================
# MY RIDES (RIDER)
# =============================================
@router.get("/my-rides/list")
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
@router.get("/driver-rides/list")
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
@router.post("/accept/{ride_id}")
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

    if not can_transition(ride.status, "accepted"):
        raise HTTPException(status_code=400, detail=f"Cannot accept ride in status: {ride.status}")

    ride.driver_id = driver.id
    ride.status = "accepted"
    db.commit()
    db.refresh(ride)

    asyncio.create_task(
        manager.send_to_rider(
            str(ride.rider_id),
            json.dumps({
                "type": "ride_accepted",
                "ride_id": ride.id,
                "driver_id": driver.id
            })
        )
    )

    return {
        "message": "Ride accepted",
        "ride_id": ride.id,
        "status": ride.status,
        "driver_id": ride.driver_id
    }


# =============================================
# ARRIVED
# =============================================
@router.post("/arrived/{ride_id}")
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
            json.dumps({"type": "driver_arrived", "ride_id": ride.id})
        )
    )

    return {"message": "Driver arrived", "status": ride.status}


# =============================================
# START RIDE
# =============================================
@router.post("/start/{ride_id}")
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
            json.dumps({"type": "ride_started", "ride_id": ride.id})
        )
    )

    return {"message": "Ride started", "status": ride.status}


# =============================================
# COMPLETE RIDE
# =============================================
@router.post("/complete/{ride_id}")
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

    asyncio.create_task(
        manager.send_to_rider(
            str(ride.rider_id),
            json.dumps({
                "type": "ride_completed",
                "ride_id": ride.id,
                "fare": ride.fare
            })
        )
    )

    return {"message": "Ride completed", "status": ride.status, "fare": ride.fare}


# =============================================
# CANCEL RIDE
# =============================================
@router.post("/cancel/{ride_id}")
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
                json.dumps({"type": "ride_cancelled", "ride_id": ride.id})
            )
        )

    return {"message": "Ride cancelled", "status": ride.status}
