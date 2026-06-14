from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel, ConfigDict


class CreatePaymentSchema(BaseModel):
    ride_id: str
    method: Optional[str] = "cash"


class CompletePaymentSchema(BaseModel):
    transaction_ref: Optional[str] = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    ride_id: str
    rider_id: str
    amount: float
    currency: str
    status: str
    method: str
    transaction_ref: Optional[str] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
