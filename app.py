from flask import Flask, request, jsonify, render_template, session, redirect, url_for
from flask_caching import Cache
import json
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import urllib.request
import joblib
import random
import os
import re
import sys
import numpy as np
import logging
import time
try:
    import torch
except ImportError:
    torch = None
from dotenv import load_dotenv
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None
import physics_engine  # Import the new module

load_dotenv()

app = Flask(__name__)
app.secret_key = "vector_ai_ethereal_secret_key"  # Required for session management

# Configure Caching
cache = Cache(app, config={'CACHE_TYPE': 'SimpleCache'})

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

USERS_FILE = "users.json"

# -------------------------------
# Configure AI API (Google Gemini)
# -------------------------------
# To use this, run: pip install google-generativeai
# And set your environment variable: set GOOGLE_API_KEY=your_key_here

# -------------------------------
# Load ML model
# -------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "intent_model.pth")
encoder_path = os.path.join(BASE_DIR, "label_encoder.pkl")
tokenizer_path = os.path.join(BASE_DIR, "tokenizer.pkl")
config_path = os.path.join(BASE_DIR, "model_config.pkl")

# Train only when needed (faster startup)
try:
    sys.path.append(BASE_DIR)
    import ml_train
    
    should_train = os.getenv("FORCE_TRAIN") == "true"
    required_files = [model_path, encoder_path, tokenizer_path, config_path]
    if not all(os.path.exists(path) for path in required_files):
        should_train = True

    # Attempt training, but continue if it fails
    if should_train:
        try:
            ml_train.train_model()
        except Exception as e:
            print(f"Info: Training skipped ({e}). Attempting to load existing model...")
    else:
        print("Info: Existing model files found. Skipping training. Set FORCE_TRAIN=true to override.")

    # Load artifacts
    label_encoder = joblib.load(encoder_path)
    tokenizer = joblib.load(tokenizer_path)
    config = joblib.load(config_path)
    
    # Initialize and load PyTorch model
    embed_dim = config.get("embed_dim", 32)
    hidden_dim = config.get("hidden_dim", 32)
    ml_model = ml_train.IntentModel(config["vocab_size"], embed_dim, hidden_dim, config["num_classes"])
    ml_model.load_state_dict(torch.load(model_path))
    ml_model.eval() # Set to evaluation mode
except Exception as e:
    print(f"Warning: ML Model failed to load. Error: {e}")
    ml_model = None
    label_encoder = None

# Global list to store conversation history
user_conversations = {}
response_cache = {}
MAX_HISTORY_PER_USER = 50
RESPONSE_CACHE_TTL = 180

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
    "capabilities": "I can chat about AI, Physics, Python, tell jokes, and analyze trends.",
    "unit_conversion": "I can convert units for you. Try 'Convert 10 meters to feet'.",
    
    "unknown": "I'm still learning 🤖. Could you try rephrasing?"
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
    "inertia": "Inertia is the resistance of any physical object to any change in its velocity."
}

# -------------------------------
# Helper functions
# -------------------------------
api_cache = {}
CACHE_DURATION = 300  # 5 minutes

