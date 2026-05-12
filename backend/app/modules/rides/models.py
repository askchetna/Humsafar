from sqlalchemy import Column, String, Float

from app.database.base import Base


class Ride(Base):

    __tablename__ = "rides"

    id = Column(
        String,
        primary_key=True,
        index=True
    )

    rider_id = Column(String)

    driver_id = Column(
        String,
        nullable=True
    )

    pickup_location = Column(String)

    drop_location = Column(String)

    # GPS COORDINATES
    pickup_lat = Column(
        Float,
        nullable=True
    )

    pickup_lng = Column(
        Float,
        nullable=True
    )

    status = Column(String)

    fare = Column(String)