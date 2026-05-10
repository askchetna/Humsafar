from pydantic import BaseModel


class CreateRideSchema(BaseModel):
    pickup_location: str
    drop_location: str
