from pydantic import BaseModel
from fastapi_jwt_auth import AuthJWT
from datetime import timedelta

class Settings(BaseModel):
    authjwt_secret_key: str = "django-insecure-y7=u^_)5l49vor4xq)9!7uum7(^x7vc(#zua9fehp+bl4_zs!4"

    authjwt_access_token_expires: timedelta = timedelta(minutes=20)

    authjwt_refresh_token_expires: timedelta = timedelta(days=7)

@AuthJWT.load_config
def get_config():
    return Settings()
