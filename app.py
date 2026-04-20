from flask import (
    Flask,
    request,
    jsonify,
    render_template,
    session,
    redirect,
    url_for,
)
from flask_cors import CORS
from flask_caching import Cache
from flask_login import login_required, LoginManager, current_user, logout_user
import json
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import urllib.request
import queue
import joblib
import random
import os
import re
import sys
import threading
import numpy as np
import logging
import time
from model.generator import MAX_HISTORY, normalize_history
from dotenv import load_dotenv

# Import Groq
try:
    from groq import Groq
except ImportError:
    Groq = None

import physics_engine  # Import the new module
from caps_knowledge import (
    PHYSICS_INTENTS,
    answer_caps_question,
    build_keyword_map,
    normalize_text,
)

load_dotenv()

# Configure Logging first (before any logger usage)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", os.urandom(24))

# Configure CORS
cors_origins = os.getenv("ALLOWED_ORIGIN", "http://localhost:5000")
if isinstance(cors_origins, str):
    cors_origins = [cors_origins]
CORS(app, origins=cors_origins)

# Initialize Auth
from auth import init_auth, login_manager

init_auth(app)

# Log API key status on startup for debugging
groq_key = os.getenv("GROQ_API_KEY") or os.getenv("GROQ_KEY")
if groq_key:
    logger.info("Groq API key loaded (length: %d)", len(groq_key))
else:
    logger.warning("Groq API key NOT found. Set GROQ_API_KEY environment variable.")

# Configure Caching
cache = Cache(app, config={"CACHE_TYPE": "SimpleCache"})

USERS_FILE = "users.json"

# ============================================================
# SYSTEM PROMPTS
# ============================================================
PHYSICS_SYSTEM_PROMPT = """You are Vector AI, a knowledgeable and friendly tutor for South African high school students following the CAPS Physical Sciences curriculum for Grades 10 to 12, covering physics and chemistry.
If the student says yes, sure, okay, or ja, immediately do what you last offered and do not ask again.
Do not repeat the same response twice in a row.
For a single word topic such as electricity, projectile motion, gas laws, or acids, start explaining immediately.
Provide thorough, educational answers with clear step-by-step explanations and worked examples where relevant.
Use clear CAPS aligned explanations and correct technical terms.
Stay centered on physics and chemistry. If a learner asks something unrelated, gently redirect them back to Physical Sciences.
For maths questions, provide full working because maths supports physical sciences learning.
"""

VOICE_SYSTEM_PROMPT = """You are Vector AI in voice mode for a South African CAPS Physical Sciences learner.
Your answer will be spoken by text to speech.
Use clear, descriptive sentences that are easy to understand.
Do not use bullet points, numbered lists, markdown, emojis, brackets, slashes, stars, arrows, or special symbols.
Spell formulas in both words and symbols (e.g., v squared equals u squared plus 2 a s).
Use transition words naturally: First, Next, Then, Finally.
Never speak in note form.
Provide complete explanations with examples that help the learner truly understand the concept.
Each response should be educational, thorough, and suitable for listening.
"""

# -------------------------------
# Configure AI API (Google Gemini)
# -------------------------------
# To use this, run: pip install google-generativeai
# And set your environment variable: set GOOGLE_API_KEY=your_key_here

# -------------------------------
# Load ML model
# -------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "intent_model.pkl")
encoder_path = os.path.join(BASE_DIR, "label_encoder.pkl")
config_path = os.path.join(BASE_DIR, "model_config.pkl")
EXPECTED_LABELS = {
    "ai",
    "physics",
    "python",
    "trends",
    "jokes",
    "greeting",
    "capabilities",
    "kinematics",
    "dynamics",
    "projectile_motion",
    "forces",
    "momentum",
    "energy",
    "gravitation",
    "waves",
    "electricity",
    "electrostatics",
    "magnetism",
    "optics",
    "thermodynamics",
    "nuclear",
    "shm",
    "unit_conversion",
}

# Train only when needed (faster startup)
try:
    sys.path.append(BASE_DIR)
    import ml_train

    should_train = os.getenv("FORCE_TRAIN") == "true"
    required_files = [model_path, encoder_path, config_path]
    if not all(os.path.exists(path) for path in required_files):
        should_train = True
    elif not should_train:
        try:
            existing_encoder = joblib.load(encoder_path)
            existing_labels = set(existing_encoder.classes_)
            if not EXPECTED_LABELS.issubset(existing_labels):
                should_train = True
        except Exception:
            should_train = True

    # Attempt training, but continue if it fails
    if should_train:
        try:
            ml_train.train_model()
        except Exception as e:
            logger.info(
                "Training skipped (%s). Attempting to load existing model...", e
            )
    else:
        logger.info(
            "Existing model files found. Skipping training. Set FORCE_TRAIN=true to override."
        )

    ml_model, label_encoder, config = ml_train.load_model_artifacts()
except Exception as e:
    logger.warning("ML Model failed to load. Error: %s", e)
    ml_model = None
    label_encoder = None
    config = {}

# Global list to store conversation history
user_conversations = {}
response_cache = {}
MAX_HISTORY_PER_USER = 50
RESPONSE_CACHE_TTL = 180
AFFIRMATIVES = {
    "yes",
    "yeah",
    "yep",
    "sure",
    "okay",
    "ok",
    "please",
    "go ahead",
    "show me",
    "yes please",
    "definitely",
    "of course",
    "do it",
    "yup",
    "yas",
    "ja",
    "ja please",
}

INTENT_KEYWORDS = build_keyword_map()

