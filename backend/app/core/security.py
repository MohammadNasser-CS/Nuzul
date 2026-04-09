from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.database import get_auth_client, get_db

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


async def get_current_user(
    payload: dict = Depends(verify_supabase_token),
) -> dict:
    """
    Returns the user_profile row for the authenticated user.
    Auto-creates the profile on first login (idempotent).
    Raises 401 if token is bad (handled by verify_supabase_token).
    """
    db = get_db()
    supabase_user_id = payload["id"]
    email = payload["email"]

    result = db.table("user_profiles").select("*").eq(
        "supabase_user_id", supabase_user_id
    ).execute()

    if result.data:
        return result.data[0]

    # First-time: auto-create minimal profile
    insert_result = db.table("user_profiles").insert({
        "supabase_user_id": supabase_user_id,
        "email": email,
    }).execute()

    return insert_result.data[0]


async def require_complete_profile(
    user: dict = Depends(get_current_user),
) -> dict:
    """
    Blocks access if the user hasn't completed their base profile.
    Requires: full_name, phone_number, role.
    """
    if not user.get("role") or not user.get("full_name") or not user.get("phone_number"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must complete your profile first.",
        )
    return user


async def require_student_profile(
    user: dict = Depends(require_complete_profile),
) -> dict:
    """
    Blocks access if the user is not a STUDENT or hasn't completed their student profile.
    """
    if user.get("role") != "STUDENT":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This resource is only accessible to students.",
        )

    db = get_db()
    student = db.table("student_profiles").select(
        "id").eq("user_id", user["id"]).execute()

    if not student.data:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must complete your student profile first.",
        )

    return user
