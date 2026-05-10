from sqlalchemy import Column, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(
        String,
        primary_key=True,
        index=True
    )

    driver_profile_id = Column(
        String,
        ForeignKey("driver_profiles.id"),
        nullable=False
    )

    vehicle_type = Column(
        String,
        nullable=False
    )

    vehicle_name = Column(
        String,
        nullable=False
    )

    vehicle_number = Column(
        String,
        unique=True,
        nullable=False
    )

    vehicle_color = Column(String)

    is_active = Column(
        Boolean,
        default=True
    )

    driver = relationship(
        "DriverProfile",
        back_populates="vehicles"
    )