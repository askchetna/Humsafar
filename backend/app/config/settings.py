from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):

    APP_NAME: str = "Humsafar"
    DATABASE_URL: str = "sqlite:///./humsafar.db"

    JWT_SECRET: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    REDIS_URL: str = "redis://localhost:6379/0"
    REDIS_ENABLED: bool = False

    CORS_ORIGINS: str = "http://localhost:5000,http://127.0.0.1:5000"

    DRIVER_SEARCH_RADIUS_KM: float = 15.0

    RATE_LIMIT_LOGIN_MAX: int = 10
    RATE_LIMIT_LOGIN_WINDOW: int = 60
    RATE_LIMIT_RIDE_MAX: int = 20
    RATE_LIMIT_RIDE_WINDOW: int = 60

    GEOCODING_ENABLED: bool = True

    class Config:
        env_file = ".env"

    @property
    def cors_origins_list(self) -> List[str]:
        return [
            origin.strip()
            for origin in self.CORS_ORIGINS.split(",")
            if origin.strip()
        ]


settings = Settings()
