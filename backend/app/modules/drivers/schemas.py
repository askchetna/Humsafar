from pydantic import BaseModel


class DriverOnlineSchema(BaseModel):
    lat: float
    lng: float
class CreateDriverProfileSchema(BaseModel):
    vehicle_type: str
    vehicle_number: str
    license_number: str

class UpdateLocationSchema(BaseModel):

    lat: float

    lng: float