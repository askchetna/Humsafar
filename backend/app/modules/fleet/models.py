import uuid
from datetime import datetime

from sqlalchemy import Column, String, Boolean, DateTime, Integer
from app.database.base import Base


class Fleet(Base):
    __tablename__ = "fleets"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    owner_id = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class FleetDriver(Base):
    __tablename__ = "fleet_drivers"

    id = Column(String, primary_key=True, index=True)
    fleet_id = Column(String, nullable=False, index=True)
    driver_id = Column(String, nullable=False, index=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
