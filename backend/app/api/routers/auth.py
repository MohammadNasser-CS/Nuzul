from fastapi import APIRouter, Depends, HTTPException, status
from app.core.database import get_db
from app.core.security import verify_supabase_token, get_current_user_id

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(
    payload: dict = Depends(verify_supabase_token),
):
    """
    Called once after Supabase signup.
    Creates a matching row in our own users table.
    """
    db = get_db()
    supabase_id = payload["id"]
    email = payload["email"]

    # Idempotent — return existing user if already registered
    existing = db.table("users").select(
        "*").eq("supabase_id", supabase_id).execute()
    if existing.data:
        return existing.data[0]

    result = db.table("users").insert({
        "supabase_id": supabase_id,
        "email": email,
        "role": "student",
        "is_active": True,
    }).execute()

    return result.data[0]


@router.get("/me")
async def get_me(
    user_id: str = Depends(get_current_user_id),
):
    """Return the currently authenticated user's profile."""
    db = get_db()
    result = db.table("users").select("*").eq("supabase_id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found.")
    return result.data[0]


@router.patch("/me")
async def update_me(
    data: dict,
    user_id: str = Depends(get_current_user_id),
):
    """Update the currently authenticated user's profile."""
    db = get_db()

    allowed = {"full_name", "avatar_url"}
    update_data = {k: v for k, v in data.items() if k in allowed}

    result = db.table("users").update(update_data).eq(
        "supabase_id", user_id).execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="User not found.")
    return result.data[0]
