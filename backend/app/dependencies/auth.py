from fastapi import (
    Depends,
    HTTPException,
    WebSocket
)

from fastapi.security import HTTPBearer
from fastapi.security.http import HTTPAuthorizationCredentials

from app.core.security import decode_access_token


security = HTTPBearer()


async def authenticate_websocket(
    websocket: WebSocket,
    token: str | None
) -> dict | None:

    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return None

    payload = decode_access_token(token)

    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return None

    return payload


def get_current_user(

    credentials: HTTPAuthorizationCredentials = Depends(security)

):

    token = credentials.credentials

    payload = decode_access_token(token)

    if not payload:

        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

    return payload


def require_role(required_role: str):

    def role_checker(
        current_user=Depends(get_current_user)
    ):
        if current_user.get("role") != required_role:
            raise HTTPException(
                status_code=403,
                detail=f"Requires {required_role} role"
            )
        return current_user

    return role_checker
