from pydantic import BaseModel


class CreateRideSchema(BaseModel):
    pickup_location: str
    drop_location: str
    pickup_lat: float
    pickup_lng: float
