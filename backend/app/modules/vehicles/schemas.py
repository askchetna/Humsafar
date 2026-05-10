from pydantic import BaseModel


class CreateVehicleSchema(BaseModel):
    vehicle_type: str
    vehicle_name: str
    vehicle_number: str
    vehicle_color: str