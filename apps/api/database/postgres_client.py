import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from dotenv import load_dotenv

load_dotenv()

# Motor de base de datos
engine = None
SessionLocal = None


def init_db_engine():
    """Inicializa el motor de SQLAlchemy."""
    global engine, SessionLocal
    
    database_url = os.getenv(
        "DATABASE_URL",
        "postgresql://anclora_user:anclora_pass_dev@localhost:5432/anclora_rag"
    )
    
    engine = create_engine(database_url, pool_pre_ping=True)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Session:
    """
    Dependency para FastAPI que proporciona una sesión de base de datos.
    
    Uso:
        @app.get("/endpoint")
        def endpoint(db: Session = Depends(get_db)):
            ...
    """
    if SessionLocal is None:
        init_db_engine()
    
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session() -> Session:
    """
    Obtiene una sesión de base de datos para uso directo (fuera de FastAPI).
    
    IMPORTANTE: Debe cerrarse manualmente con session.close()
    """
    if SessionLocal is None:
        init_db_engine()
    
    return SessionLocal()
