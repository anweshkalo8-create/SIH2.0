from typing import Dict, List
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Query, status
from passlib.context import CryptContext

from models.schemas import SavedView, Token, UserCreate


router = APIRouter(
    prefix="/users",
    tags=["users"],
)


# ── Password hashing ──────────────────────────────────────────────────────────

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


# ── Development-only storage ──────────────────────────────────────────────────
# Replace this with PostgreSQL/SQLAlchemy before production deployment.

USERS: Dict[str, dict] = {}
SAVED_VIEWS: Dict[str, List[SavedView]] = {}


# ── Response helper ───────────────────────────────────────────────────────────

def user_response(user: dict) -> dict:
    """
    Return only public user information.
    Never return the stored password hash.
    """

    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "organization": user.get("organization"),
    }


# ── Register ──────────────────────────────────────────────────────────────────

@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
)
def register_user(payload: UserCreate):
    """
    Register a development user.

    Passwords are hashed before being stored.
    """

    email = payload.email.strip().lower()

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required",
        )

    existing_user = next(
        (
            user
            for user in USERS.values()
            if user["email"].lower() == email
        ),
        None,
    )

    if existing_user is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists",
        )

    user_id = str(uuid4())

    password_hash = pwd_context.hash(
        payload.password
    )

    USERS[user_id] = {
        "id": user_id,
        "email": email,
        "name": payload.name.strip(),
        "organization": payload.organization,
        "password_hash": password_hash,
    }

    SAVED_VIEWS[user_id] = []

    return user_response(
        USERS[user_id]
    )


# ── Login ─────────────────────────────────────────────────────────────────────

@router.post(
    "/login",
    response_model=Token,
)
def login_user(payload: UserCreate):
    """
    Development login endpoint.

    Passwords are verified against their stored bcrypt hash.

    Production authentication should use a proper
    JWT-based authentication flow.
    """

    email = payload.email.strip().lower()

    user = next(
        (
            user
            for user in USERS.values()
            if user["email"].lower() == email
        ),
        None,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not pwd_context.verify(
        payload.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    # Development token only.
    # Replace with a signed JWT in production.
    return Token(
        access_token=user["id"],
        token_type="bearer",
    )


# ── Current user ──────────────────────────────────────────────────────────────

@router.get("/me")
def get_current_user(
    user_id: str = Query(...),
):
    """
    Return a development user by ID.

    Production version should obtain the user
    from a validated JWT instead of accepting
    the user ID directly.
    """

    user = USERS.get(user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user_response(user)


# ── Saved views ───────────────────────────────────────────────────────────────

@router.get(
    "/{user_id}/views",
    response_model=List[SavedView],
)
def list_saved_views(
    user_id: str,
):
    """
    Return all saved views belonging to a user.
    """

    if user_id not in USERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return SAVED_VIEWS.get(
        user_id,
        [],
    )


# ── Create saved view ─────────────────────────────────────────────────────────

@router.post(
    "/{user_id}/views",
    response_model=SavedView,
    status_code=status.HTTP_201_CREATED,
)
def create_saved_view(
    user_id: str,
    payload: SavedView,
):
    """
    Create a saved map view for a user.
    """

    if user_id not in USERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    view = payload.model_copy(
        update={
            "view_id": str(uuid4())
        }
    )

    SAVED_VIEWS.setdefault(
        user_id,
        [],
    ).append(view)

    return view
