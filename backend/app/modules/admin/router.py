from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.dependencies.database import get_db
from app.dependencies.auth import require_role
from app.modules.auth.models import User
from app.modules.drivers.models import DriverProfile
from app.modules.rides.models import Ride
from app.modules.payments.models import Payment

router = APIRouter()


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):

    total_users = db.query(User).count()
    total_drivers = db.query(DriverProfile).count()
    online_drivers = db.query(DriverProfile).filter(
        DriverProfile.is_online == True
    ).count()

    rides_by_status = dict(
        db.query(Ride.status, func.count(Ride.id))
        .group_by(Ride.status)
        .all()
    )

    total_revenue = db.query(
        func.sum(Payment.amount)
    ).filter(Payment.status == "completed").scalar() or 0

    return {
        "total_users": total_users,
        "total_drivers": total_drivers,
        "online_drivers": online_drivers,
        "rides_by_status": rides_by_status,
        "total_revenue": float(total_revenue),
        "total_rides": db.query(Ride).count()
    }


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):

    users = db.query(User).order_by(User.phone).limit(100).all()

    return [
        {
            "id": u.id,
            "phone": u.phone,
            "full_name": u.full_name,
            "role": u.role,
            "is_verified": u.is_verified
        }
        for u in users
    ]


@router.get("/rides")
def list_all_rides(
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):

    rides = db.query(Ride).order_by(Ride.created_at.desc()).limit(100).all()
    return rides


@router.get("/drivers/pending")
def pending_drivers(
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):

    drivers = db.query(DriverProfile).filter(
        DriverProfile.is_approved == False
    ).all()

    result = []
    for d in drivers:
        user = db.query(User).filter(User.id == d.user_id).first()
        result.append({
            "id": d.id,
            "user_id": d.user_id,
            "name": user.full_name if user else "Unknown",
            "phone": user.phone if user else "",
            "vehicle_type": d.vehicle_type,
            "license_number": d.license_number
        })

    return result


@router.post("/drivers/{driver_id}/approve")
def approve_driver(
    driver_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):

    driver = db.query(DriverProfile).filter(
        DriverProfile.id == driver_id
    ).first()

    if not driver:
        return {"error": "Driver not found"}

    driver.is_approved = True
    db.commit()

    return {"message": "Driver approved"}


@router.post("/drivers/{driver_id}/reject")
def reject_driver(
    driver_id: str,
    db: Session = Depends(get_db),
    _admin=Depends(require_role("admin"))
):

    driver = db.query(DriverProfile).filter(
        DriverProfile.id == driver_id
    ).first()

    if not driver:
        return {"error": "Driver not found"}

    driver.is_approved = False
    driver.is_online = False
    db.commit()

    return {"message": "Driver rejected"}
