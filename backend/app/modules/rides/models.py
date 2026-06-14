from sqlalchemy import Column, String, Float, JSON, DateTime
from datetime import datetime
from app.database.base import Base


class Ride(Base):
    __tablename__ = "rides"

    id = Column(String, primary_key=True, index=True)
    rider_id = Column(String, index=True)
    driver_id = Column(String, nullable=True, index=True)
    pickup_location = Column(String)
    drop_location = Column(String)
    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    drop_lat = Column(Float, nullable=True)
    drop_lng = Column(Float, nullable=True)
    status = Column(String, index=True)
    fare = Column(String)
    ride_type = Column(String, default="standard")
    package_description = Column(String, nullable=True)
    rejected_drivers = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