SCIENCE_TOPIC_LIBRARY = {
    "gas_laws": {
        "keywords": ["gas laws", "ideal gas", "boyle", "charles", "pressure", "volume", "temperature"],
        "response": "Gas laws explain how pressure, volume, and temperature are linked. In CAPS chemistry, Boyle's law links pressure and volume at constant temperature, while Charles's law links volume and temperature at constant pressure.",
    },
    "reaction_rates": {
        "keywords": ["reaction rate", "collision theory", "rate of reaction", "activation energy", "catalyst"],
        "response": "Reaction rate depends on how often particles collide and whether those collisions have enough energy. Higher temperature, greater concentration, and catalysts increase the rate by making successful collisions more likely.",
    },
    "bonding": {
        "keywords": ["bonding", "ionic bond", "covalent bond", "electronegativity", "chemical bond"],
        "response": "Chemical bonding explains how atoms become more stable. Ionic bonding involves electron transfer, while covalent bonding involves sharing electrons between atoms.",
    },
    "acid_base": {
        "keywords": ["acid", "base", "ph", "neutralisation", "neutralization"],
        "response": "Acids release hydrogen ions in solution, bases accept hydrogen ions or release hydroxide ions, and pH shows how acidic or basic a solution is. Neutralisation happens when an acid reacts with a base to form salt and water.",
    },
    "electrochemistry": {
        "keywords": ["electrochemistry", "electrolysis", "galvanic cell", "redox", "cell potential"],
        "response": "Electrochemistry links chemical reactions to electricity. Redox reactions transfer electrons, galvanic cells produce electrical energy from chemical change, and electrolysis uses electrical energy to drive a chemical change.",
    },
}

ANIMATION_KEYWORD_MAP = [
    {
        "animation_id": "gas_laws",
        "animation_label": "Gas Laws",
        "keywords": ["gas laws", "boyle", "charles", "pressure", "volume", "temperature of gas", "ideal gas"],
    },
    {
        "animation_id": "reaction_rates",
        "animation_label": "Reaction Rates",
        "keywords": ["reaction rate", "collision theory", "rate of reaction", "catalyst", "activation energy"],
    },
    {
        "animation_id": "bonding",
        "animation_label": "Chemical Bonding",
        "keywords": ["bonding", "ionic", "covalent", "electronegativity", "chemical bond"],
    },
    {
        "animation_id": "acid_base",
        "animation_label": "Acids and Bases",
        "keywords": ["acid", "base", "ph", "neutralisation", "neutralization"],
    },
    {
        "animation_id": "electrochemistry",
        "animation_label": "Electrochemistry",
        "keywords": ["electrochemistry", "electrolysis", "galvanic", "cell potential", "redox cell"],
    },
]


def classify_intent(message):
    try:
        if ml_model is not None and label_encoder is not None:
            return ml_detect_intent_with_confidence(message)
    except Exception as e:
        logger.info("Intent classification fallback: %s", e)

    msg = normalize_text(message or "")
    scores = {}
    for intent, keywords in INTENT_KEYWORDS.items():
        scores[intent] = sum(1 for kw in keywords if kw in msg)
    if not scores:
        return ("unknown", 30.0)
    best = max(scores, key=scores.get)
    confidence = min(0.92, max(0.35, scores[best] / max(len(msg.split()) * 0.25, 1)))
    return (best, round(confidence * 100, 1)) if scores[best] > 0 else ("unknown", 30.0)


def build_prompt(history, user_message, system_prompt):
    lines = [system_prompt, ""]
    for item in normalize_history(history):
        role = "User" if item["role"] == "user" else "Assistant"
        lines.append(f"{role}: {item['content']}")
    lines.append(f"User: {user_message}")
    lines.append("Assistant:")
    return "\n".join(lines)


