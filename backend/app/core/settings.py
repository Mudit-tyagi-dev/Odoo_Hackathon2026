from pydantic_settings import BaseSettings
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[2]

class Settings(BaseSettings):
    #  async pg
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_URL: str

    #  Auth
    JWT_SECRET: str
    JWT_ALGORITHM: str
    JWT_EXPIRY_DAYS: int
    FRONTEND_URL: str = "http://localhost:5173"


    class Config:
        env_file = BASE_DIR / ".env"
        env_file_encoding= "utf-8"
        extra= "ignore"
     
settings = Settings()
