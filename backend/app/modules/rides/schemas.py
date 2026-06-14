from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field


class CreateRideSchema(BaseModel):
    pickup_location: str
    drop_location: str
    pickup_lat: float
    pickup_lng: float
    drop_lat: Optional[float] = None
    drop_lng: Optional[float] = None
    fare: Optional[float] = None
    ride_type: Optional[str] = "standard"
    package_description: Optional[str] = None


class FareEstimateSchema(BaseModel):
    pickup_lat: float
    pickup_lng: float
    drop_lat: float
    drop_lng: float
    ride_type: Optional[str] = "standard"


class GeocodeRequestSchema(BaseModel):
    query: str = Field(..., min_length=2, max_length=200)
    near_lat: Optional[float] = None
    near_lng: Optional[float] = None


class GeocodeResponse(BaseModel):
    lat: float
    lng: float
    display_name: str


class FareEstimateResponse(BaseModel):
    fare: float
    distance_km: float
    ride_type: str
    currency: str


class DriverInfoResponse(BaseModel):
    id: str
    name: str
    phone: str
    vehicle_type: str
    vehicle_number: Optional[str] = None
    license_number: Optional[str] = None
    is_online: bool
    current_lat: Optional[float] = None
    current_lng: Optional[float] = None


class RideResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    rider_id: str
    driver_id: Optional[str] = None
    pickup_location: str
    drop_location: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    drop_lat: Optional[float] = None
    drop_lng: Optional[float] = None
    status: str
    fare: Optional[str] = None
    ride_type: Optional[str] = "standard"
    package_description: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    driver: Optional[DriverInfoResponse] = None


class RideRequestResponse(BaseModel):
    message: str
    ride_id: str
    status: str
    driver_id: Optional[str] = None
    fare: Optional[str] = None


class RideStatusResponse(BaseModel):
    message: str
    status: str
    ride_id: Optional[str] = None
    driver_id: Optional[str] = None
    fare: Optional[str] = None
