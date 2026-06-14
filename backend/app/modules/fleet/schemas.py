from pydantic import BaseModel
from typing import Optional


class CreateFleetSchema(BaseModel):
    name: str
    description: Optional[str] = None


class AssignDriverSchema(BaseModel):
    driver_id: str
