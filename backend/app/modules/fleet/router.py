import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user, require_role
from app.modules.fleet.models import Fleet, FleetDriver
from app.modules.fleet.schemas import CreateFleetSchema, AssignDriverSchema
from app.modules.drivers.models import DriverProfile

router = APIRouter()


@router.post("/create")
def create_fleet(
    data: CreateFleetSchema,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):

    fleet = Fleet(
        id=str(uuid.uuid4()),
        name=data.name,
        owner_id=current_user["user_id"],
        description=data.description
    )

    db.add(fleet)
    db.commit()
    db.refresh(fleet)

    return fleet


@router.get("/list")
def list_fleets(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):

    if current_user.get("role") == "admin":
        fleets = db.query(Fleet).filter(Fleet.is_active == True).all()
    else:
        fleets = db.query(Fleet).filter(
            Fleet.owner_id == current_user["user_id"],
            Fleet.is_active == True
        ).all()

    return fleets


@router.post("/{fleet_id}/assign-driver")
def assign_driver(
    fleet_id: str,
    data: AssignDriverSchema,
    db: Session = Depends(get_db),
    current_user=Depends(require_role("admin"))
):

    fleet = db.query(Fleet).filter(Fleet.id == fleet_id).first()

    if not fleet:
        raise HTTPException(status_code=404, detail="Fleet not found")

    driver = db.query(DriverProfile).filter(
        DriverProfile.id == data.driver_id
    ).first()

    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")

    existing = db.query(FleetDriver).filter(
        FleetDriver.fleet_id == fleet_id,
        FleetDriver.driver_id == data.driver_id
    ).first()

    if existing:
        return {"message": "Driver already assigned"}

    assignment = FleetDriver(
        id=str(uuid.uuid4()),
        fleet_id=fleet_id,
        driver_id=data.driver_id
    )

    db.add(assignment)
    db.commit()

    return {"message": "Driver assigned to fleet"}