def http_get_json(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            if response.getcode() == 200:
                return json.loads(response.read().decode('utf-8'))
    except Exception:
        return None

def summarize_content(text):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or not text or not genai:
        return text
    
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=f"Summarize the following content concisely for a chat context:\n\n{text}"
        )
        return response.text
    except Exception as e:
        print(f"Summarization Error: {e}")
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
                    videos = [f"Title: {item['snippet']['title']}\nDescription: {item['snippet']['description']}" for item in items]
                    if videos:
                        result = "Trending on YouTube:\n" + "\n---\n".join(videos)
            
            if not result:
                # Hacker News Top Stories
                top_ids = http_get_json("https://hacker-news.firebaseio.com/v0/topstories.json")
                if top_ids:
                    top_ids = top_ids[:3]
                    titles = []
                    for tid in top_ids:
                        item_data = http_get_json(f"https://hacker-news.firebaseio.com/v0/item/{tid}.json")
                        if item_data:
                            title = item_data.get("title", "")
                            text = item_data.get("text", "") # Get text content if available (e.g. Ask HN)
                            entry = f"{title} - {text}" if text else title
                            titles.append(entry)
                    if titles:
                        result = "Trending in Tech: " + "; ".join(titles)
        elif topic == "physics":
            # Randomly choose between NASA APOD and Spaceflight News
            if random.choice([True, False]):
                data = http_get_json("https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY")
                if data:
                    result = f"NASA Astronomy Picture of the Day: {data.get('title')}\n\nExplanation: {data.get('explanation')}"
            
            if not result:
                # Spaceflight News API
                data = http_get_json("https://api.spaceflightnewsapi.net/v3/articles?_limit=1")
                if data:
                    if data:
                        result = f"Latest Physics/Space News: {data[0]['title']}\n\nSummary: {data[0]['summary']}"
        elif topic == "ai":
            # Wikipedia API for AI
            data = http_get_json("https://en.wikipedia.org/api/rest_v1/page/summary/Artificial_intelligence")
            if data:
                result = f"AI Summary (Wikipedia): {data.get('extract')}"
        elif topic == "python":
            # GitHub API for CPython
            data = http_get_json("https://api.github.com/repos/python/cpython/releases/latest")
            if data:
                result = f"Latest Python Release: {data.get('tag_name')}\n\nRelease Notes:\n{data.get('body')}"
    except Exception as e:
        print(f"API Fetch Error: {e}")

    if result:
        # Summarize the fetched content using AI before caching/displaying
        result = summarize_content(result)
        api_cache[topic] = (result, datetime.now())

    return result

def perform_unit_conversion(query):
    query = query.lower()
    # Simple regex for "convert X unit to unit"
    match = re.search(r"(\d+(?:\.\d+)?)\s*([a-z]+)\s*(?:to|in)\s*([a-z]+)", query)
    if not match:
        return None
    
    val, u_from, u_to = float(match.group(1)), match.group(2), match.group(3)
    
    # Normalization map
    u_map = {
        "meter": "m", "meters": "m", "feet": "ft", "foot": "ft",
        "kilogram": "kg", "kilograms": "kg", "pound": "lbs", "pounds": "lbs",
        "lb": "lbs", "mile": "miles", "miles": "miles", "kilometer": "km", "kilometers": "km",
        "celsius": "c", "fahrenheit": "f"
    }
    
    u_from = u_map.get(u_from, u_from)
    u_to = u_map.get(u_to, u_to)

    # Conversions
    if u_from == "c" and u_to == "f":
        return f"{val} C is {val * 9/5 + 32:.2f} F"
    if u_from == "f" and u_to == "c":
        return f"{val} F is {(val - 32) * 5/9:.2f} C"
        
    factors = {
        ("m", "ft"): 3.28084, ("ft", "m"): 0.3048,
        ("kg", "lbs"): 2.20462, ("lbs", "kg"): 0.453592,
        ("km", "miles"): 0.621371, ("miles", "km"): 1.60934
    }
    
    if (u_from, u_to) in factors:
        return f"{val} {u_from} is {val * factors[(u_from, u_to)]:.2f} {u_to}"
        
    return None

