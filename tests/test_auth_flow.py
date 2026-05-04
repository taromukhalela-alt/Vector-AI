import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest

import app as app_module
from database import User, db


@pytest.fixture(autouse=True)
def isolated_database():
    app_module.app.config["TESTING"] = True
    with app_module.app.app_context():
        db.session.remove()
        db.drop_all()
        db.create_all()
    yield
    with app_module.app.app_context():
        db.session.remove()
        db.drop_all()


def test_auth_pages_load():
    client = app_module.app.test_client()

    login_response = client.get("/auth/login")
    register_response = client.get("/auth/register")

    assert login_response.status_code == 200
    assert register_response.status_code == 200


def test_notes_page_requires_authenticated_session():
    client = app_module.app.test_client()
    response = client.get("/notes", follow_redirects=False)

    assert response.status_code == 302
    assert "/auth/login" in response.headers["Location"]


def test_register_sets_session_and_redirect():
    client = app_module.app.test_client()
    response = client.post(
        "/auth/register",
        json={
            "name": "Demo Learner",
            "email": "demo@example.com",
            "password": "password123",
        },
    )

    payload = response.get_json()
    assert response.status_code == 200
    assert payload["success"] is True
    assert payload["redirect"] == "/chat"

    with app_module.app.app_context():
        saved_user = User.query.filter_by(email="demo@example.com").first()
        assert saved_user is not None
        assert saved_user.name == "Demo Learner"
        assert saved_user.provider == "local"

    with client.session_transaction() as session_state:
        assert session_state["user"].startswith("user_")
        assert session_state["chat_id"]
        assert "history" not in session_state


def test_chat_strips_markdown_headings_for_normal_replies(monkeypatch):
    client = app_module.app.test_client()
    client.post(
        "/auth/register",
        json={
            "name": "Demo Learner",
            "email": "chat-clean@example.com",
            "password": "password123",
        },
    )

    monkeypatch.setattr(
        app_module,
        "generate_response",
        lambda *args, **kwargs: "## Electricity\n\nCurrent is the rate of flow of charge.",
    )

    response = client.post("/chat", json={"message": "electricity", "history": []})
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["reply"].startswith("Electricity")
    assert "##" not in payload["reply"]


def test_chat_keeps_document_headings_when_requested(monkeypatch):
    client = app_module.app.test_client()
    client.post(
        "/auth/register",
        json={
            "name": "Demo Learner",
            "email": "document-mode@example.com",
            "password": "password123",
        },
    )

    monkeypatch.setattr(
        app_module,
        "generate_response",
        lambda *args, **kwargs: "# Test Paper\n\n## Instructions\nAnswer all questions.",
    )

    response = client.post(
        "/chat",
        json={
            "message": "generate an exam paper",
            "history": [],
            "response_format": "document",
        },
    )
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["reply"].startswith("# Test Paper")
    assert "## Instructions" in payload["reply"]
