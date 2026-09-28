import pytest
from app.core.security import verify_password, get_password_hash, create_access_token, decode_token
from app.models.user import User, UserRole

def test_password_hashing():
    raw_pwd = "SecurePassword123!"
    hashed = get_password_hash(raw_pwd)
    assert hashed != raw_pwd
    assert verify_password(raw_pwd, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_jwt_token_creation_and_decoding():
    user_id = 42
    role = UserRole.TPO_ADMIN
    token = create_access_token(subject=user_id, role=role)
    assert token is not None

    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == str(user_id)
    assert payload["role"] == role

def test_login_endpoint(client, db):
    # Create test user
    email = "test_tpo@placecloud.edu"
    pwd = "TpoTestPassword@123"
    user = User(
        email=email,
        full_name="Test TPO",
        hashed_password=get_password_hash(pwd),
        role=UserRole.TPO_ADMIN,
        is_active=True
    )
    db.add(user)
    db.commit()

    # Valid credentials
    response = client.post("/api/v1/auth/login", json={"email": email, "password": pwd})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["role"] == UserRole.TPO_ADMIN
    assert data["email"] == email

    # Invalid credentials
    bad_res = client.post("/api/v1/auth/login", json={"email": email, "password": "WrongPassword"})
    assert bad_res.status_code == 401
