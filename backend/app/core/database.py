from supabase import create_client, Client
from app.core.config import get_settings
import logging

logger = logging.getLogger(__name__)

settings = get_settings()

_service_client: Client = None
_anon_client: Client = None


def get_db() -> Client:
    """
    Service-role Supabase client — for all DB operations in the backend.
    Bypasses Row Level Security. Never use in frontend.
    """
    global _service_client
    if _service_client is None:
        _service_client = create_client(
            settings.supabase_url,
            settings.supabase_service_role_key,
        )
        logger.info("Supabase service-role client initialized")
    return _service_client


def get_auth_client() -> Client:
    """
    Fresh anon-key client — used only for auth token verification.
    A new instance every call so sessions never bleed into the service client.
    """
    return create_client(
        settings.supabase_url,
        settings.supabase_anon_key,
    )
