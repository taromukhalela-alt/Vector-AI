import json

import auth as auth_module
import app as app_module


def test_auth_pages_load(monkeypatch, tmp_path):
    users_file = tmp_path / "users.json"
    users_file.write_text("{}", encoding="utf-8")
    monkeypatch.setattr(auth_module, "USERS_FILE", str(users_file))
    monkeypatch.setattr(app_module, "USERS_FILE", str(users_file))

    client = app_module.app.test_client()

    login_response = client.get("/auth/login")
    register_response = client.get("/auth/register")

    assert login_response.status_code == 200
    assert register_response.status_code == 200


def test_notes_page_requires_authenticated_session(monkeypatch, tmp_path):
    users_file = tmp_path / "users.json"
    users_file.write_text("{}", encoding="utf-8")
    monkeypatch.setattr(auth_module, "USERS_FILE", str(users_file))
    monkeypatch.setattr(app_module, "USERS_FILE", str(users_file))

    client = app_module.app.test_client()
    response = client.get("/notes", follow_redirects=False)

    assert response.status_code == 302


def test_register_sets_session_and_redirect(monkeypatch, tmp_path):
    users_file = tmp_path / "users.json"
    users_file.write_text("{}", encoding="utf-8")
    monkeypatch.setattr(auth_module, "USERS_FILE", str(users_file))
    monkeypatch.setattr(app_module, "USERS_FILE", str(users_file))

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

    saved_users = json.loads(users_file.read_text(encoding="utf-8"))
    assert any(user.get("email") == "demo@example.com" for user in saved_users.values())

    with client.session_transaction() as session_state:
        assert session_state["user"].startswith("user_")
        assert session_state["chat_id"]
        assert "history" not in session_state
