from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.database import get_auth_client

bearer_scheme = HTTPBearer()


async def verify_supabase_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Verify a Supabase JWT by calling Supabase Auth directly.
    Returns the user payload dict.
    Raises 401 if token is invalid or expired.
    """
    token = credentials.credentials
    try:
        auth_client = get_auth_client()
        response = auth_client.auth.get_user(token)

        if response.user is None:
            raise ValueError("Invalid token")

        return {
            "id": response.user.id,
            "email": response.user.email,
            "user_metadata": response.user.user_metadata,
            "app_metadata": response.user.app_metadata,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(
    payload: dict = Depends(verify_supabase_token),
) -> str:
    """Shortcut dependency — returns just the Supabase user UUID."""
    return payload["id"]