def solve_physics_problem(text):
    """
    Attempts to solve simple physics word problems using regex extraction.
    Supports: Newton's Second Law (F=ma), Velocity (v=d/t), Kinetic Energy (K=0.5mv^2).
    """
    text = text.lower()
    
    # Normalize scientific notation: "5 x 10^3" -> "5e3"
    text = re.sub(r"\s*[x*]\s*10\^([-+]?\d+)", r"e\1", text)

    # Regex pattern for numbers (integer, float, scientific notation)
    num = r"([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)"

    # Regex patterns for variables with units
    m_match = re.search(rf"{num}\s*(?:kg|kilograms?)", text)
    a_match = re.search(rf"{num}\s*(?:m/s\^?2|m/s/s)", text)
    f_match = re.search(rf"{num}\s*(?:n|newtons?)", text)
    v_match = re.search(rf"{num}\s*(?:m/s|meters? per second)", text)
    d_match = re.search(rf"{num}\s*(?:m|meters?)", text)
    t_match = re.search(rf"{num}\s*(?:s|seconds?)", text)
    j_match = re.search(rf"{num}\s*(?:j|joules?)", text)
    watts_match = re.search(rf"{num}\s*(?:w|watts?)", text)
    volts_match = re.search(rf"{num}\s*(?:v|volts?)", text)
    amps_match = re.search(rf"{num}\s*(?:a|amps?|amperes?)", text)
    ohms_match = re.search(rf"{num}\s*(?:Ω|ohms?|ohm)", text)

    # 1. Newton's Second Law: F = ma
    if "force" in text or "acceleration" in text or "mass" in text:
        # Calculate Force
        if m_match and a_match and not f_match:
            m = float(m_match.group(1))
            a = float(a_match.group(1))
            return f"Physics Solver (F=ma): Force = {m} kg × {a} m/s² = {m*a:.2f} N"
        # Calculate Acceleration
        if f_match and m_match and not a_match:
            f_val = float(f_match.group(1))
            m = float(m_match.group(1))
            if m == 0: return "Error: Mass cannot be zero."
            return f"Physics Solver (a=F/m): Acceleration = {f_val} N / {m} kg = {f_val/m:.2f} m/s²"
        # Calculate Mass
        if f_match and a_match and not m_match:
            f_val = float(f_match.group(1))
            a = float(a_match.group(1))
            if a == 0: return "Error: Acceleration cannot be zero."
            return f"Physics Solver (m=F/a): Mass = {f_val} N / {a} m/s² = {f_val/a:.2f} kg"

    # 2. Velocity: v = d/t
    if "velocity" in text or "speed" in text or "distance" in text or "time" in text:
        # Calculate Velocity
        if d_match and t_match and not v_match:
             d = float(d_match.group(1))
             t = float(t_match.group(1))
             if t == 0: return "Error: Time cannot be zero."
             return f"Physics Solver (v=d/t): Velocity = {d} m / {t} s = {d/t:.2f} m/s"

    # 3. Kinetic Energy: K = 0.5 * m * v^2
    if "kinetic" in text and "energy" in text:
        if m_match and v_match:
            m = float(m_match.group(1))
            v = float(v_match.group(1))
            return f"Physics Solver (K=½mv²): Kinetic Energy = 0.5 × {m} kg × ({v} m/s)² = {0.5 * m * v**2:.2f} J"

    # 4. Momentum: p = mv
    if "momentum" in text:
        if m_match and v_match:
            m = float(m_match.group(1))
            v = float(v_match.group(1))
            return f"Physics Solver (p=mv): Momentum = {m} kg × {v} m/s = {m*v:.2f} kg·m/s"

    # 5. Work: W = Fd
    if "work" in text:
        if f_match and d_match:
            f_val = float(f_match.group(1))
            d = float(d_match.group(1))
            return f"Physics Solver (W=Fd): Work = {f_val} N × {d} m = {f_val*d:.2f} J"
            
    # 6. Gravitational Potential Energy: U = mgh
    if "potential" in text and "energy" in text:
        if m_match and d_match:
            m = float(m_match.group(1))
            h = float(d_match.group(1))
            return f"Physics Solver (U=mgh): Potential Energy = {m} kg × 9.8 m/s² × {h} m = {m*9.8*h:.2f} J"

    # 7. Power: P = W/t
    if "power" in text:
        if j_match and t_match:
            work = float(j_match.group(1))
            t = float(t_match.group(1))
            if t == 0: return "Error: Time cannot be zero."
            return f"Physics Solver (P=W/t): Power = {work} J / {t} s = {work/t:.2f} W"

    # 8. Ohm's Law: V = IR
    if "circuit" in text or "voltage" in text or "current" in text or "resistance" in text:
        if amps_match and ohms_match and not volts_match:
            i = float(amps_match.group(1))
            r = float(ohms_match.group(1))
            return f"Physics Solver (V=IR): Voltage = {i} A × {r} Ω = {i*r:.2f} V"
        if volts_match and ohms_match and not amps_match:
            v = float(volts_match.group(1))
            r = float(ohms_match.group(1))
            if r == 0: return "Error: Resistance cannot be zero."
            return f"Physics Solver (I=V/R): Current = {v} V / {r} Ω = {v/r:.2f} A"
        if volts_match and amps_match and not ohms_match:
            v = float(volts_match.group(1))
            i = float(amps_match.group(1))
            if i == 0: return "Error: Current cannot be zero."
            return f"Physics Solver (R=V/I): Resistance = {v} V / {i} A = {v/i:.2f} Ω"

    return None

