from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from app.core.settings import settings
from datetime import datetime
from sqlalchemy import DateTime, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

engine = create_async_engine(settings.DATABASE_URL, echo=True)
async_local_session = async_sessionmaker(bind=engine, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class TimestampMixin:
    """Mix in when a table needs a created_at column (server-side default, not app-side)."""
 
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

async def get_db():
    async with async_local_session() as session:
        yield session

async def init_db():
    import app.models
    async with engine.begin() as con:
        await con.run_sync(Base.metadata.create_all)