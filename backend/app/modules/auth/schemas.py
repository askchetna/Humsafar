
from pydantic import BaseModel


class RegisterRequest(BaseModel):
    full_name: str
    phone: str
    password: str
    role: str = "rider"


class SendOTPRequest(BaseModel):
    phone: str


class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class LoginSchema(BaseModel):
    phone: str
    password: str