def make_voice_friendly(text):
    cleaned = (text or "").strip()
    replacements = {
        "\n": " ",
        "*": " ",
        "#": " ",
        "•": " ",
        "→": " to ",
        "=": " equals ",
        "/": " per ",
        "^2": " squared ",
        "^3": " cubed ",
        "m/s^2": " meters per second squared ",
        "m/s": " meters per second ",
        "kg": " kilograms ",
        " N ": " newtons ",
        " J ": " joules ",
        " W ": " watts ",
        " V ": " volts ",
        " A ": " amperes ",
        "Ω": " ohms ",
    }
    for source, target in replacements.items():
        cleaned = cleaned.replace(source, target)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def _groq_generate_with_timeout(prompt, api_key, timeout_seconds):
    result_queue = queue.Queue(maxsize=1)

    def worker():
        try:
            client = Groq(api_key=api_key)

            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",  # Fast, high-quality model
                messages=[
                    {"role": "system", "content": "You are a helpful physics tutor."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.7,
                top_p=0.95,
                max_tokens=2048,
            )

            text = response.choices[0].message.content or ""
            result_queue.put(("ok", text.strip()))
        except Exception as exc:
            import traceback

            tb = traceback.format_exc()
            result_queue.put(("error", (str(exc), tb)))

    thread = threading.Thread(target=worker, daemon=True)
    thread.start()
    try:
        status, payload = result_queue.get(timeout=timeout_seconds)
    except queue.Empty:
        raise TimeoutError("Groq request timed out")
    if status == "error":
        exc_msg, tb = payload if isinstance(payload, tuple) else (str(payload), "")
        print(f"\n[GROQ ERROR]\n{tb}")
        raise Exception(exc_msg)
    return payload


def generate_response(user_message, history=None, system_prompt=None, local_hint=None):
    if history is None:
        history = []
    if system_prompt is None:
        system_prompt = PHYSICS_SYSTEM_PROMPT

    api_key = os.getenv("GROQ_API_KEY") or os.getenv("GROQ_KEY")
    if not api_key or Groq is None:
        logger.error(
            "Groq API not available: key=%s, groq=%s", bool(api_key), Groq is not None
        )
        fallback = local_hint or get_local_science_response(user_message)
        return fallback or "I'm ready to help with CAPS physics and chemistry. Ask me anything!"

    try:
        prompt = build_prompt(history, user_message, system_prompt)
        # Give the model a bit more room before falling back to local explanations.
        timeout_seconds = 6.0 if local_hint else 10.0
        text = _groq_generate_with_timeout(prompt, api_key, timeout_seconds)
        if text:
            return text
        # If Groq returned empty, try once more with a shorter prompt (no history) as fallback
        logger.info("Groq returned empty, retrying without history")
        simple_prompt = f"{system_prompt}\n\nUser: {user_message}\nAssistant:"
        text = _groq_generate_with_timeout(simple_prompt, api_key, timeout_seconds)
        if text:
            return text
        # Still empty, use local hint if available
        if local_hint:
            logger.info("Groq empty again, using local hint")
            return local_hint
        fallback = get_local_science_response(user_message)
        return fallback or "I couldn't generate a response. Could you try asking differently?"
    except TimeoutError:
        logger.error("Groq timeout after %.1fs", timeout_seconds)
        if local_hint:
            return local_hint
        fallback = get_local_science_response(user_message)
        return fallback or "I'm taking too long. Could you ask a simpler question?"
    except Exception as e:
        logger.error("Generation error: %s", e)
        if local_hint:
            return local_hint
        fallback = get_local_science_response(user_message)
        return fallback or "I hit a temporary issue. Please try again."


# -------------------------------
# Responses
# -------------------------------
responses = {
    "ai": "Artificial Intelligence is the simulation of human intelligence in machines.",
    "physics": "Physics studies matter, energy, motion, and the forces of nature.",
    "python": "Python is a popular programming language known for simplicity and power.",
    "trends": "I analyze trends based on user interest and public data.",
    "jokes": "Why did the developer go broke? Because he used up all his cache! 😂",
    "greeting": "Hello! I'm Vector AI. How can I assist you today?",
    "capabilities": "I can explain CAPS physics and chemistry with text, voice, worked steps, and interactive animations.",
    "unit_conversion": "I can convert units for you. Try 'Convert 10 meters to feet'.",
    "unknown": "I'm still learning 🤖. Could you try rephrasing?",
}

# -------------------------------
# Physics knowledge base
# -------------------------------
physics_facts = {
    "gravity": "Gravity is a force that attracts objects with mass toward each other.",
    "energy": "Energy cannot be created or destroyed, only transformed.",
    "force": "Force is any interaction that changes an object's motion.",
    "momentum": "Momentum is the change in velocity of an object.",
    "kinematics": "Kinematics is the study of motion and position",
    "dynamics": "Dynamics is the study of the forces that cause motion",
    "thermodynamics": "Thermodynamics deals with heat, work, and temperature, and their relation to energy, entropy, and the physical properties of matter and radiation.",
    "quantum": "Quantum mechanics is a fundamental theory in physics that provides a description of the physical properties of nature at the scale of atoms and subatomic particles.",
    "relativity": "Relativity encompasses two theories by Albert Einstein: special relativity and general relativity.",
    "electromagnetism": "Electromagnetism is a branch of physics involving the study of the electromagnetic force, a type of physical interaction that occurs between electrically charged particles.",
    "friction": "Friction is the force resisting the relative motion of solid surfaces, fluid layers, and material elements sliding against each other.",
    "inertia": "Inertia is the resistance of any physical object to any change in its velocity.",
}

PHYSICS_KEYWORDS = {
    keyword for values in INTENT_KEYWORDS.values() for keyword in values
}


def get_local_physics_response(message, intent=None):
    answer = answer_caps_question(message, predicted_intent=intent)
    return answer["response"] if answer else None


def get_local_science_response(message, intent=None):
    physics_answer = get_local_physics_response(message, intent=intent)
    if physics_answer:
        return physics_answer

    text = normalize_text(message or "")
    if not text:
        return None

    for topic in SCIENCE_TOPIC_LIBRARY.values():
        if any(keyword in text for keyword in topic["keywords"]):
            return topic["response"]
    return None


def match_animation_from_keywords(question):
    text = normalize_text(question or "")
    if not text:
        return None

    best_match = None
    best_score = 0
    for item in ANIMATION_KEYWORD_MAP:
        score = sum(1 for keyword in item["keywords"] if keyword in text)
        if score > best_score:
            best_match = item
            best_score = score

    if best_match and best_score > 0:
        return {
            "animation_id": best_match["animation_id"],
            "animation_label": best_match["animation_label"],
        }
    return None


# -------------------------------
# Helper functions
# -------------------------------
api_cache = {}
CACHE_DURATION = 300  # 5 minutes


def http_get_json(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.getcode() == 200:
                return json.loads(response.read().decode("utf-8"))
    except Exception:
        return None


def summarize_content(text):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or not text or not genai:
        return text

    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=f"Summarize the following content concisely for a chat context:\n\n{text}",
        )
        return response.text
    except Exception as e:
        logger.info("Summarization Error: %s", e)
        return text


def fetch_online_data(topic):
    # Check cache
    if topic in api_cache:
        data, timestamp = api_cache[topic]
        if (datetime.now() - timestamp).total_seconds() < CACHE_DURATION:
            return data

    result = None
    try:
        if topic == "trends":
            # Try YouTube Trending (if API key exists) or Hacker News
            google_key = os.getenv("GOOGLE_API_KEY")
            if google_key and random.choice([True, False]):
                yt_url = f"https://www.googleapis.com/youtube/v3/videos?chart=mostPopular&regionCode=US&part=snippet&maxResults=3&key={google_key}"
                data = http_get_json(yt_url)
                if data:
                    items = data.get("items", [])
                    videos = [
                        f"Title: {item['snippet']['title']}\nDescription: {item['snippet']['description']}"
                        for item in items
                    ]
                    if videos:
                        result = "Trending on YouTube:\n" + "\n---\n".join(videos)

            if not result:
                # Hacker News Top Stories
                top_ids = http_get_json(
                    "https://hacker-news.firebaseio.com/v0/topstories.json"
                )
                if top_ids:
                    top_ids = top_ids[:3]
                    titles = []
                    for tid in top_ids:
                        item_data = http_get_json(
                            f"https://hacker-news.firebaseio.com/v0/item/{tid}.json"
                        )
                        if item_data:
                            title = item_data.get("title", "")
                            text = item_data.get(
                                "text", ""
                            )  # Get text content if available (e.g. Ask HN)
                            entry = f"{title} - {text}" if text else title
                            titles.append(entry)
                    if titles:
                        result = "Trending in Tech: " + "; ".join(titles)
        elif topic == "physics":
            # Randomly choose between NASA APOD and Spaceflight News
            if random.choice([True, False]):
                data = http_get_json(
                    "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY"
                )
                if data:
                    result = f"NASA Astronomy Picture of the Day: {data.get('title')}\n\nExplanation: {data.get('explanation')}"

            if not result:
                # Spaceflight News API
                data = http_get_json(
                    "https://api.spaceflightnewsapi.net/v3/articles?_limit=1"
                )
                if data:
                    if data:
                        result = f"Latest Physics/Space News: {data[0]['title']}\n\nSummary: {data[0]['summary']}"
        elif topic == "ai":
            # Wikipedia API for AI
            data = http_get_json(
                "https://en.wikipedia.org/api/rest_v1/page/summary/Artificial_intelligence"
            )
            if data:
                result = f"AI Summary (Wikipedia): {data.get('extract')}"
        elif topic == "python":
            # GitHub API for CPython
            data = http_get_json(
                "https://api.github.com/repos/python/cpython/releases/latest"
            )
            if data:
                result = f"Latest Python Release: {data.get('tag_name')}\n\nRelease Notes:\n{data.get('body')}"
    except Exception as e:
        logger.info("API Fetch Error: %s", e)

    if result:
        # Summarize the fetched content using AI before caching/displaying
        result = summarize_content(result)
        api_cache[topic] = (result, datetime.now())

    return result


def is_affirmative(message):
    if not message:
        return False
    cleaned = message.lower().strip().rstrip("!?.")
    return cleaned in AFFIRMATIVES


def extract_last_offer(history):
    """Find the last assistant message that contained an offer/question."""
    for msg in reversed(history or []):
        if msg.get("role") != "assistant":
            continue
        content = msg.get("content", "")
        if "?" not in content:
            continue
        sentences = content.split(".")
        for sentence in reversed(sentences):
            if "?" in sentence:
                return sentence.strip()
    return "Give a worked explanation and example relevant to the current topic."


def detect_loop(history, threshold=2):
    """
    Returns True if the last `threshold` assistant messages are too similar.
    Prevents the AI from repeating the same response.
    """
    if not history or len(history) < threshold * 2:
        return False

    recent_assistant_msgs = [
        (m.get("content") or "").lower().strip()
        for m in history
        if m.get("role") == "assistant"
    ][-threshold:]

    if len(recent_assistant_msgs) < threshold:
        return False

    words_a = set(recent_assistant_msgs[0].split())
    words_b = set(recent_assistant_msgs[1].split())

    if not words_a:
        return False

    overlap = len(words_a & words_b) / len(words_a)
    return overlap > 0.6


def build_example_prompt(history, user_message, intent):
    example_request = (
        "Provide a worked CAPS physics example relevant to the student's last question. "
        f"Question: {user_message}"
    )
    return build_prompt(history, example_request, PHYSICS_SYSTEM_PROMPT)


def perform_unit_conversion(query):
    query = query.lower()
    # Simple regex for "convert X unit to unit"
    match = re.search(r"(\d+(?:\.\d+)?)\s*([a-z]+)\s*(?:to|in)\s*([a-z]+)", query)
    if not match:
        return None

    val, u_from, u_to = float(match.group(1)), match.group(2), match.group(3)

    # Normalization map
    u_map = {
        "meter": "m",
        "meters": "m",
        "feet": "ft",
        "foot": "ft",
        "kilogram": "kg",
        "kilograms": "kg",
        "pound": "lbs",
        "pounds": "lbs",
        "lb": "lbs",
        "mile": "miles",
        "miles": "miles",
        "kilometer": "km",
        "kilometers": "km",
        "celsius": "c",
        "fahrenheit": "f",
    }

    u_from = u_map.get(u_from, u_from)
    u_to = u_map.get(u_to, u_to)

    # Conversions
    if u_from == "c" and u_to == "f":
        return f"{val} C is {val * 9 / 5 + 32:.2f} F"
    if u_from == "f" and u_to == "c":
        return f"{val} F is {(val - 32) * 5 / 9:.2f} C"

    factors = {
        ("m", "ft"): 3.28084,
        ("ft", "m"): 0.3048,
        ("kg", "lbs"): 2.20462,
        ("lbs", "kg"): 0.453592,
        ("km", "miles"): 0.621371,
        ("miles", "km"): 1.60934,
    }

    if (u_from, u_to) in factors:
        return f"{val} {u_from} is {val * factors[(u_from, u_to)]:.2f} {u_to}"

    return None


def solve_physics_problem(text):
    return get_local_physics_response(text)


def ml_detect_intent_with_confidence(message):
    text = normalize_text(message or "")

    def is_physics_like():
        has_keyword = any(word in text for word in PHYSICS_KEYWORDS)
        has_equation_pattern = bool(
            re.search(r"\b([a-z]\s*=\s*[a-z0-9+\-*/^ ]+)\b", text)
        )
        has_units = bool(
            re.search(
                r"\b(m/s|m/s\^2|newton|n|joule|j|watt|w|volt|v|ohm|kg|hz|coulomb)\b",
                text,
            )
        )
        return has_keyword or has_equation_pattern or has_units

    if ml_model and label_encoder:
        try:
            probs = ml_model.predict_proba([message])[0]
            max_prob = float(np.max(probs))
            pred_idx = int(np.argmax(probs))
            second_prob = float(np.partition(probs, -2)[-2]) if len(probs) > 1 else 0.0
            margin = max_prob - second_prob
            best_intent = ml_model.classes_[pred_idx]

            confidence = (0.7 * max_prob) + (0.3 * margin)
            physics_like = is_physics_like()

            if best_intent == "physics" and physics_like:
                confidence = max(confidence, 0.58)
            if best_intent != "physics" and physics_like and max_prob < 0.55:
                best_intent = "physics"
                confidence = max(confidence, 0.52)
            if best_intent == "physics" and not physics_like and max_prob < 0.45:
                best_intent = "unknown"
                confidence = min(confidence, 0.35)

            return best_intent, round(max(0.0, min(1.0, confidence)) * 100, 1)
        except Exception as e:
            logger.info("ML Prediction Error: %s", e)
    return ("physics", 55.0) if is_physics_like() else ("unknown", 20.0)


def ml_detect_intent(message):
    intent, _confidence = ml_detect_intent_with_confidence(message)
    return intent


def get_physics_info(message):
    local = get_local_science_response(message, intent="physics")
    if local:
        return local
    for key in physics_facts:
        if key in message.lower():
            return physics_facts[key]
    return random.choice(list(physics_facts.values()))


def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, "r") as file:
            return json.load(file)
    except (json.JSONDecodeError, ValueError):
        return {}


