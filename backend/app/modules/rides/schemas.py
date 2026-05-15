from pydantic import BaseModel
from typing import Optional


class CreateRideSchema(BaseModel):
    pickup_location: str
    drop_location: str
    pickup_lat: float
    pickup_lng: float
    drop_lat: Optional[float] = None
    drop_lng: Optional[float] = None
    fare: Optional[float] = None