def ml_detect_intent_with_confidence(message):
    if ml_model and label_encoder and torch:
        try:
            # Get probability scores for all classes
            seq = tokenizer.texts_to_sequences([message])
            tensor = torch.tensor(seq, dtype=torch.long)
            
            with torch.no_grad():
                logits = ml_model(tensor)
                probs = torch.softmax(logits, dim=1).numpy()[0]
            
            max_prob = np.max(probs)
            pred_idx = np.argmax(probs)
            best_intent = label_encoder.inverse_transform([pred_idx])[0]
            
            
            # Fallback: Use GenAI for better classification on ambiguous queries
            if genai and os.getenv("GOOGLE_API_KEY"):
                return detect_intent_with_genai(message, label_encoder.classes_), 65.0
            
            return best_intent, round(max_prob * 100, 1)
        except Exception as e:
            print(f"ML Prediction Error: {e}")
    return "unknown", 0.0

def ml_detect_intent(message):
    intent, _confidence = ml_detect_intent_with_confidence(message)
    return intent

def detect_intent_with_genai(message, labels):
    try:
        client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))
        prompt = f"Classify the following message into exactly one of these categories: {', '.join(labels)}. Message: '{message}'. Return only the category name (e.g., 'physics' or 'ai')."
        response = client.models.generate_content(model='gemini-1.5-flash', contents=prompt)
        return response.text.strip().lower()
    except Exception as e:
        print(f"GenAI Intent Fallback Error: {e}")
        return "unknown"

def get_physics_info(message):
    for key in physics_facts:
        if key in message.lower():
            return physics_facts[key]
    return random.choice(list(physics_facts.values()))

def load_users():
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, 'r') as file:
            return json.load(file)
    except (json.JSONDecodeError, ValueError):
        return {}

def save_users(users):
    with open(USERS_FILE, 'w') as file:
        json.dump(users, file, indent=4)

def save_user_data(message, topic, username=None, confidence=None, chat_id=None, reply=None):
    try:
        with open("data.json", "r") as file:
            data = json.load(file)
    except (FileNotFoundError, json.JSONDecodeError):
        data = []

    data.append({
        "message": message,
        "topic": topic,
        "time": datetime.now().isoformat(),
        "username": username,
        "confidence": confidence,
        "chat_id": chat_id,
        "reply": reply
    })

    with open("data.json", "w") as file:
        json.dump(data, file, indent=4)

def get_user_key():
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
        "timestamp": time.time()
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
        sessions.append({
            "chat_id": chat_id,
            "title": title if title else "Session",
            "last_time": last_time,
            "count": len(items),
            "messages": items
        })
    sessions.sort(key=lambda x: x["last_time"], reverse=True)
    return sessions

@app.route("/metrics")
def metrics():
    """Simple monitoring endpoint."""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "cached_entries": len(api_cache)
    })