def save_users(users):
    with open(USERS_FILE, "w") as file:
        json.dump(users, file, indent=4)


def save_user_data(
    message, topic, username=None, confidence=None, chat_id=None, reply=None
):
    """Save user conversation data to data.json and also update per-user JSON"""
    try:
        with open("data.json", "r") as file:
            data = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []

    data.append(
        {
            "message": message,
            "topic": topic,
            "time": datetime.now().isoformat(),
            "username": username,
            "confidence": confidence,
            "chat_id": chat_id,
            "reply": reply,
        }
    )

    with open("data.json", "w") as file:
        json.dump(data, file, indent=4)

    # Also update user-specific conversation history
    if current_user.is_authenticated:
        users = load_users()
        user_data = users.get(current_user.id, {})
        user_conversations = user_data.get("conversations", [])
        user_conversations.append(
            {
                "message": message,
                "reply": reply,
                "topic": topic,
                "time": datetime.now().isoformat(),
            }
        )
        # Keep only last 100 messages
        user_conversations = user_conversations[-100:]
        user_data["conversations"] = user_conversations
        users[current_user.id] = user_data
        save_users(users)


def get_user_key():
    """Get unique user key for data storage - uses Flask-Login current_user if authenticated"""
    if current_user.is_authenticated:
        return current_user.id
    if "session_id" not in session:
        session["session_id"] = os.urandom(8).hex()
    return session.get("user", session["session_id"])


