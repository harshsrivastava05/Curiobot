import os
from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    PROJECT_NAME: str = "CurioBot"
    API_V1_STR: str = "/api/v1"
    
    DATABASE_URL: str
    GEMINI_API_KEY: str
    PINECONE_API_KEY: str
    PINECONE_ENV: str
    GOOGLE_APPLICATION_CREDENTIALS: str
    REDIS_URL: str
    GOOGLE_CLIENT_ID: str # Changed from CLERK_ISSUER_URL
    PROJECT_ID: str
    BUCKET_NAME: str

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
