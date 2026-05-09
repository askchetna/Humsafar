from fastapi import FastAPI

from app.modules.auth.router import router as auth_router

from app.database.base import Base
from app.database.session import engine

from app.modules.auth.models import User

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Humsafar API"
)

app.include_router(
    auth_router,
    prefix="/api/v1/auth",
    tags=["Auth"]
)

@app.get("/")
def root():
    return {
        "message": "Humsafar Backend Running"
    }