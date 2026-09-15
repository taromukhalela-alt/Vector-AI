from datetime import datetime, timezone
from types import SimpleNamespace

from backend.mvc.services.dashboard_service import (
    DASHBOARD_CONVERSATION_WINDOW,
    DashboardService,
)


class FakeDashboardRepository:
    def note_count(self, user_id):
        assert user_id == "learner-1"
        return 2

    def recent_conversations(self, user_id, limit=100):
        assert user_id == "learner-1"
        # The dashboard reads a bounded window of recent activity, never every
        # row a learner has produced.
        assert limit == DASHBOARD_CONVERSATION_WINDOW
        return [
            FakeConversation("forces", 80.0),
            FakeConversation("forces", 60.0),
            FakeConversation("waves", None),
        ]

    def note_topic_counts(self, user_id):
        assert user_id == "learner-1"
        return {"forces": 2}


class FakeConversation(SimpleNamespace):
    def __init__(self, intent, confidence):
        super().__init__(
            intent=intent,
            confidence=confidence,
            message="A learner question",
            timestamp=datetime.now(timezone.utc),
            chat_id="chat-1",
        )

    def to_dict(self):
        return {"chat_id": self.chat_id, "message": self.message, "reply": "A tutor response"}


def test_dashboard_service_builds_a_view_model_from_repository_data():
    service = DashboardService(
        latency_reader=lambda user_id: 12.0,
        repository=FakeDashboardRepository(),
    )

    dashboard = service.build("learner-1")

    assert dashboard["success"] is True
    assert dashboard["stats"]["questions_asked"] == 3
    assert dashboard["stats"]["avg_confidence"] == 70.0
    assert dashboard["stats"]["inference_latency_ms"] == 12.0
    assert dashboard["metrics"][0]["key"] == "questions_asked"
    forces = next(item for item in dashboard["topics"] if item["title"] == "Forces")
    assert forces["activity_count"] == 4
    assert forces["conversation_count"] == 2
    assert forces["note_count"] == 2
    assert dashboard["subjects"] == [
        {"name": "Physics", "topic_count": 2, "activity_count": 5}
    ]
    assert dashboard["syllabus"] == dashboard["topics"]
    assert dashboard["continue_learning"]["chat_id"] == "chat-1"
    assert dashboard["daily_mission"] is None
    assert dashboard["knowledge_map"] is None
    assert dashboard["knowledge_map_available"] is False


def test_dashboard_service_does_not_fabricate_topics_for_empty_data():
    class EmptyRepository:
        def note_count(self, _user_id):
            return 0

        def recent_conversations(self, _user_id, limit=100):
            assert limit == DASHBOARD_CONVERSATION_WINDOW
            return []

        def note_topic_counts(self, _user_id):
            return {}

    dashboard = DashboardService(
        latency_reader=lambda _user_id: 0,
        repository=EmptyRepository(),
    ).build("learner-1")

    assert dashboard["topics"] == []
    assert dashboard["subjects"] == []
    assert dashboard["syllabus"] == []
    assert dashboard["continue_learning"] is None
