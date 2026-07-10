import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import app as app_module
from database import db


def test_note_creation_rejects_oversized_payload():
    app_module.app.config["TESTING"] = True
    app_module.rate_limit_events.clear()
    with app_module.app.app_context():
        db.session.remove()
        db.drop_all()
        db.create_all()

    client = app_module.app.test_client()
    with client.session_transaction() as session_state:
        session_state[app_module.CSRF_SESSION_KEY] = "test-csrf-token"

    response = client.post(
        "/auth/register",
        json={
            "name": "Note Tester",
            "email": "note-tester@example.com",
            "password": "password123",
        },
        headers={app_module.CSRF_HEADER_NAME: "test-csrf-token"},
    )
    assert response.status_code == 200

    long_content = "x" * (app_module.NOTE_CONTENT_MAX_CHARS + 100)
    response = client.post(
        "/api/notes",
        json={"title": "Bad", "content": long_content, "topic": "Physics"},
        headers={app_module.CSRF_HEADER_NAME: "test-csrf-token"},
    )

    payload = response.get_json()
    assert response.status_code == 413
    assert payload["success"] is False
    assert "too long" in payload["message"].lower()
