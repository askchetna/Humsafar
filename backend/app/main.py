from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.base import Base
from app.database.session import engine

# ROUTERS
from app.modules.auth.router import router as auth_router
from app.modules.drivers.router import router as driver_router
from app.modules.vehicles.router import router as vehicle_router
from app.modules.rides.router import router as ride_router

# WEBSOCKETS
from app.websocket.driver_socket import router as driver_socket_router
from app.websocket.ride_socket import router as ride_socket_router

# MODELS — ensure all are registered before create_all
from app.modules.auth.models import User
from app.modules.drivers.models import DriverProfile
from app.modules.vehicles.models import Vehicle
from app.modules.rides.models import Ride


Base.metadata.create_all(bind=engine)


app = FastAPI(title="Humsafar API", version="1.0.0")


# CORS — allow all origins for dev; tighten in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# AUTH
app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])

# DRIVERS
app.include_router(driver_router, prefix="/api/v1/drivers", tags=["Drivers"])

# VEHICLES
app.include_router(vehicle_router, prefix="/api/v1/vehicles", tags=["Vehicles"])

# RIDES
app.include_router(ride_router, prefix="/api/v1/rides", tags=["Rides"])

# WEBSOCKETS
app.include_router(driver_socket_router)
app.include_router(ride_socket_router)


@app.get("/")
def root():
    return {"message": "Humsafar Backend Running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
