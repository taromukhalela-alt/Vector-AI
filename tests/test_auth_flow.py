import os

os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest

import app as app_module
from database import User, db


@pytest.fixture(autouse=True)
def isolated_database():
    app_module.app.config["TESTING"] = True
    app_module.rate_limit_events.clear()
    with app_module.app.app_context():
        db.session.remove()
        db.drop_all()
        db.create_all()
    yield
    with app_module.app.app_context():
        db.session.remove()
        db.drop_all()


def csrf_headers(client):
    with client.session_transaction() as session_state:
        token = session_state.setdefault(app_module.CSRF_SESSION_KEY, "test-csrf-token")
    return {app_module.CSRF_HEADER_NAME: token}


def register_demo_user(client, email="demo@example.com"):
    return client.post(
        "/auth/register",
        json={
            "name": "Demo Learner",
            "email": email,
            "password": "password123",
        },
        headers=csrf_headers(client),
    )


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
    response = register_demo_user(client)

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
    register_demo_user(client, "chat-clean@example.com")

    monkeypatch.setattr(
        app_module,
        "generate_response",
        lambda *args, **kwargs: "## Electricity\n\nCurrent is the rate of flow of charge.",
    )

    response = client.post(
        "/chat",
        json={"message": "electricity", "history": []},
        headers=csrf_headers(client),
    )
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["reply"].startswith("Electricity")
    assert "##" not in payload["reply"]


def test_chat_keeps_document_headings_when_requested(monkeypatch):
    client = app_module.app.test_client()
    register_demo_user(client, "document-mode@example.com")

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
        headers=csrf_headers(client),
    )
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["reply"].startswith("# Test Paper")
    assert "## Instructions" in payload["reply"]


def test_voice_chat_uses_short_spoken_response_limit(monkeypatch):
    client = app_module.app.test_client()
    register_demo_user(client, "voice-short@example.com")
    monkeypatch.setattr(app_module, "VOICE_MAX_OUTPUT_CHARS", 180)
    monkeypatch.setattr(
        app_module,
        "generate_response",
        lambda *args, **kwargs: "This is a spoken explanation. " * 50,
    )

    response = client.post(
        "/chat",
        json={"message": "explain waves", "history": [], "voice_mode": True},
        headers=csrf_headers(client),
    )
    payload = response.get_json()

    assert response.status_code == 200
    assert len(payload["reply"]) <= 180
    assert "Response shortened" in payload["reply"]


def test_mutating_requests_require_csrf():
    client = app_module.app.test_client()
    response = client.post(
        "/auth/register",
        json={
            "name": "Demo Learner",
            "email": "missing-csrf@example.com",
            "password": "password123",
        },
    )

    payload = response.get_json()
    assert response.status_code == 403
    assert "CSRF" in payload["message"]


def test_chat_requires_authenticated_session():
    client = app_module.app.test_client()
    response = client.post(
        "/chat",
        json={"message": "electricity", "history": []},
        headers=csrf_headers(client),
    )

    payload = response.get_json()
    assert response.status_code == 401
    assert payload["message"] == "Authentication required"


def test_dashboard_api_requires_authenticated_session():
    client = app_module.app.test_client()
    response = client.get("/api/dashboard")

    payload = response.get_json()
    assert response.status_code == 401
    assert payload["message"] == "Authentication required"


def test_simulation_api_requires_authenticated_session():
    client = app_module.app.test_client()
    response = client.post(
        "/api/simulate",
        json={"v0": 10, "angle": 45, "mass": 1, "drag": 0},
        headers=csrf_headers(client),
    )

    payload = response.get_json()
    assert response.status_code == 401
    assert payload["message"] == "Authentication required"


def test_dashboard_api_returns_real_empty_metrics_for_authenticated_user():
    client = app_module.app.test_client()
    register_demo_user(client, "dashboard@example.com")

    response = client.get("/api/dashboard")
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["stats"]["questions_asked"] == 0
    assert payload["stats"]["active_simulations"] == 0
    assert payload["charts"]["line"] == [0.0] * 12
    assert payload["charts"]["bar"] == [0] * 8


