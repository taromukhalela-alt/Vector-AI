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

from backend.prompts.intent_prompts import INTENT_PROMPTS

BASE_DIR = Path(__file__).resolve().parents[1]
SYSTEM_PROMPT_PATH = BASE_DIR / "prompts" / "system_prompt.txt"

MAX_HISTORY = 10
OFF_TOPIC_THRESHOLD = 0.4
OFF_TOPIC_RESPONSE = (
    "That's an interesting question. I can give a quick, simple answer, then let's "
    "switch back to CAPS subjects like Physical Sciences, Mathematics, or Life Sciences."
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
CHEMISTRY_INTENTS = {
    "chemistry",
    "chemical_bonding",
    "chemical_reactions",
    "stoichiometry",
    "acids_bases",
    "organic_chemistry",
}
MATHEMATICS_INTENTS = {
    "mathematics",
    "algebra",
    "calculus",
    "trigonometry",
    "geometry",
    "statistics",
}
LIFE_SCIENCES_INTENTS = {
    "life_sciences",
    "cells",
    "genetics",
    "evolution",
    "human_biology",
    "ecology",
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
CHEMISTRY_SNIPPETS = {
    "reactions": "For chemical reactions, balance the equation first, then use mole ratios.",
    "acids_bases": "For acids and bases, identify the type, then use pH = -log[H+] or relevant formulas.",
    "stoichiometry": "For stoichiometry, convert to moles, use the mole ratio, then convert back to desired units.",
}
MATHEMATICS_SNIPPETS = {
    "algebra": "For algebra, identify the variable to solve for, then isolate it using inverse operations.",
    "calculus": "For calculus, identify if it's differentiation or integration, then apply the appropriate rule.",
    "trigonometry": "For trigonometry, identify the sides and angles, then choose sine, cosine, or tangent.",
}
LIFE_SCIENCES_SNIPPETS = {
    "cells": "For cell biology, identify cell type and structure, then explain function.",
    "genetics": "For genetics, determine genotype/phenotype, then use Punnett squares for predictions.",
    "ecology": "For ecology, identify the ecosystem components and their relationships.",
}


def load_system_prompt(user_key=None):
    try:
        base = SYSTEM_PROMPT_PATH.read_text(encoding="utf-8").strip()
    except Exception:
        base = (
            "You are Vector AI, a CAPS-aligned physics tutor for South African high school students. "
            "Use simple explanations, stay on physics topics, and ask one follow-up question."
        )
    if not user_key:
        return base
    try:
        users_file = BASE_DIR / "users.json"
        if users_file.exists():
            users = json.loads(users_file.read_text(encoding="utf-8"))
            user_data = users.get(user_key, {})
            summary = (user_data.get("memory_summary") or "").strip()
            if summary:
                return f"{base}\n\n## What you remember from past sessions with this student:\n{summary}"
    except Exception:
        pass
    return base


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
    all_subject_intents = PHYSICS_INTENTS | CHEMISTRY_INTENTS | MATHEMATICS_INTENTS | LIFE_SCIENCES_INTENTS
    if intent in all_subject_intents:
        return "Would you like a worked example from a CAPS-style exam question?"
    return random.choice(FOLLOW_UP_PROMPTS)


def is_off_topic(intent, confidence):
    all_subject_intents = PHYSICS_INTENTS | CHEMISTRY_INTENTS | MATHEMATICS_INTENTS | LIFE_SCIENCES_INTENTS
    if intent in all_subject_intents:
        return False
    return normalize_confidence(confidence) < OFF_TOPIC_THRESHOLD


def build_prompt(history, user_message, intent, user_key=None):
    system_prompt = load_system_prompt(user_key)
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
            model="gemini-3.5-flash",
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


def _pick_subject_snippet(user_message):
    text = (user_message or "").lower()
    # Chemistry keywords
    if any(word in text for word in ["chemical", "reaction", "molecule", "compound", "acid", "base", "ph", "stoichiometry", "mole", "element", "bond"]):
        if any(word in text for word in ["acid", "base", "ph"]):
            return CHEMISTRY_SNIPPETS["acids_bases"]
        if any(word in text for word in ["reaction", "react", "product"]):
            return CHEMISTRY_SNIPPETS["reactions"]
        return CHEMISTRY_SNIPPETS["stoichiometry"]
    # Mathematics keywords
    if any(word in text for word in ["math", "algebra", "equation", "solve", "calculate", "function", "derivative", "integral", "trig", "sin", "cos", "tan", "geometry", "triangle", "angle", "statistics", "probability"]):
        if any(word in text for word in ["deriv", "integr", "calculus"]):
            return MATHEMATICS_SNIPPETS["calculus"]
        if any(word in text for word in ["sin", "cos", "tan", "trig"]):
            return MATHEMATICS_SNIPPETS["trigonometry"]
        return MATHEMATICS_SNIPPETS["algebra"]
    # Life Sciences keywords
    if any(word in text for word in ["cell", "dna", "gene", "genetics", "evolution", "ecology", "organism", "biology", "photosynthesis", "respiration", "human", "body", "system"]):
        if any(word in text for word in ["cell", "membrane", "organelle"]):
            return LIFE_SCIENCES_SNIPPETS["cells"]
        if any(word in text for word in ["dna", "gene", "genetic", "inherit", "punnett"]):
            return LIFE_SCIENCES_SNIPPETS["genetics"]
        return LIFE_SCIENCES_SNIPPETS["ecology"]
    # Default to physics
    if any(word in text for word in ["wave", "wavelength", "frequency", "sound"]):
        return PHYSICS_SNIPPETS["waves"]
    if any(word in text for word in ["voltage", "current", "resistance", "circuit", "ohm"]):
        return PHYSICS_SNIPPETS["electricity"]
    if any(word in text for word in ["kinetic", "potential", "power", "work", "energy"]):
        return PHYSICS_SNIPPETS["energy"]
    return PHYSICS_SNIPPETS["mechanics"]


def _rule_based_physics_reply(user_message, deterministic_hint=None):
    base = _pick_subject_snippet(user_message)
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
        return "Hi, I am Vector AI. Ask me any CAPS question from Physical Sciences (physics/chemistry), Mathematics, or Life Sciences."
    if intent == "capabilities":
        return "I can explain CAPS concepts across Physical Sciences, Mathematics, and Life Sciences, solve problems step-by-step, and give worked examples."
    return "I can help with CAPS subjects. Ask me about Physical Sciences, Mathematics, or Life Sciences topics."


def _sanitize_generated_reply(reply):
    if not reply:
        return reply
    cleaned = reply.strip()
    for marker in ["User:", "Assistant:", "Intent hint:"]:
        if marker in cleaned:
            cleaned = cleaned.split(marker)[0].strip()
    return cleaned

