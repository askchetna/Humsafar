from sqlalchemy import Column, String, ForeignKey

from app.database.base import Base


class Ride(Base):
    __tablename__ = "rides"

    id = Column(String, primary_key=True, index=True)

    rider_id = Column(
        String,
        ForeignKey("users.id"),
        nullable=False
    )

    driver_id = Column(
        String,
        nullable=True
    )

    pickup_location = Column(String)

    drop_location = Column(String)

    status = Column(
        String,
        default="searching"
    )

    fare = Column(String, default="0")
