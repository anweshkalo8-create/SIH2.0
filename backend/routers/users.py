"""
/api/users — Registration, login (JWT), saved views.
"""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from models.schemas import UserCreate, Token, SavedView
from typing import List

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")


@router.post("/register", status_code=201)
def register(user: UserCreate):
    """
    Create a new user account.
    TODO: check email uniqueness, hash password with bcrypt, insert to DB
    """
    return {"message": "Account created. Please verify your email."}


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    Authenticate with email + password, return a signed JWT.
    TODO: verify credentials, sign JWT with SECRET_KEY from .env
    """
    raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/refresh", response_model=Token)
def refresh_token(token: str = Depends(oauth2_scheme)):
    """Issue a new JWT given a still-valid token."""
    raise HTTPException(status_code=401, detail="Token invalid or expired")


@router.get("/me")
def get_profile(token: str = Depends(oauth2_scheme)):
    """Return the authenticated user's profile."""
    return {}


@router.get("/me/views", response_model=List[SavedView])
def list_saved_views(token: str = Depends(oauth2_scheme)):
    """All saved map views for the current user."""
    return []


@router.post("/me/views", response_model=SavedView, status_code=201)
def save_view(view: SavedView, token: str = Depends(oauth2_scheme)):
    """
    Save a named map view (lat, lon, zoom, depth, variable).
    TODO: insert to DB with user_id from decoded JWT
    """
    return view


@router.delete("/me/views/{view_id}", status_code=204)
def delete_view(view_id: str, token: str = Depends(oauth2_scheme)):
    """
    Delete a saved view.
    TODO: DB delete with ownership check
    """
    return
