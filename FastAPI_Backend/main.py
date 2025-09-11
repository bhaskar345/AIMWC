from fastapi import FastAPI
from routes import auth, journal
from database.connections import Base, engine
from fastapi.middleware.cors import CORSMiddleware
from core import config
from fastapi_jwt_auth.exceptions import AuthJWTException
from fastapi.responses import JSONResponse

# Create DB tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mental Wellness Companion")

@app.exception_handler(AuthJWTException)
def authjwt_exception_handler(request, exc):
    return JSONResponse(
        status_code=401,
        content={"message": "Token Expired"}
    )

# Allowed origins (you can add more if needed)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173"
]

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # allow these origins
    allow_credentials=True,
    allow_methods=["*"],              # allow all HTTP methods
    allow_headers=["*"],              # allow all HTTP headers
)

# Register routers
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(journal.router, prefix="/journal", tags=["Journal"])

@app.on_event("startup")
def startup_event():
    print("🚀 App started successfully!")