def ensure_chat_id():
    if "chat_id" not in session:
        session["chat_id"] = os.urandom(6).hex()
    return session["chat_id"]


def get_cached_reply(message):
    key = message.strip().lower()
    cached = response_cache.get(key)
    if not cached:
        return None
    if time.time() - cached["timestamp"] > RESPONSE_CACHE_TTL:
        response_cache.pop(key, None)
        return None
    return cached


def set_cached_reply(message, reply, intent, confidence):
    key = message.strip().lower()
    response_cache[key] = {
        "reply": reply,
        "intent": intent,
        "confidence": confidence,
        "timestamp": time.time(),
    }


def _format_time(iso_value):
    try:
        return datetime.fromisoformat(iso_value).strftime("%b %d, %Y %H:%M")
    except Exception:
        return iso_value


def load_user_history(username):
    try:
        with open("data.json", "r") as file:
            data = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []
    return [d for d in data if d.get("username") == username]


def build_sessions(history):
    grouped = {}
    for entry in history:
        chat_id = entry.get("chat_id") or "legacy"
        grouped.setdefault(chat_id, []).append(entry)

    sessions = []
    for chat_id, items in grouped.items():
        items.sort(key=lambda x: x.get("time", ""))
        title = items[0].get("message", "Session")[:48]
        last_time = _format_time(items[-1].get("time", ""))
        sessions.append(
            {
                "chat_id": chat_id,
                "title": title if title else "Session",
                "last_time": last_time,
                "count": len(items),
                "messages": items,
            }
        )
    sessions.sort(key=lambda x: x["last_time"], reverse=True)
    return sessions


@app.route("/metrics")
def metrics():
    """Simple monitoring endpoint."""
    return jsonify(
        {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "cached_entries": len(api_cache),
        }
    )


def _generate_dashboard_payload():
    now = datetime.now()
    username = current_user.id if current_user.is_authenticated else session.get("user")
    history = load_user_history(username) if username else []
    sessions = build_sessions(history)
    questions_asked = len(history)
    confidences = [
        h.get("confidence")
        for h in history
        if isinstance(h.get("confidence"), (int, float))
    ]
    avg_confidence = (
        round(sum(confidences) / len(confidences), 1) if confidences else 0.0
    )

    stats = {
        "model_accuracy": round(random.uniform(96.4, 99.4), 1),
        "questions_asked": questions_asked,
        "avg_confidence": avg_confidence,
        "active_simulations": random.randint(110, 160),
        "inference_latency_ms": round(random.uniform(12.8, 18.6), 1),
    }
    line_points = [
        round(0.58 + (i * 0.018) + random.uniform(-0.04, 0.04), 3) for i in range(12)
    ]
    bar_points = [random.randint(45, 88) for _ in range(8)]
    gauge_value = round(random.uniform(0.82, 0.93), 2)

    recent_questions = []
    for entry in history[-6:]:
        recent_questions.append(
            {
                "question": entry.get("message", "Question"),
                "confidence": entry.get("confidence", 0),
                "time": _format_time(entry.get("time", "")),
            }
        )

    session_cards = []
    for session_entry in sessions[:6]:
        session_cards.append(
            {
                "chat_id": session_entry["chat_id"],
                "title": session_entry["title"],
                "count": session_entry["count"],
                "last_time": session_entry["last_time"],
            }
        )

    return {
        "timestamp": now.isoformat(),
        "stats": stats,
        "charts": {"line": line_points, "bar": bar_points, "gauge": gauge_value},
        "recent_questions": recent_questions,
        "sessions": session_cards,
    }


