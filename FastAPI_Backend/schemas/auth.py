from pydantic import BaseModel

class RegisterModel(BaseModel):
    firstName: str
    lastName: str
    password: str
    email: str

class LoginModel(BaseModel):
    email: str
    password: str

class TokenPair(BaseModel):
    access: str
    refresh: str

class AccessToken(BaseModel):
    access: str

class RefreshTokenModel(BaseModel):
    refresh: str
