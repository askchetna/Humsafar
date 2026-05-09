from sqlalchemy import Column, String, Boolean
from app.database.base import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)

    phone = Column(String, unique=True, nullable=False)

    full_name = Column(String)
    role = Column(String, default="rider")

    password = Column(String)

    is_verified = Column(Boolean, default=False)
