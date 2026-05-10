from pydantic import BaseModel


class CreateDriverProfileSchema(BaseModel):
    vehicle_type: str
    vehicle_number: str
    license_number: str