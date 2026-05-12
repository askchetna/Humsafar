from fastapi import FastAPI

from app.database.base import Base
from app.database.session import engine

from app.modules.auth.router import router as auth_router
from app.modules.drivers.router import router as driver_router
from app.modules.vehicles.router import router as vehicle_router
from app.modules.rides.router import router as ride_router
from app.websocket.driver_socket import (
    router as driver_socket_router
)

from app.websocket.ride_socket import (
    router as ride_socket_router
)
# IMPORTANT MODEL IMPORTS
from app.modules.auth.models import User
from app.modules.drivers.models import DriverProfile
from app.modules.vehicles.models import Vehicle
from app.modules.rides.models import Ride

Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Humsafar API"
)

app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["Auth"]
)

app.include_router(
    driver_router,
    prefix="/api/v1/drivers",
    tags=["Drivers"]
)

app.include_router(
    vehicle_router,
    prefix="/api/v1/vehicles",
    tags=["Vehicles"]
)

app.include_router(
    ride_router,
    prefix="/api/v1/rides",
    tags=["Rides"]
)

app.include_router(driver_socket_router)

app.include_router(ride_socket_router)
@app.get("/")
def root():
    return {
        "message": "Humsafar Backend Running"
    }
    