def test_chat_rate_limit_is_enforced(monkeypatch):
    client = app_module.app.test_client()
    register_demo_user(client, "rate-limit@example.com")
    monkeypatch.setattr(app_module, "CHAT_RATE_LIMIT_COUNT", 1)
    monkeypatch.setattr(
        app_module,
        "generate_response",
        lambda *args, **kwargs: "Current is the rate of flow of charge.",
    )

    first = client.post(
        "/chat",
        json={"message": "electricity", "history": []},
        headers=csrf_headers(client),
    )
    second = client.post(
        "/chat",
        json={"message": "waves", "history": []},
        headers=csrf_headers(client),
    )

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.get_json()["retry_after"] > 0


def test_exam_generation_rate_limit_is_enforced(monkeypatch):
    client = app_module.app.test_client()
    register_demo_user(client, "exam-rate-limit@example.com")
    monkeypatch.setattr(app_module, "CHAT_RATE_LIMIT_COUNT", 20)
    monkeypatch.setattr(app_module, "EXAM_RATE_LIMIT_COUNT", 1)
    monkeypatch.setattr(
        app_module,
        "generate_response",
        lambda *args, **kwargs: "# Test Paper\n\n## Instructions\nAnswer all questions.",
    )

    payload = {
        "message": "generate an exam paper on electricity",
        "history": [],
        "response_format": "document",
        "generation_type": "exam",
    }
    first = client.post("/chat", json=payload, headers=csrf_headers(client))
    second = client.post("/chat", json=payload, headers=csrf_headers(client))

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.get_json()["message"].startswith("Too many requests")


def test_tts_rejects_oversized_input():
    client = app_module.app.test_client()
    register_demo_user(client, "tts-limit@example.com")

    response = client.post(
        "/api/tts",
        json={"text": "x" * (app_module.TTS_MAX_INPUT_CHARS + 1)},
        headers=csrf_headers(client),
    )

    assert response.status_code == 413


def test_tts_uses_free_tier_friendly_elevenlabs_model(monkeypatch):
    client = app_module.app.test_client()
    register_demo_user(client, "tts-model@example.com")
    captured_payload = {}

    class FakeElevenLabsResponse:
        status_code = 200
        text = ""

        def iter_content(self, chunk_size=1024):
            yield b"audio"

    def fake_post(_url, json, **_kwargs):
        captured_payload.update(json)
        return FakeElevenLabsResponse()

    monkeypatch.setenv("ELEVENLABS_API_KEY", "test-key")
    monkeypatch.setattr(app_module.requests, "post", fake_post)

    response = client.post(
        "/api/tts",
        json={"text": "Hello learner"},
        headers=csrf_headers(client),
    )

    assert response.status_code == 200
    assert captured_payload["model_id"] == "eleven_flash_v2_5"


def test_tts_supports_camb_ai_provider(monkeypatch):
    client = app_module.app.test_client()
    register_demo_user(client, "tts-camb@example.com")
    captured = {}

    class FakeCambResponse:
        status_code = 200
        text = ""

        def iter_content(self, chunk_size=1024):
            yield b"audio"

    def fake_post(url, json, headers, **_kwargs):
        captured["url"] = url
        captured["json"] = json
        captured["headers"] = headers
        return FakeCambResponse()

    monkeypatch.setenv("CAMB_API_KEY", "test-key")
    monkeypatch.setattr(app_module.requests, "post", fake_post)

    response = client.post(
        "/api/tts",
        json={"text": "Hello learner", "provider": "camb", "voice_id": "147320"},
        headers=csrf_headers(client),
    )

    assert response.status_code == 200
    assert captured["url"] == "https://client.camb.ai/apis/tts-stream"
    assert captured["headers"]["x-api-key"] == "test-key"
    assert captured["json"]["voice_id"] == 147320
    assert captured["json"]["language"] == "en-us"
    assert captured["json"]["speech_model"] == "mars-8.1-flash-beta"


