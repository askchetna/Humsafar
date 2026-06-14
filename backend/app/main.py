from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.logging_config  # noqa: F401 — configure logging on startup
from app.config.settings import settings
from app.database.base import Base
from app.database.session import engine

from app.modules.auth.router import router as auth_router
from app.modules.drivers.router import router as driver_router
from app.modules.vehicles.router import router as vehicle_router
from app.modules.rides.router import router as ride_router
from app.modules.admin.router import router as admin_router
from app.modules.payments.router import router as payment_router
from app.modules.notifications.router import router as notification_router
from app.modules.fleet.router import router as fleet_router

from app.websocket.driver_socket import router as driver_socket_router
from app.websocket.ride_socket import router as ride_socket_router

from app.modules.auth.models import User
from app.modules.drivers.models import DriverProfile
from app.modules.vehicles.models import Vehicle
from app.modules.rides.models import Ride
from app.modules.payments.models import Payment
from app.modules.notifications.models import Notification
from app.modules.fleet.models import Fleet, FleetDriver
from app.database.migrate import run_sqlite_migrations


Base.metadata.create_all(bind=engine)
run_sqlite_migrations()

app = FastAPI(title="Humsafar API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(driver_router, prefix="/api/v1/drivers", tags=["Drivers"])
app.include_router(vehicle_router, prefix="/api/v1/vehicles", tags=["Vehicles"])
app.include_router(ride_router, prefix="/api/v1/rides", tags=["Rides"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])
app.include_router(payment_router, prefix="/api/v1/payments", tags=["Payments"])
app.include_router(notification_router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(fleet_router, prefix="/api/v1/fleet", tags=["Fleet"])

app.include_router(driver_socket_router)
app.include_router(ride_socket_router)


@app.get("/")
def root():
    return {"message": "Humsafar Backend Running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok"}