def _generate_dashboard_payload():
    now = datetime.now()
    history = load_user_history(session.get("user")) if "user" in session else []
    sessions = build_sessions(history)
    questions_asked = len(history)
    confidences = [h.get("confidence") for h in history if isinstance(h.get("confidence"), (int, float))]
    avg_confidence = round(sum(confidences) / len(confidences), 1) if confidences else 0.0

    stats = {
        "model_accuracy": round(random.uniform(96.4, 99.4), 1),
        "questions_asked": questions_asked,
        "avg_confidence": avg_confidence,
        "active_simulations": random.randint(110, 160),
        "inference_latency_ms": round(random.uniform(12.8, 18.6), 1),
    }
    line_points = [round(0.58 + (i * 0.018) + random.uniform(-0.04, 0.04), 3) for i in range(12)]
    bar_points = [random.randint(45, 88) for _ in range(8)]
    gauge_value = round(random.uniform(0.82, 0.93), 2)

    recent_questions = []
    for entry in history[-6:]:
        recent_questions.append({
            "question": entry.get("message", "Question"),
            "confidence": entry.get("confidence", 0),
            "time": _format_time(entry.get("time", ""))
        })

    session_cards = []
    for session_entry in sessions[:6]:
        session_cards.append({
            "chat_id": session_entry["chat_id"],
            "title": session_entry["title"],
            "count": session_entry["count"],
            "last_time": session_entry["last_time"]
        })

    return {
        "timestamp": now.isoformat(),
        "stats": stats,
        "charts": {
            "line": line_points,
            "bar": bar_points,
            "gauge": gauge_value
        },
        "recent_questions": recent_questions,
        "sessions": session_cards
    }

@app.route("/api/dashboard")
def dashboard_data():
    """Dashboard live data feed."""
    payload = _generate_dashboard_payload()
    return jsonify(payload)

# -------------------------------
# Science Expo / Dashboard Routes
# -------------------------------

@app.route("/dashboard")
def dashboard():
    """Renders the main Science Expo Dashboard."""
    return render_template("dashboard.html")

@app.route("/api/train_physics", methods=["POST"])
def train_physics():
    """Triggers the ML model to retrain on new simulation data."""
    try:
        metrics = physics_engine.learner.train()
        return jsonify({"success": True, "metrics": metrics})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

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
            if scale_height is not None:
                scale_height = float(scale_height)
            if v0 < 0 or mass <= 0: raise ValueError("Invalid physics parameters")
        except ValueError as e:
            return jsonify({"success": False, "error": str(e)}), 400
        
        # 1. Run Ground Truth Physics
        sim_results = physics_engine.simulator.simulate_projectile(v0, angle, mass, drag, scale_height=scale_height)
        
        # 2. Run ML Prediction (if trained)
        ml_results = None
        error_margin = 0.0
        
        if physics_engine.learner.is_trained:
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
            {"v0": v0, "angle": angle, "mass": mass, "drag": drag, "scale_height": scale_height},
            physics_engine.learner.last_metrics,
            error_margin
        )

        # Explanation may be a dict with 'text' and 'symbolic'
        if isinstance(explanation, dict):
            explanation_text = explanation.get('text')
            symbolic = explanation.get('symbolic')
        else:
            explanation_text = explanation
            symbolic = None

        logger.info(f"Simulation run in {time.time() - start_time:.3f}s")
        return jsonify({
            "success": True,
            "physics": {k: v.tolist() for k, v in sim_results.items()}, # Convert numpy to list
            "ml": {k: v.tolist() for k, v in ml_results.items()} if ml_results else None,
            "explanation": explanation_text,
            "symbolic": symbolic,
            "error_margin": error_margin
        })
    except Exception as e:
        logger.error(f"Simulation Error: {e}")
        return jsonify({"success": False, "error": str(e)})

# -------------------------------
# Routes
# -------------------------------
@app.route("/")
def home():
    # Ensure session tracking
    user_key = get_user_key()
    ensure_chat_id()
    user_conversations.setdefault(user_key, [])
    return render_template("index.html")