def test_ai_note_metadata_endpoint(monkeypatch):
    client = app_module.app.test_client()
    register_demo_user(client, "metadata@example.com")
    monkeypatch.setattr(
        app_module,
        "generate_response",
        lambda *args, **kwargs: '{"title":"Ohm Law Notes","topic":"Electricity","tags":["ohm","circuits","current"]}',
    )

    response = client.post(
        "/api/notes/ai",
        json={
            "action": "metadata",
            "content": "Ohm's law links voltage, current, and resistance.",
        },
        headers=csrf_headers(client),
    )
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["metadata"]["topic"] == "Electricity"
    assert "ohm" in payload["metadata"]["tags"]


def test_semantic_note_search_finds_related_note():
    client = app_module.app.test_client()
    register_demo_user(client, "semantic@example.com")
    created = client.post(
        "/api/notes",
        json={
            "title": "Ohm Law",
            "topic": "Electricity",
            "tags": ["Voltage", "<script>alert(1)</script>", "circuits"],
            "content": "Current, potential difference, and resistance are linked in a circuit.",
        },
        headers=csrf_headers(client),
    )
    created_payload = created.get_json()
    assert created_payload["note"]["tags"] == ["voltage", "scriptalert1/script", "circuits"]

    response = client.post(
        "/api/notes/search",
        json={"query": "voltage in circuits"},
        headers=csrf_headers(client),
    )
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["count"] == 1
    assert payload["notes"][0]["title"] == "Ohm Law"


def test_adaptive_practice_endpoint(monkeypatch):
    client = app_module.app.test_client()
    register_demo_user(client, "practice@example.com")
    monkeypatch.setattr(
        app_module,
        "generate_response",
        lambda *args, **kwargs: '{"focus_areas":["waves"],"questions":[{"topic":"Waves","question":"A wave has frequency 5 Hz. Explain what frequency means.","marks":3,"skill":"concept"}]}',
    )

    response = client.post(
        "/api/practice/adaptive",
        json={"topics": ["waves"]},
        headers=csrf_headers(client),
    )
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["focus_areas"] == ["waves"]
    assert payload["questions"][0]["topic"] == "Waves"


def test_answer_check_endpoint(monkeypatch):
    client = app_module.app.test_client()
    register_demo_user(client, "answer-check@example.com")
    monkeypatch.setattr(
        app_module,
        "generate_response",
        lambda *args, **kwargs: '{"score":2,"max_score":3,"strengths":["Correct formula"],"corrections":["Add units"],"next_step":"Revise SI units."}',
    )

    response = client.post(
        "/api/answer/check",
        json={
            "question": "Calculate force when mass is 2 kg and acceleration is 3 m/s^2.",
            "working": "F = ma = 2 x 3 = 6",
        },
        headers=csrf_headers(client),
    )
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["assessment"]["score"] == 2
    assert "Add units" in payload["assessment"]["corrections"]


def test_ai_animation_match_fallback(monkeypatch):
    client = app_module.app.test_client()
    register_demo_user(client, "anim-ai@example.com")
    monkeypatch.setattr(
        app_module,
        "classify_intent",
        lambda _question: ("unknown", 20.0),
    )
    monkeypatch.setattr(
        app_module,
        "generate_response",
        lambda *args, **kwargs: '{"animation_id":"waves","reason":"The question is about oscillations."}',
    )

    response = client.post(
        "/match-animation",
        json={"question": "show me the thing that wiggles through space"},
        headers=csrf_headers(client),
    )
    payload = response.get_json()

    assert response.status_code == 200
    assert payload["animation_id"] == "waves"
    assert payload["match_source"] == "ai"