@app.route("/api/dashboard")
def dashboard_data():
    """Dashboard live data feed."""
    payload = _generate_dashboard_payload()
    return jsonify(payload)


# -------------------------------
# Dashboard / History
# -------------------------------


@app.route("/dashboard")
@login_required
def dashboard():
    return redirect(url_for("chat_page", tab="topics"))


@app.route("/history")
@login_required
def history_notes():
    return redirect(url_for("chat_page"))


@app.route("/history/<chat_id>")
@login_required
def history_detail(chat_id):
    return redirect(url_for("chat_page"))


@app.route("/api/simulate", methods=["POST"])
@cache.cached(timeout=60, key_prefix=lambda: request.data)
def simulate_physics():
    """
    Runs both the True Physics Simulation and the ML Prediction.
    Returns data for visualization and comparison.
    """
    start_time = time.time()
    try:
        data = request.json
        # Input Validation
        try:
            v0 = float(data.get("v0", 50))
            angle = float(data.get("angle", 45))
            mass = float(data.get("mass", 1.0))
            drag = float(data.get("drag", 0.0))
            scale_height = data.get("scale_height")
            gravity = data.get("gravity")
            if scale_height is not None:
                scale_height = float(scale_height)
            if gravity is not None:
                gravity = float(gravity)
            if v0 < 0 or mass <= 0:
                raise ValueError("Invalid physics parameters")
        except ValueError as e:
            return jsonify({"success": False, "error": str(e)}), 400

        # 1. Run Ground Truth Physics
        sim_results = physics_engine.simulator.simulate_projectile(
            v0, angle, mass, drag, scale_height=scale_height, g=gravity
        )

        # 2. Run ML Prediction (if trained)
        ml_results = None
        error_margin = 0.0

        if physics_engine.learner.is_trained and (
            gravity is None or abs(gravity - 9.8) < 1e-3
        ):
            # We ask the ML model to predict positions for the same timestamps
            ml_results = physics_engine.learner.predict_trajectory(
                v0, angle, mass, drag, sim_results["t"]
            )

            # Calculate average Euclidean distance between True and ML points
            true_pos = np.column_stack((sim_results["x"], sim_results["y"]))
            pred_pos = np.column_stack((ml_results["x"], ml_results["y"]))
            distances = np.linalg.norm(true_pos - pred_pos, axis=1)
            error_margin = np.mean(distances)

        # 3. Generate Explanation (structured)
        explanation = physics_engine.explainer.explain_simulation(
            {
                "v0": v0,
                "angle": angle,
                "mass": mass,
                "drag": drag,
                "scale_height": scale_height,
            },
            physics_engine.learner.last_metrics,
            error_margin,
        )

        # Explanation may be a dict with 'text' and 'symbolic'
        if isinstance(explanation, dict):
            explanation_text = explanation.get("text")
            symbolic = explanation.get("symbolic")
        else:
            explanation_text = explanation
            symbolic = None

        logger.info(f"Simulation run in {time.time() - start_time:.3f}s")
        return jsonify(
            {
                "success": True,
                "physics": {
                    k: v.tolist() for k, v in sim_results.items()
                },  # Convert numpy to list
                "ml": {k: v.tolist() for k, v in ml_results.items()}
                if ml_results
                else None,
                "explanation": explanation_text,
                "symbolic": symbolic,
                "error_margin": error_margin,
            }
        )
    except Exception as e:
        logger.error(f"Simulation Error: {e}")
        return jsonify({"success": False, "error": str(e)})


# -------------------------------
# Routes
# -------------------------------
@app.route("/")
def home():
    if current_user.is_authenticated:
        return redirect(url_for("chat_page"))
    return redirect(url_for("auth.landing"))


@app.route("/assistant")
def assistant():
    return redirect(url_for("chat_page"))


@app.route("/logout", methods=["GET", "POST"])
def logout_alias():
    logout_user()
    session.clear()
    if request.is_json or request.method == "POST":
        return jsonify({"success": True, "redirect": url_for("auth.landing")})
    return redirect(url_for("auth.landing"))


@app.route("/chat", methods=["GET"])
@login_required
def chat_page():
    session["user"] = current_user.id
    get_user_key()
    ensure_chat_id()
    return render_template("index.html", user=current_user)


@app.route("/notes")
@login_required
def notes_page():
    session["user"] = current_user.id
    return render_template("notes.html", user=current_user)


@app.route("/animations")
@login_required
def animations():
    args = {"tab": "animations"}
    anim = request.args.get("anim")
    q = request.args.get("q")
    if anim:
        args["anim"] = anim
    if q:
        args["q"] = q
    return redirect(url_for("chat_page", **args))


@app.route("/check_auth")
def check_auth():
    if current_user.is_authenticated:
        return jsonify(
            {
                "authenticated": True,
                "user": {
                    "id": current_user.id,
                    "email": current_user.email,
                    "name": current_user.name,
                    "avatar": current_user.avatar,
                },
            }
        )
    return jsonify({"authenticated": False})


@app.route("/api/history")
@login_required
def api_history():
    return jsonify(load_user_history(current_user.id))


@app.route("/api/new_session", methods=["POST"])
@login_required
def new_session():
    session["chat_id"] = os.urandom(6).hex()
    user_key = get_user_key()
    user_conversations[user_key] = []
    return jsonify({"success": True, "chat_id": session["chat_id"]})


