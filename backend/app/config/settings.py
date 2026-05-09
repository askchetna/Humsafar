from pydantic_settings import BaseSettings


class Settings(BaseSettings):

    APP_NAME: str
    DATABASE_URL: str

    JWT_SECRET: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int

    REDIS_URL: str

    class Config:
        env_file = ".env"


settings = Settings()