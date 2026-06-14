import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, Float, ForeignKey
from app.database.base import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, index=True)
    ride_id = Column(String, ForeignKey("rides.id"), nullable=False, index=True)
    rider_id = Column(String, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    currency = Column(String, default="PKR")
    status = Column(String, default="pending")
    method = Column(String, default="cash")
    transaction_ref = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
