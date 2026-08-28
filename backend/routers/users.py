from typing import Dict, List
from uuid import uuid4

from fastapi import APIRouter, HTTPException, status

from models.schemas import SavedView, Token, UserCreate, UserResponse


router = APIRouter(prefix="/users", tags=["users"])


# Development-only in-memory storage.
# Replace with a database before production deployment.

USERS: Dict[str, dict] = {}
SAVED_VIEWS: Dict[str, List[SavedView]] = {}


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(payload: UserCreate):
    """
    Register a development user.

    Password storage must be replaced with a secure password
    hashing/database implementation before production.
    """

    existing_user = next(
        (
            user
            for user in USERS.values()
            if user["email"].lower() == payload.email.lower()
        ),
        None,
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="A user with this email already exists",
        )

    user_id = str(uuid4())

    USERS[user_id] = {
        "id": user_id,
        "email": payload.email,
        "name": payload.name,
        "organization": payload.organization,
        "password": payload.password,
    }

    SAVED_VIEWS[user_id] = []

    return UserResponse(
        id=user_id,
        email=payload.email,
        name=payload.name,
        organization=payload.organization,
    )


@router.post("/login", response_model=Token)
def login_user(payload: UserCreate):
    """
    Development login endpoint.

    Replace with JWT + password hashing for production.
    """

    user = next(
        (
            user
            for user in USERS.values()
            if user["email"].lower() == payload.email.lower()
        ),
        None,
    )

    if user is None or user["password"] != payload.password:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )

    return Token(
        access_token=user["id"],
        token_type="bearer",
    )


@router.get("/me", response_model=UserResponse)
def get_current_user(user_id: str):
    """
    Return a development user by ID.

    Production version should read the user from a validated JWT.
    """

    user = USERS.get(user_id)

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        organization=user["organization"],
    )


@router.get(
    "/{user_id}/views",
    response_model=List[SavedView],
)
def list_saved_views(user_id: str):
    if user_id not in USERS:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return SAVED_VIEWS.get(user_id, [])


@router.post(
    "/{user_id}/views",
    response_model=SavedView,
    status_code=status.HTTP_201_CREATED,
)
def create_saved_view(
    user_id: str,
    payload: SavedView,
):
    if user_id not in USERS:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    view = payload.model_copy(
        update={"view_id": str(uuid4())}
    )

    SAVED_VIEWS.setdefault(user_id, []).append(view)

    return view
