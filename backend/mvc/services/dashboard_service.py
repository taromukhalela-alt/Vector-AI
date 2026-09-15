from collections import Counter
from datetime import datetime

from backend.domain.caps_knowledge import PHYSICS_INTENTS
from backend.mvc.repositories.dashboard_repository import DashboardRepository


CHEMISTRY_INTENTS = {
    "gas_laws",
    "reaction_rates",
    "bonding",
    "acid_base",
    "electrochemistry",
}

# The dashboard only describes recent activity, so it reads a bounded window of
# conversation rows instead of every row the learner has ever produced.
DASHBOARD_CONVERSATION_WINDOW = 300


def _topic_key(value):
    return " ".join(str(value or "").strip().lower().replace("_", " ").split())


def _topic_label(value):
    label = " ".join(str(value or "").strip().replace("_", " ").split())
    return label.title().replace("'S", "'s")


def _subject_for_topic(topic):
    if topic in PHYSICS_INTENTS:
        return "Physics"
    if topic in CHEMISTRY_INTENTS or topic == "chemistry":
        return "Chemistry"
    return "Other"


class DashboardService:
    """Build the dashboard view model for one learner."""

    def __init__(
        self,
        latency_reader,
        session_builder=lambda _history: [],
        repository=None,
        conversation_window=DASHBOARD_CONVERSATION_WINDOW,
    ):
        self._latency_reader = latency_reader
        self._session_builder = session_builder
        self._repository = repository or DashboardRepository()
        self._conversation_window = conversation_window

    def build(self, user_id):
        now = datetime.now()
        notes_count = self._repository.note_count(user_id)
        conversation_reader = getattr(self._repository, "recent_conversations", None)
        if conversation_reader is not None:
            conversations = conversation_reader(
                user_id, limit=self._conversation_window
            )
        else:
            legacy_reader = getattr(self._repository, "all_conversations", None)
            conversations = legacy_reader(user_id) if legacy_reader else []
        conversation_count_reader = getattr(self._repository, "conversation_count", None)
        questions_count = conversation_count_reader(user_id) if conversation_count_reader else len(conversations)
        confidences = [item.confidence for item in conversations if item.confidence is not None]
        average_confidence = round(sum(confidences) / len(confidences), 1) if confidences else None
        latency = self._latency_reader(user_id) or None
        intent_counts = Counter(item.intent for item in conversations if item.intent)

        history = [item.to_dict() for item in conversations]
        sessions = self._session_builder(history)
        today = now.date().toordinal()
        daily_confidence = []
        for days_back in range(11, -1, -1):
            day = today - days_back
            values = [
                item.confidence for item in conversations
                if item.confidence is not None and item.timestamp
                and item.timestamp.date().toordinal() == day
            ]
            daily_confidence.append(round((sum(values) / len(values)) / 100, 3) if values else None)
        top_intents = [count for _intent, count in intent_counts.most_common(8)]
        note_topic_reader = getattr(self._repository, "note_topic_counts", None)
        note_topics = (note_topic_reader(user_id) if note_topic_reader else None) or Counter()

        topics_by_key = {}

        def add_topic(value, source, count):
            key = _topic_key(value)
            if not key or key == "unknown":
                return
            topic = topics_by_key.setdefault(
                key,
                {
                    "title": _topic_label(value),
                    "subject": _subject_for_topic(key),
                    "category": _subject_for_topic(key),
                    "conversation_count": 0,
                    "note_count": 0,
                    "activity_count": 0,
                    "sources": set(),
                },
            )
            topic[f"{source}_count"] += count
            topic["activity_count"] += count
            topic["sources"].add(source)

        for intent, count in intent_counts.items():
            add_topic(intent, "conversation", count)
        for topic, count in note_topics.items():
            add_topic(topic, "note", count)

        topics = []
        for topic in topics_by_key.values():
            topic["sources"] = sorted(topic["sources"])
            topics.append(topic)
        topics.sort(key=lambda item: (-item["activity_count"], item["title"].lower()))

        subjects_by_name = {}
        for topic in topics:
            subject = subjects_by_name.setdefault(
                topic["subject"],
                {"name": topic["subject"], "topic_count": 0, "activity_count": 0},
            )
            subject["topic_count"] += 1
            subject["activity_count"] += topic["activity_count"]
        subjects = sorted(
            subjects_by_name.values(),
            key=lambda item: (-item["activity_count"], item["name"]),
        )

        continue_learning = None
        if conversations:
            latest = conversations[0]
            continue_learning = {
                "topic": latest.intent,
                "title": _topic_label(latest.intent) if latest.intent else "Your latest question",
                "question": (latest.message or "")[:180],
                "chat_id": latest.chat_id,
            }

        daily_mission_reader = getattr(self._repository, "daily_mission", None)
        daily_mission = (
            daily_mission_reader(user_id) if daily_mission_reader else None
        ) or None

        relationship_reader = getattr(self._repository, "knowledge_relationships", None)
        relationships = relationship_reader(user_id) if relationship_reader else []
        knowledge_map = relationships if relationships else None

        return {
            "success": True,
            "timestamp": now.isoformat(),
            "stats": {
                "questions_asked": questions_count,
                "notes_saved": notes_count,
                "avg_confidence": average_confidence,
                "inference_latency_ms": latency,
                "sessions_count": len(sessions),
            },
            "charts": {
                "line": daily_confidence,
                "bar": top_intents,
                "gauge": round(average_confidence / 100, 2) if average_confidence is not None else None,
            },
            "recent_questions": [
                {
                    "question": item.message[:48],
                    "confidence": item.confidence if item.confidence is not None else None,
                    "time": item.timestamp.strftime("%b %d, %H:%M") if item.timestamp else "",
                }
                for item in conversations[:6]
            ],
            "sessions": [
                {key: item[key] for key in ("chat_id", "title", "count", "last_time")}
                for item in sessions[:6]
            ],
            "continue_learning": continue_learning,
            "daily_mission": daily_mission,
            "subjects": subjects,
            "topics": topics,
            # Keep the old response key for clients that still consume it, but
            # populate it only with records found for this learner.
            "syllabus": topics,
            "knowledge_map": knowledge_map,
            "knowledge_map_available": knowledge_map is not None,
            "knowledge_map_message": (
                None
                if knowledge_map is not None
                else "A knowledge map is unavailable because no topic relationships are stored yet."
            ),
            "metrics": [
                {"key": "questions_asked", "label": "Questions asked", "value": questions_count, "unit": "", "desc": "Tutor questions saved to your account"},
                {"key": "notes_saved", "label": "Notes saved", "value": notes_count, "unit": "", "desc": "Study notes saved to your account"},
                {"key": "avg_confidence", "label": "Average confidence", "value": average_confidence, "unit": "%", "max": 100, "desc": "Average intent confidence from your tutor questions"},
                {"key": "inference_latency_ms", "label": "Response latency", "value": latency, "unit": "ms", "max": 50, "desc": "Average response time recorded for your tutor sessions"},
            ],
        }
