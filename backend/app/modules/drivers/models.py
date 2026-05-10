from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class DriverProfile(Base):
    __tablename__ = "driver_profiles"

    id = Column(
        String,
        primary_key=True,
        index=True
    )

    user_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False
    )

    vehicle_type = Column(
        String,
        nullable=False
    )

    vehicle_number = Column(String)

    license_number = Column(
        String,
        nullable=False
    )

    is_approved = Column(
        Boolean,
        default=False
    )

    is_online = Column(
        Boolean,
        default=False
    )

    vehicles = relationship(
        "Vehicle",
        back_populates="driver"
    )