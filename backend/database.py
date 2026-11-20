import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session

# Default to SQLite file in backend directory; easily swappable with postgresql:// in DATABASE_URL
DB_DIR = os.path.dirname(os.path.abspath(__file__))
DEFAULT_DB_PATH = os.path.join(DB_DIR, "dineflow.db")
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)
SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    from . import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
