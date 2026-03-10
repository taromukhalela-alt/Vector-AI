import os
import random
from pathlib import Path

try:
    from google import genai
except ImportError:
    genai = None

try:
    from transformers import pipeline
except ImportError:
    pipeline = None

from prompts.intent_prompts import INTENT_PROMPTS

BASE_DIR = Path(__file__).resolve().parents[1]
SYSTEM_PROMPT_PATH = BASE_DIR / "prompts" / "system_prompt.txt"

MAX_HISTORY = 10
OFF_TOPIC_THRESHOLD = 0.4
OFF_TOPIC_RESPONSE = (
    "That's an interesting question. I can give a quick, simple answer, then let's "
    "switch back to CAPS physics topics like forces, waves, electricity, or energy."
)
FOLLOW_UP_PROMPTS = [
    "Does that make sense so far?",
    "Would you like me to show a worked example?",
    "Can you tell me what you already know about this topic?",
    "Which part are you most unsure about?",
]
PHYSICS_INTENTS = {
    "physics",
    "kinematics",
    "dynamics",
    "projectile_motion",
    "forces",
    "momentum",
    "energy",
    "gravitation",
    "waves",
    "electricity",
    "magnetism",
    "optics",
    "thermodynamics",
    "nuclear",
    "shm",
}
ANTI_REPETITION_SUFFIX = """

IMPORTANT: Check the conversation history above carefully.
- Do NOT repeat any question you already asked.
- If the student just said yes/agreed, PROVIDE the thing you offered - do not ask again.
- If you already gave this explanation, try a completely different angle.
- Never start your response with "Great question!" more than once per conversation.
"""

_generator = None
PHYSICS_SNIPPETS = {
    "mechanics": "In mechanics, start by listing known values, choose the right formula, then substitute with units.",
    "waves": "For waves, connect frequency, wavelength, and speed with v = f * lambda.",
    "electricity": "For electricity, use Ohm's law V = IR and check unit consistency for volts, amps, and ohms.",
    "energy": "For energy problems, identify the energy type first, then use Ek = 1/2mv^2 or Ep = mgh where appropriate.",
}


def load_system_prompt():
    try:
        return SYSTEM_PROMPT_PATH.read_text(encoding="utf-8").strip()
    except Exception:
        return (
            "You are Vector AI, a CAPS-aligned physics tutor for South African high school students. "
            "Use simple explanations, stay on physics topics, and ask one follow-up question."
        )


def _get_local_generator():
    global _generator
    if _generator is not None:
        return _generator
    if pipeline is None:
        return None

    # Small and commonly available fallback. If unavailable, caller falls back gracefully.
    for model_name in ["gpt2", "distilgpt2"]:
        try:
            _generator = pipeline("text-generation", model=model_name)
            return _generator
        except Exception:
            continue
    return None


def normalize_history(history):
    if not isinstance(history, list):
        return []
    out = []
    for msg in history:
        if not isinstance(msg, dict):
            continue
        role = msg.get("role")
        content = (msg.get("content") or "").strip()
        if role not in {"user", "assistant"} or not content:
            continue
        out.append({"role": role, "content": content})
    return out[-MAX_HISTORY:]


def normalize_confidence(confidence):
    try:
        value = float(confidence)
    except (TypeError, ValueError):
        return 0.0
    return value / 100.0 if value > 1 else value


def choose_follow_up(intent):
    if intent in PHYSICS_INTENTS:
        return "Would you like a worked example from a CAPS-style exam question?"
    return random.choice(FOLLOW_UP_PROMPTS)


def is_off_topic(intent, confidence):
    if intent in PHYSICS_INTENTS:
        return False
    return normalize_confidence(confidence) < OFF_TOPIC_THRESHOLD


def build_prompt(history, user_message, intent):
    system_prompt = load_system_prompt()
    intent_hint = INTENT_PROMPTS.get(intent, INTENT_PROMPTS.get("unknown", ""))
    lines = [system_prompt, "", f"Intent hint: {intent_hint}"]

    for item in normalize_history(history):
        role = "User" if item["role"] == "user" else "Assistant"
        lines.append(f"{role}: {item['content']}")

    lines.append(f"User: {user_message}")
    lines.append(ANTI_REPETITION_SUFFIX.strip())
    lines.append("Assistant:")
    return "\n".join(lines)


def _gemini_generate(prompt):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or genai is None:
        return None
    try:
        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model="gemini-1.5-flash",
            contents=prompt,
        )
        text = (response.text or "").strip()
        return text or None
    except Exception:
        return None


def _local_generate(prompt):
    generator = _get_local_generator()
    if generator is None:
        return None
    try:
        output = generator(prompt, max_new_tokens=140, do_sample=True, temperature=0.7)
        text = output[0]["generated_text"]
        if text.startswith(prompt):
            text = text[len(prompt):]
        return text.strip() or None
    except Exception:
        return None


def _pick_physics_snippet(user_message):
    text = (user_message or "").lower()
    if any(word in text for word in ["wave", "wavelength", "frequency", "sound"]):
        return PHYSICS_SNIPPETS["waves"]
    if any(word in text for word in ["voltage", "current", "resistance", "circuit", "ohm"]):
        return PHYSICS_SNIPPETS["electricity"]
    if any(word in text for word in ["kinetic", "potential", "power", "work", "energy"]):
        return PHYSICS_SNIPPETS["energy"]
    return PHYSICS_SNIPPETS["mechanics"]


def _rule_based_physics_reply(user_message, deterministic_hint=None):
    base = _pick_physics_snippet(user_message)
    parts = [
        base,
        "If you want a full solution, I can walk step-by-step from known values to final answer.",
    ]
    if deterministic_hint:
        parts.append(f"Using your given values, a useful result is: {deterministic_hint}.")
    return " ".join(parts)


def _rule_based_non_physics_reply(intent, deterministic_hint=None):
    if intent == "unit_conversion" and deterministic_hint:
        return f"Sure. {deterministic_hint}."
    if intent == "greeting":
        return "Hi, I am Vector AI. Ask me any CAPS physics question from mechanics, waves, electricity, or energy."
    if intent == "capabilities":
        return "I can explain CAPS physics concepts, solve short numeric questions, and give worked examples."
    return "I can help with CAPS physics topics. Ask me about mechanics, waves, electricity, or energy."


def _sanitize_generated_reply(reply):
    if not reply:
        return reply
    cleaned = reply.strip()
    for marker in ["User:", "Assistant:", "Intent hint:"]:
        if marker in cleaned:
            cleaned = cleaned.split(marker)[0].strip()
    return cleaned


def generate_response(prompt, intent, user_message, confidence, deterministic_hint=None):
    if is_off_topic(intent, confidence):
        if intent != "unknown":
            brief = _rule_based_non_physics_reply(intent, deterministic_hint=deterministic_hint)
            return (
                f"{brief} If you want, ask me a CAPS physics question next."
            )
        return OFF_TOPIC_RESPONSE

    reply = _gemini_generate(prompt)
    if not reply:
        if intent in PHYSICS_INTENTS:
            reply = _rule_based_physics_reply(user_message, deterministic_hint=deterministic_hint)
        else:
            reply = _rule_based_non_physics_reply(intent, deterministic_hint=deterministic_hint)
    if not reply:
        reply = _local_generate(prompt)
    reply = _sanitize_generated_reply(reply)
    if not reply:
        reply = "I can help with CAPS physics topics. Ask me about mechanics, waves, electricity, or energy."

    follow_up = choose_follow_up(intent)
    if follow_up not in reply:
        reply = f"{reply.rstrip()}\n\n{follow_up}"
    return reply