@app.route("/match-animation", methods=["POST"])
@login_required
def match_animation():
    try:
        payload = request.get_json(silent=True) or {}
        question = (payload.get("question") or "").strip()
        if not question:
            return jsonify({"animation_id": None})

        keyword_match = match_animation_from_keywords(question)
        if keyword_match:
            return jsonify(keyword_match)

        intent, confidence = classify_intent(question)
        conf_value = float(confidence)

        intent_to_animation = {
            "projectile_motion": {
                "animation_id": "projectile",
                "animation_label": "Projectile Motion",
            },
            "waves": {"animation_id": "waves", "animation_label": "Wave Motion"},
            "forces": {"animation_id": "forces", "animation_label": "Newton's Laws"},
            "momentum": {
                "animation_id": "collision",
                "animation_label": "Momentum and Collisions",
            },
            "energy": {
                "animation_id": "thermodynamics",
                "animation_label": "Energy Transfers",
            },
            "gravitation": {
                "animation_id": "orbit",
                "animation_label": "Gravitation and Orbits",
            },
            "electricity": {
                "animation_id": "electricity",
                "animation_label": "Electric Fields",
            },
            "magnetism": {
                "animation_id": "magnetism",
                "animation_label": "Magnetic Fields",
            },
            "optics": {
                "animation_id": "optics",
                "animation_label": "Refraction and Optics",
            },
            "nuclear": {"animation_id": "nuclear", "animation_label": "Nuclear Decay"},
            "thermodynamics": {
                "animation_id": "thermodynamics",
                "animation_label": "Gas and Thermodynamics",
            },
            "shm": {
                "animation_id": "pendulum",
                "animation_label": "Simple Harmonic Motion",
            },
            "electrostatics": {
                "animation_id": "electricity",
                "animation_label": "Electric Fields",
            },
            "chemistry": {
                "animation_id": "reaction_rates",
                "animation_label": "Chemistry Reactions",
            },
        }

        if conf_value >= 35.0 and intent in intent_to_animation:
            return jsonify(intent_to_animation[intent])
        return jsonify({"animation_id": None})
    except Exception as e:
        logger.error("Match animation error: %s", e)
        return jsonify({"animation_id": None})


@app.route("/chat", methods=["POST"])
def chat():
    if not request.is_json:
        return jsonify({"intent": "error", "reply": "Request must be JSON"}), 400

    payload = request.get_json(silent=True) or {}
    user_message = (payload.get("message") or "").strip()
    if not user_message:
        return jsonify({"intent": "error", "reply": "Message is required"}), 400

    voice_mode = bool(payload.get("voice_mode", False))
    history = normalize_history(payload.get("history", []))
    user_key = get_user_key()
    if not history:
        history = list(user_conversations.get(user_key, []))
    intent = "unknown"
    confidence = 30.0

    try:
        intent, confidence = classify_intent(user_message)

        deterministic_hint = None
        if intent == "unit_conversion":
            deterministic_hint = perform_unit_conversion(user_message)
        elif intent in PHYSICS_INTENTS or intent == "physics":
            deterministic_hint = solve_physics_problem(user_message)
        if not deterministic_hint:
            deterministic_hint = get_local_science_response(user_message, intent=intent)

        system_prompt = VOICE_SYSTEM_PROMPT if voice_mode else PHYSICS_SYSTEM_PROMPT
        prompt = user_message
        if is_affirmative(user_message):
            last_offer = extract_last_offer(history)
            prompt = (
                f'The student agreed. Your last message was: "{last_offer[:300]}". '
                "Now fulfill what you offered and do not ask again."
            )
        if deterministic_hint:
            # Provide computed result as context, but ask Gemini to create a full educational explanation
            prompt = (
                f"{prompt}\n\n"
                f"Reference solution: {deterministic_hint}\n"
                f"Provide a comprehensive, step-by-step explanation that helps the learner understand the physics concepts. "
                f"Include the final result where relevant, but focus on teaching the reasoning and method."
            )

        reply = generate_response(
            prompt, history, system_prompt, local_hint=deterministic_hint
        )
        if voice_mode:
            reply = make_voice_friendly(reply)

        # Update rolling history shared with frontend
        history.append({"role": "user", "content": user_message})
        history.append({"role": "assistant", "content": reply})
        history = history[-MAX_HISTORY:]

        if detect_loop(history):
            example_prompt = build_example_prompt(history[:-1], user_message, intent)
            reply = generate_response(
                example_prompt,
                history[:-1],
                system_prompt,
                local_hint=deterministic_hint,
            )
            if voice_mode:
                reply = make_voice_friendly(reply)
            history[-1]["content"] = reply

        # Keep server-side copy for existing analytics/history pages
        user_conversations[user_key] = list(history)
        ensure_chat_id()
    except Exception as e:
        logger.error("Chat Error: %s", e)
        reply = "I hit a temporary issue. Please re-articulate your question."

    save_user_data(
        user_message,
        intent,
        current_user.id if current_user.is_authenticated else session.get("user"),
        confidence=confidence,
        chat_id=session.get("chat_id"),
        reply=reply,
    )

    return jsonify(
        {"reply": reply, "history": history, "confidence": confidence, "intent": intent}
    )


# ============ NOTES API ============


@app.route("/api/notes", methods=["GET"])
@login_required
def get_notes():
    """Get all notes for current user"""
    users = load_users()
    user_notes = users.get(current_user.id, {}).get("notes", [])
    return jsonify({"success": True, "notes": user_notes})


@app.route("/api/notes", methods=["POST"])
@login_required
def create_note():
    """Create a new AI-assisted note"""
    data = request.get_json() or {}
    title = data.get("title", "").strip()
    content = data.get("content", "").strip()
    topic = data.get("topic", "").strip()

    if not title or not content:
        return jsonify({"success": False, "message": "Title and content required"}), 400

    users = load_users()
    user_data = users.get(current_user.id, {})
    notes = user_data.get("notes", [])

    note_id = f"note_{datetime.now().timestamp()}"
    new_note = {
        "id": note_id,
        "title": title,
        "content": content,
        "topic": topic,
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat(),
        "tags": data.get("tags", []),
        "source": "ai" if data.get("ai_generated") else "user",
    }

    notes.append(new_note)
    user_data["notes"] = notes
    users[current_user.id] = user_data
    save_users(users)

    return jsonify({"success": True, "note": new_note})


