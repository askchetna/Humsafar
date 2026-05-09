import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.dependencies.database import get_db
from app.dependencies.auth import get_current_user

from app.modules.auth.models import User

from app.modules.auth.schemas import (
    RegisterRequest,
    LoginSchema
)

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)

router = APIRouter()


@router.get("/")
def auth_test():

    return {
        "auth": "working"
    }

@router.get("/me")
def get_me(

    current_user = Depends(get_current_user)

):

    return {
        "user": current_user
    }

@router.post("/register")
def register_user(
    data: RegisterRequest,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        User.phone == data.phone
    ).first()

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Phone already registered"
        )

    user = User(
        id=str(uuid.uuid4()),
        full_name=data.full_name,
        phone=data.phone,
        password=hash_password(data.password),
        role=data.role
    )

    db.add(user)

    db.commit()

    db.refresh(user)

    return {
        "message": "User registered successfully",
        "user_id": user.id
    }


@router.post("/login")
def login_user(
    data: LoginSchema,
    db: Session = Depends(get_db)
):

    user = db.query(User).filter(
        User.phone == data.phone
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not verify_password(
        data.password,
        user.password
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    token = create_access_token(
        data={
            "user_id": str(user.id),
            "phone": user.phone,
            "role": user.role
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }