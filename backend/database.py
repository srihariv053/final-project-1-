import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session

# Default to SQLite file in backend directory; easily swappable with postgresql:// in DATABASE_URL
DB_DIR = os.path.dirname(os.path.abspath(__file__))

# On Vercel serverless lambdas, the root filesystem is read-only; /tmp is writable
if os.environ.get("VERCEL"):
    import shutil
    tmp_db = "/tmp/dineflow.db"
    src_db = os.path.join(DB_DIR, "dineflow.db")
    if not os.path.exists(tmp_db) and os.path.exists(src_db):
        try:
            shutil.copyfile(src_db, tmp_db)
        except Exception:
            pass
    DEFAULT_DB_PATH = tmp_db
else:
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
