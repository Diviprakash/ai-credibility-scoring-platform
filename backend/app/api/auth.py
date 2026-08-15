from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    TokenResponse,
    UserLoginRequest,
    UserRegisterRequest,
    UserResponse,
)

router = APIRouter()


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user (CONDUCTOR or CANDIDATE)",
)
def register(
    req: UserRegisterRequest,
    db: Session = Depends(get_db),
) -> UserResponse:
    """Register a new user with email, hashed password, full name, and selected role."""
    # Check if a user with the normalized email already exists
    existing_user = db.query(User).filter(User.email == req.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # Hash the password securely with bcrypt
    hashed_password = get_password_hash(req.password)

    # Create and persist the new User entity
    new_user = User(
        full_name=req.full_name,
        email=req.email,
        hashed_password=hashed_password,
        role=req.role,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse.model_validate(new_user)


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Authenticate a user and return a JWT access token",
)
def login(
    req: UserLoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    """Validate credentials and issue a signed JWT containing the user ID and role."""
    user = db.query(User).filter(User.email == req.email).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Issue JWT token with user UUID and assigned role
    access_token = create_access_token(
        subject=str(user.id),
        role=user.role.value,
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Retrieve current authenticated user profile",
)
def get_me(
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    """Return the profile of the currently authenticated user without sensitive data."""
    return UserResponse.model_validate(current_user)