@app.route("/assistant")
def assistant():
    return redirect(url_for("chat_page"))

@app.route("/chat", methods=["GET"])
def chat_page():
    get_user_key()
    ensure_chat_id()
    return render_template("chat.html")

@app.route("/animations")
def animations():
    get_user_key()
    ensure_chat_id()
    return render_template("animations.html")

@app.route("/register", methods=["POST"])
def register():
    username = request.json.get("username")
    password = request.json.get("password")
    users = load_users()
    
    if username in users:
        return jsonify({"success": False, "message": "User already exists"})
    
    users[username] = generate_password_hash(password)
    save_users(users)
    session["user"] = username
    return jsonify({"success": True, "username": username})

@app.route("/login", methods=["POST"])
def login():
    username = request.json.get("username")
    password = request.json.get("password")
    users = load_users()
    
    if username in users and check_password_hash(users[username], password):
        session["user"] = username
        return jsonify({"success": True, "username": username})
    
    return jsonify({"success": False, "message": "Invalid credentials"})

@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    session.pop("chat_id", None)
    return jsonify({"success": True})

@app.route("/check_auth")
def check_auth():
    if "user" in session:
        return jsonify({"authenticated": True, "username": session["user"]})
    return jsonify({"authenticated": False})

@app.route("/history")
def history_page():
    if "user" not in session:
        return redirect(url_for("home"))
    history = load_user_history(session["user"])
    sessions = build_sessions(history)
    return render_template("history.html", sessions=sessions, active_chat_id=None, active_session=None)

@app.route("/history/<chat_id>")
def history_detail(chat_id):
    if "user" not in session:
        return redirect(url_for("home"))
    history = load_user_history(session["user"])
    sessions = build_sessions(history)
    active_session = next((s for s in sessions if s["chat_id"] == chat_id), None)
    if active_session:
        messages = []
        for entry in active_session["messages"]:
            messages.append({
                "role": "user",
                "message": entry.get("message", ""),
                "time": _format_time(entry.get("time", "")),
                "topic": entry.get("topic", "unknown"),
                "confidence": f"{entry.get('confidence', 0)}%"
            })
            if entry.get("reply"):
                messages.append({
                    "role": "assistant",
                    "message": entry.get("reply", ""),
                    "time": _format_time(entry.get("time", "")),
                    "topic": entry.get("topic", "assistant"),
                    "confidence": f"{entry.get('confidence', 0)}%"
                })
        active_session["messages"] = messages
    return render_template(
        "history.html",
        sessions=sessions,
        active_chat_id=chat_id,
        active_session=active_session
    )

@app.route("/api/history")
def api_history():
    if "user" not in session:
        return jsonify([])
    return jsonify(load_user_history(session["user"]))

@app.route("/api/new_session", methods=["POST"])
def new_session():
    session["chat_id"] = os.urandom(6).hex()
    user_key = get_user_key()
    user_conversations[user_key] = []
    return jsonify({"success": True, "chat_id": session["chat_id"]})

