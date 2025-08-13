from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi_jwt_auth import AuthJWT
from schemas.auth import RegisterModel, LoginModel, TokenPair, AccessToken
from fastapi import Body
from database.models import User
from database.connections import get_db
from passlib.hash import bcrypt
from fastapi_jwt_auth.exceptions import AuthJWTException
from fastapi_jwt_auth.exceptions import JWTDecodeError


router = APIRouter()

@router.post("/register")
def register(user: RegisterModel, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user.email).first():
        return JSONResponse({'message':'User already exists'} ,status_code=401)
    hashed_password = bcrypt.hash(user.password)
    new_user = User(first_name = user.firstName, last_name = user.lastName, email=user.email, password=hashed_password)
    db.add(new_user)
    db.commit()
    return {"message": "User registered successfully"}

@router.post("/login", response_model=TokenPair)
def login(user: LoginModel, db: Session = Depends(get_db), Authorize: AuthJWT = Depends()):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not bcrypt.verify(user.password, db_user.password):
        return JSONResponse({'message':'Invalid Credentials!!'} ,status_code=401)
    access_token = Authorize.create_access_token(subject=db_user.email)
    refresh_token = Authorize.create_refresh_token(subject=db_user.email)
    return {"access": access_token, "refresh":refresh_token}

@router.post("/login/refresh", response_model=AccessToken)
def refresh(refresh: str = Body(..., embed=True), Authorize: AuthJWT = Depends()):
    try:
        Authorize._token = refresh
        Authorize.jwt_refresh_token_required()
        current_user = Authorize.get_jwt_subject()
        new_access = Authorize.create_access_token(subject=current_user)
        return {"access": new_access}
    except JWTDecodeError:
        return JSONResponse({"message": "Refresh token expired"}, status_code=401)

@router.get("/me")
def get_me(Authorize: AuthJWT = Depends(), db: Session = Depends(get_db)):
    try:
        Authorize.jwt_required()
    except AuthJWTException:
        return JSONResponse({'message':'Token Expired'} ,status_code=401)
    username = Authorize.get_jwt_subject()
    user = db.query(User).filter(User.email == username).first()
    return {"username": user.first_name}
