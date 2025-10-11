from datetime import datetime
from typing import Optional
from uuid import UUID

from psycopg2.extras import RealDictCursor

from apps.api.database.postgres_client import get_db_connection, fetch_one


def create_user(*, email: str, password_hash: str, first_name: str, last_name: str, role: str) -> dict:
    query = """
        INSERT INTO app_users (email, password_hash, first_name, last_name, role)
        VALUES (%s, %s, %s, %s, %s)
        RETURNING id, email, first_name, last_name, role, is_active, created_at, updated_at;
    """
    with get_db_connection() as conn:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(query, (email, password_hash, first_name, last_name, role))
            return cur.fetchone()


def get_user_by_email(email: str) -> Optional[dict]:
    query = """
        SELECT id, email, password_hash, first_name, last_name, role, is_active, created_at, updated_at
        FROM app_users
        WHERE email = %s
    """
    return fetch_one(query, (email,))


def get_user_by_id(user_id: UUID) -> Optional[dict]:
    query = """
        SELECT id, email, first_name, last_name, role, is_active, created_at, updated_at
        FROM app_users
        WHERE id = %s
    """
    return fetch_one(query, (str(user_id),))


def touch_user_login(user_id: UUID) -> None:
    query = "UPDATE app_users SET updated_at = %s WHERE id = %s"
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (datetime.utcnow(), str(user_id)))


def record_social_account(*, user_id: UUID, provider: str, provider_account_id: str) -> None:
    query = """
        INSERT INTO user_social_accounts (user_id, provider, provider_account_id)
        VALUES (%s, %s, %s)
        ON CONFLICT (provider, provider_account_id) DO NOTHING;
    """
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(query, (str(user_id), provider, provider_account_id))

def has_admin_user() -> bool:
    query = "SELECT 1 FROM app_users WHERE role = 'admin' LIMIT 1"
    return fetch_one(query) is not None