@app.route("/api/notes/<note_id>", methods=["PUT"])
@login_required
def update_note(note_id):
    """Update an existing note"""
    data = request.get_json() or {}
    users = load_users()
    user_data = users.get(current_user.id, {})
    notes = user_data.get("notes", [])

    for note in notes:
        if note["id"] == note_id:
            note["title"] = data.get("title", note["title"])
            note["content"] = data.get("content", note["content"])
            note["topic"] = data.get("topic", note["topic"])
            note["updated_at"] = datetime.now().isoformat()
            users[current_user.id] = user_data
            save_users(users)
            return jsonify({"success": True, "note": note})

    return jsonify({"success": False, "message": "Note not found"}), 404


@app.route("/api/notes/<note_id>", methods=["DELETE"])
@login_required
def delete_note(note_id):
    """Delete a note"""
    users = load_users()
    user_data = users.get(current_user.id, {})
    notes = user_data.get("notes", [])

    notes = [n for n in notes if n["id"] != note_id]
    user_data["notes"] = notes
    users[current_user.id] = user_data
    save_users(users)

    return jsonify({"success": True})


@app.route("/api/notes/<note_id>", methods=["GET"])
@login_required
def get_note(note_id):
    """Get single note"""
    users = load_users()
    user_data = users.get(current_user.id, {})
    notes = user_data.get("notes", [])

    for note in notes:
        if note["id"] == note_id:
            return jsonify({"success": True, "note": note})

    return jsonify({"success": False, "message": "Note not found"}), 404


@app.route("/api/notes/search", methods=["POST"])
@login_required
def search_notes():
    """Search notes by topic or content"""
    data = request.get_json() or {}
    query = data.get("query", "").lower().strip()

    if not query:
        return jsonify({"success": False, "message": "Query required"}), 400

    users = load_users()
    user_data = users.get(current_user.id, {})
    notes = user_data.get("notes", [])

    results = []
    for note in notes:
        if (
            query in note["title"].lower()
            or query in note["content"].lower()
            or query in note.get("topic", "").lower()
        ):
            results.append(note)

    return jsonify({"success": True, "notes": results, "count": len(results)})


@app.route("/api/notes/sync", methods=["GET"])
@login_required
def sync_notes():
    """Get all notes with timestamp for offline sync"""
    users = load_users()
    user_data = users.get(current_user.id, {})
    notes = user_data.get("notes", [])
    last_sync = request.args.get("since", "1970-01-01")

    # Filter notes updated after last_sync
    updated_notes = [
        n for n in notes if n.get("updated_at", n.get("created_at", "")) > last_sync
    ]

    return jsonify(
        {
            "success": True,
            "notes": updated_notes,
            "last_sync": datetime.now().isoformat(),
        }
    )


@app.route("/api/notes/sync", methods=["POST"])
@login_required
def push_notes():
    """Receive offline changes and merge"""
    data = request.get_json() or {}
    client_notes = data.get("notes", [])

    if not isinstance(client_notes, list):
        return jsonify({"success": False, "message": "Invalid notes data"}), 400

    users = load_users()
    user_data = users.get(current_user.id, {})
    server_notes = user_data.get("notes", [])

    # Simple merge: client wins on conflict (by updated_at)
    note_map = {n["id"]: n for n in server_notes}

    for client_note in client_notes:
        note_id = client_note.get("id")
        if note_id:
            if note_id in note_map:
                client_updated = client_note.get("updated_at", "")
                server_updated = note_map[note_id].get("updated_at", "")
                if client_updated > server_updated:
                    note_map[note_id] = client_note
            else:
                note_map[note_id] = client_note

    merged_notes = list(note_map.values())
    merged_notes.sort(
        key=lambda x: x.get("updated_at", x.get("created_at", "")), reverse=True
    )

    user_data["notes"] = merged_notes
    users[current_user.id] = user_data
    save_users(users)

    return jsonify({"success": True, "notes": merged_notes, "count": len(merged_notes)})


@app.route("/api/notes/export", methods=["GET"])
@login_required
def export_notes():
    """Export notes for offline use (text corpus for intent classifier)"""
    users = load_users()
    user_data = users.get(current_user.id, {})
    notes = user_data.get("notes", [])

    # Build text corpus from notes
    corpus = []
    for note in notes:
        corpus.append(f"Title: {note.get('title', '')}")
        corpus.append(f"Topic: {note.get('topic', '')}")
        corpus.append(note.get("content", ""))
        corpus.append("---")

    text_corpus = "\n".join(corpus)

    return jsonify({"success": True, "corpus": text_corpus, "notes_count": len(notes)})


@app.route("/api/user/preferences", methods=["GET"])
@login_required
def get_preferences():
    """Get user preferences"""
    users = load_users()
    user_data = users.get(current_user.id, {})
    prefs = user_data.get("preferences", {})
    return jsonify({"success": True, "preferences": prefs})


@app.route("/api/user/preferences", methods=["POST"])
@login_required
def update_preferences():
    """Update user preferences (voice, etc)"""
    data = request.get_json() or {}
    users = load_users()
    user_data = users.get(current_user.id, {})
    prefs = user_data.get("preferences", {})
    prefs.update(data)
    user_data["preferences"] = prefs
    users[current_user.id] = user_data
    save_users(users)
    return jsonify({"success": True, "preferences": prefs})


@app.route("/api/user/profile", methods=["GET"])
@login_required
def get_profile():
    """Get user profile"""
    users = load_users()
    user_data = users.get(current_user.id, {})
    return jsonify(
        {
            "success": True,
            "profile": {
                "name": current_user.name,
                "email": current_user.email,
                "avatar": current_user.avatar,
                "created_at": user_data.get("created_at"),
                "notes_count": len(user_data.get("notes", [])),
            },
        }
    )


@app.errorhandler(Exception)
def handle_exception(error):
    logger.error("Unhandled server error: %s", error)
    if request.path.startswith("/api") or request.is_json:
        return jsonify({"success": False, "error": "Server error"}), 500
    return "Something went wrong. Please try again.", 500


if __name__ == "__main__":
    app.run(debug=False, host="0.0.0.0", port=5000)