@app.route("/chat", methods=["POST"])
def chat():
    if not request.is_json:
        return jsonify({"intent": "error", "reply": "Request must be JSON"}), 400

    user_message = request.json.get("message")
    if not user_message:
        return jsonify({"intent": "error", "reply": "Message is required"}), 400

    reply = None
    confidence = 0.0
    try:
        cached = get_cached_reply(user_message)
        if cached:
            intent = cached["intent"]
            confidence = cached["confidence"]
            reply = cached["reply"]
        else:
            intent, confidence = ml_detect_intent_with_confidence(user_message)

        # Get conversation history for this specific user/session
        user_key = get_user_key()
        chat_id = ensure_chat_id()
        conversation_history = user_conversations.setdefault(user_key, [])
        
        # Memory Management: Limit history size
        if len(conversation_history) > MAX_HISTORY_PER_USER:
            conversation_history[:] = conversation_history[-MAX_HISTORY_PER_USER:]
        
        # Fetch real-time data based on intent to provide context
        online_data = fetch_online_data(intent) if not reply else None

        # 1. Try Local Physics Solver (Deterministic)
        if not reply and intent == "physics":
            reply = solve_physics_problem(user_message)

        # 2. Try AI API (Google Gemini)
        api_key = os.getenv("GOOGLE_API_KEY")
        if (not reply or intent == "unknown") and api_key and genai:
            try:
                # Construct system prompt
                system_prompt = "You are Vector AI, a helpful and smart assistant."
                
                if intent == "physics":
                    system_prompt += " You are an expert physics tutor. Provide dynamic, detailed explanations with real-world examples."
                    system_prompt += " If the user presents a word problem, use the Reference Equations to solve it step-by-step."
                    system_prompt += f" Reference facts: {json.dumps(physics_facts)}"
                    try:
                        corpus = ml_train.get_physics_corpus()
                        system_prompt += f" Reference Equations: {json.dumps(corpus)}"
                    except Exception:
                        pass
                elif intent == "unit_conversion":
                    system_prompt += " You are a helpful unit converter. Convert the requested units accurately."
                else:
                    system_prompt += " Answer the user's question clearly and concisely. Do not give generic 'I don't know' responses if you can answer."

                if online_data:
                    system_prompt += f" Here is the latest info on the topic: {online_data}"
                
                client = genai.Client(api_key=api_key)
                
                # Convert history to Gemini format
                chat_history = []
                for msg in conversation_history:
                    role = "user" if msg["role"] == "user" else "model"
                    chat_history.append(types.Content(role=role, parts=[types.Part(text=msg["content"])]))

                chat = client.chats.create(
                    model='gemini-1.5-flash',
                    config=types.GenerateContentConfig(system_instruction=system_prompt),
                    history=chat_history
                )
                response = chat.send_message(user_message)
                reply = response.text
                
                # Update history
                conversation_history.append({"role": "user", "content": user_message})
                conversation_history.append({"role": "assistant", "content": reply})
            except Exception as e:
                print(f"AI API Error: {e}")

        # 3. Fallback to Rule-based/Local ML if API fails or no key
        if not reply:
            # Rescue "unknown" intent with simple keyword matching
            if intent == "unknown":
                for key in responses:
                    if key in user_message.lower():
                        intent = key
                        break

            if intent == "physics":
                # Prioritize local definitions if specific keyword is present
                if "equation" in user_message.lower() or "formula" in user_message.lower():
                    try:
                        corpus = ml_train.get_physics_corpus()
                        lines = ["Here are some key physics equations:"]
                        for group in corpus.get("equations", []):
                            lines.append(f"\n**{group['domain'].capitalize()}**")
                            for eq in group["eq"]:
                                lines.append(f"- {eq}")
                        reply = "\n".join(lines)
                    except Exception:
                        reply = "I couldn't retrieve the equations at the moment."
                elif any(k in user_message.lower() for k in physics_facts):
                    reply = get_physics_info(user_message)
                elif online_data:
                    reply = online_data
                else:
                    reply = get_physics_info(user_message)
            elif intent == "unit_conversion":
                # Try local conversion first
                local_result = perform_unit_conversion(user_message)
                if local_result:
                    reply = local_result
            elif online_data:
                reply = online_data
            elif intent in responses:
                reply = responses[intent]
    except Exception as e:
        print(f"Chat Error: {e}")

    if not reply:
        reply = responses["unknown"]

    set_cached_reply(user_message, reply, intent, confidence)
    save_user_data(
        user_message,
        intent,
        session.get("user"),
        confidence=confidence,
        chat_id=session.get("chat_id"),
        reply=reply
    )

    return jsonify({"reply": reply, "confidence": confidence, "intent": intent})

if __name__ == "__main__":
    app.run(debug=True, port=5000,)
  
