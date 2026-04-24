from __future__ import annotations

import math
import re
from typing import Dict, List, Optional, Tuple


DEFAULT_G = 9.8
NUM_PATTERN = r"([-+]?\d+(?:\.\d+)?(?:e[-+]?\d+)?)"


TOPIC_DATA = {
    "physics": {
        "title": "General Physics",
        "summary": "Physics studies matter, energy, forces, and motion.",
        "keywords": ["physics", "science", "matter", "energy", "motion", "force"],
        "definitions": {
            "physics": "Physics is the study of matter, energy, forces, and motion.",
            "measurement": "A measurement compares something with a standard unit.",
            "scientific method": "The scientific method means asking questions, testing ideas, and checking evidence.",
        },
    },
    "kinematics": {
        "title": "Kinematics",
        "summary": "Kinematics describes motion using displacement, velocity, acceleration, and time.",
        "keywords": ["kinematics", "velocity", "speed", "acceleration", "distance", "time"],
        "definitions": {
            "velocity": "Velocity is speed in a specific direction.",
            "acceleration": "Acceleration is the rate at which velocity changes.",
            "displacement": "Displacement is the straight-line change in position with direction.",
        },
    },
    "projectile_motion": {
        "title": "Projectile Motion",
        "summary": "Projectile motion combines horizontal motion with vertical motion under gravity.",
        "keywords": ["projectile", "launch", "angle", "trajectory", "range", "thrown"],
        "definitions": {
            "projectile motion": "Projectile motion is the curved path followed by an object moving under gravity.",
            "range": "Range is the horizontal distance travelled by a projectile.",
            "maximum height": "Maximum height is the highest vertical position reached by the projectile.",
        },
    },
    "dynamics": {
        "title": "Dynamics",
        "summary": "Dynamics studies the forces that cause changes in motion.",
        "keywords": ["dynamics", "newton", "laws", "force", "inertia"],
        "definitions": {
            "newton's first law": "An object will remain in its state of rest or motion at constant velocity unless a non zero resultant force acts on it.",
            "newton's second law": "When a resultant force acts on an object, the object accelerates in the direction of the force. The acceleration is directly proportional to the resultant force and inversely proportional to the mass of the object.",
            "newton's third law": "When one body exerts a force on a second body, the second body simultaneously exerts a force equal in magnitude and opposite in direction on the first body.",
            "inertia": "Inertia is the tendency of an object to resist any change in its state of rest or motion.",
        },
    },
    "forces": {
        "title": "Forces",
        "summary": "Forces are pushes or pulls that can change motion, shape, or direction.",
        "keywords": ["force", "friction", "weight", "normal force", "tension"],
        "definitions": {
            "force": "A force is an interaction between two objects.",
            "weight": "Weight is the gravitational force that the Earth exerts on an object.",
            "friction": "Friction is a force that opposes the motion or attempted motion of an object in contact with a surface.",
        },
    },
    "momentum": {
        "title": "Momentum",
        "summary": "Momentum connects mass and velocity and helps explain collisions.",
        "keywords": ["momentum", "collision", "impulse", "conservation"],
        "definitions": {
            "momentum": "Momentum is the product of an object's mass and velocity.",
            "impulse": "Impulse is the product of the net force acting on an object and the time for which it acts. It is equal to the change in momentum.",
        },
    },
    "energy": {
        "title": "Energy",
        "summary": "Energy is the ability to do work, while power tells us how fast work is done.",
        "keywords": ["energy", "kinetic", "potential", "work", "power", "efficiency"],
        "definitions": {
            "kinetic energy": "Kinetic energy is the energy of motion.",
            "potential energy": "Potential energy is stored energy because of position.",
            "power": "Power is the rate at which work is done.",
        },
    },
    "waves": {
        "title": "Waves",
        "summary": "Waves transfer energy and can be described using speed, frequency, wavelength, and period.",
        "keywords": ["wave", "sound", "frequency", "wavelength", "period", "amplitude"],
        "definitions": {
            "wave": "A wave is a disturbance that transfers energy.",
            "frequency": "Frequency is the number of pulses or waves produced per second.",
            "wavelength": "Wavelength is the distance between two successive points in phase.",
        },
    },
    "electricity": {
        "title": "Electricity",
        "summary": "Electricity covers charge flow, circuits, voltage, current, resistance, and electrical power.",
        "keywords": ["electricity", "current", "voltage", "resistance", "ohm", "circuit"],
        "definitions": {
            "current": "Current is the rate of flow of charge past a point in a circuit.",
            "potential difference": "Potential difference across a component is the energy transferred per unit charge.",
            "voltage": "Voltage is another name for potential difference, which is the energy transferred per unit charge.",
            "resistance": "Resistance is the extent to which a circuit or component opposes the flow of charge.",
            "ohm's law": "At constant temperature, the current in a conductor is directly proportional to the potential difference across the conductor.",
        },
    },
    "electrostatics": {
        "title": "Electrostatics",
        "summary": "Electrostatics studies electric charges at rest and the forces between them.",
        "keywords": ["charge", "electrostatics", "coulomb", "electric field"],
        "definitions": {
            "charge": "Charge is a property of matter that causes electric forces.",
            "electric field": "An electric field is a region in space in which an electric charge experiences a force.",
        },
    },
    "magnetism": {
        "title": "Magnetism",
        "summary": "Magnetism includes magnetic fields, induction, and motors.",
        "keywords": ["magnetism", "magnetic", "field", "motor", "generator", "induction"],
        "definitions": {
            "magnetic field": "A magnetic field is the region where a magnetic force can be detected.",
            "electromagnet": "An electromagnet is a magnet produced by electric current.",
        },
    },
    "optics": {
        "title": "Optics",
        "summary": "Optics studies reflection, refraction, lenses, mirrors, and image formation.",
        "keywords": ["optics", "light", "reflection", "refraction", "lens", "mirror"],
        "definitions": {
            "reflection": "Reflection is the bouncing of light off a surface.",
            "refraction": "Refraction is the bending of light when it enters a different medium.",
            "refractive index": "Refractive index measures how much light slows down in a medium.",
        },
    },
    "gravitation": {
        "title": "Gravitation",
        "summary": "Gravitation describes the attraction between masses and explains weight and orbits.",
        "keywords": ["gravity", "gravitation", "orbit", "planet", "satellite"],
        "definitions": {
            "gravity": "Gravity is the attractive force between objects with mass.",
            "mass": "Mass is the amount of matter in an object.",
        },
    },
    "thermodynamics": {
        "title": "Thermodynamics",
        "summary": "Thermodynamics looks at heat, temperature, pressure, and gas behaviour.",
        "keywords": ["heat", "temperature", "pressure", "volume", "gas", "thermodynamics"],
        "definitions": {
            "temperature": "Temperature shows how hot or cold something is.",
            "heat": "Heat is energy transferred because of a temperature difference.",
            "pressure": "Pressure is force per unit area.",
        },
    },
    "nuclear": {
        "title": "Nuclear Physics",
        "summary": "Nuclear physics includes radioactivity, decay, half-life, fission, and fusion.",
        "keywords": ["nuclear", "radioactive", "half life", "decay", "fission", "fusion"],
        "definitions": {
            "radioactivity": "Radioactivity is the spontaneous emission of particles or radiation from unstable nuclei.",
            "half-life": "Half-life is the time taken for half the nuclei in a sample to decay.",
        },
    },
    "shm": {
        "title": "Simple Harmonic Motion",
        "summary": "Simple harmonic motion is repeating motion where the restoring force points toward equilibrium.",
        "keywords": ["shm", "oscillation", "spring", "pendulum", "period"],
        "definitions": {
            "simple harmonic motion": "Simple harmonic motion is an oscillation where the restoring force points toward equilibrium.",
            "oscillation": "An oscillation is one complete back-and-forth motion.",
        },
    },
}


FORMULA_BANK = [
    {
        "name": "Average velocity",
        "topic": "kinematics",
        "equation": "v = d / t",
        "keywords": ["velocity", "speed", "distance", "displacement", "time"],
        "variables": {
            "v": {"label": "velocity", "units": ["m/s"], "aliases": ["velocity", "speed"]},
            "d": {"label": "distance", "units": ["m", "meter", "meters"], "aliases": ["distance", "displacement"]},
            "t": {"label": "time", "units": ["s", "second", "seconds"], "aliases": ["time", "duration"]},
        },
        "solvers": {
            "v": lambda values: values["d"] / values["t"],
            "d": lambda values: values["v"] * values["t"],
            "t": lambda values: values["d"] / values["v"],
        },
        "examples": ["Find velocity if distance is 100 m and time is 5 s"],
    },
    {
        "name": "Acceleration",
        "topic": "kinematics",
        "equation": "a = (v - u) / t",
        "keywords": ["acceleration", "initial velocity", "final velocity"],
        "variables": {
            "a": {"label": "acceleration", "units": ["m/s^2", "m/s2"], "aliases": ["acceleration"]},
            "v": {"label": "final velocity", "units": ["m/s"], "aliases": ["final velocity", "velocity"]},
            "u": {"label": "initial velocity", "units": ["m/s"], "aliases": ["initial velocity", "starting velocity"]},
            "t": {"label": "time", "units": ["s", "second", "seconds"], "aliases": ["time"]},
        },
        "solvers": {
            "a": lambda values: (values["v"] - values["u"]) / values["t"],
            "v": lambda values: values["u"] + values["a"] * values["t"],
            "u": lambda values: values["v"] - values["a"] * values["t"],
            "t": lambda values: (values["v"] - values["u"]) / values["a"],
        },
        "examples": ["Calculate acceleration if initial velocity is 4 m/s, final velocity is 20 m/s and time is 8 s"],
    },
    {
        "name": "Displacement from motion",
        "topic": "kinematics",
        "equation": "s = u t + 0.5 a t^2",
        "keywords": ["displacement", "distance", "acceleration", "time"],
        "variables": {
            "s": {"label": "displacement", "units": ["m", "meter", "meters"], "aliases": ["displacement", "distance"]},
            "u": {"label": "initial velocity", "units": ["m/s"], "aliases": ["initial velocity"]},
            "a": {"label": "acceleration", "units": ["m/s^2", "m/s2"], "aliases": ["acceleration"]},
            "t": {"label": "time", "units": ["s", "second", "seconds"], "aliases": ["time"]},
        },
        "solvers": {"s": lambda values: values["u"] * values["t"] + 0.5 * values["a"] * values["t"] ** 2},
        "examples": ["Find displacement if initial velocity is 5 m/s, acceleration is 2 m/s^2 and time is 4 s"],
    },
    {
        "name": "Newton's second law",
        "topic": "forces",
        "equation": "F = m a",
        "keywords": ["force", "mass", "acceleration", "newton"],
        "variables": {
            "F": {"label": "force", "units": ["n", "newton", "newtons"], "aliases": ["force", "net force"]},
            "m": {"label": "mass", "units": ["kg", "kilogram", "kilograms"], "aliases": ["mass"]},
            "a": {"label": "acceleration", "units": ["m/s^2", "m/s2"], "aliases": ["acceleration"]},
        },
        "solvers": {
            "F": lambda values: values["m"] * values["a"],
            "m": lambda values: values["F"] / values["a"],
            "a": lambda values: values["F"] / values["m"],
        },
        "examples": ["Calculate force if mass is 5 kg and acceleration is 3 m/s^2"],
    },
    {
        "name": "Weight",
        "topic": "gravitation",
        "equation": "W = m g",
        "keywords": ["weight", "gravity", "mass"],
        "variables": {
            "W": {"label": "weight", "units": ["n", "newton", "newtons"], "aliases": ["weight"]},
            "m": {"label": "mass", "units": ["kg", "kilogram", "kilograms"], "aliases": ["mass"]},
            "g": {"label": "gravitational field strength", "units": ["m/s^2", "n/kg"], "aliases": ["gravity", "g"]},
        },
        "solvers": {
            "W": lambda values: values["m"] * values["g"],
            "m": lambda values: values["W"] / values["g"],
        },
        "defaults": {"g": DEFAULT_G},
        "examples": ["Find weight of a 50 kg learner on Earth"],
    },
    {
        "name": "Momentum",
        "topic": "momentum",
        "equation": "p = m v",
        "keywords": ["momentum", "mass", "velocity"],
        "variables": {
            "p": {"label": "momentum", "units": ["kg m/s"], "aliases": ["momentum"]},
            "m": {"label": "mass", "units": ["kg", "kilogram", "kilograms"], "aliases": ["mass"]},
            "v": {"label": "velocity", "units": ["m/s"], "aliases": ["velocity", "speed"]},
        },
        "solvers": {
            "p": lambda values: values["m"] * values["v"],
            "m": lambda values: values["p"] / values["v"],
            "v": lambda values: values["p"] / values["m"],
        },
        "examples": ["Calculate momentum if mass is 10 kg and velocity is 6 m/s"],
    },
    {
        "name": "Kinetic energy",
        "topic": "energy",
        "equation": "Ek = 0.5 m v^2",
        "keywords": ["kinetic energy", "mass", "velocity", "speed"],
        "variables": {
            "Ek": {"label": "kinetic energy", "units": ["j", "joule", "joules"], "aliases": ["kinetic energy"]},
            "m": {"label": "mass", "units": ["kg", "kilogram", "kilograms"], "aliases": ["mass"]},
            "v": {"label": "velocity", "units": ["m/s"], "aliases": ["velocity", "speed"]},
        },
        "solvers": {
            "Ek": lambda values: 0.5 * values["m"] * values["v"] ** 2,
            "v": lambda values: math.sqrt((2 * values["Ek"]) / values["m"]),
        },
        "examples": ["Calculate kinetic energy if mass is 2 kg and velocity is 10 m/s"],
    },
    {
        "name": "Potential energy",
        "topic": "energy",
        "equation": "Ep = m g h",
        "keywords": ["potential energy", "height", "mass", "gravity"],
        "variables": {
            "Ep": {"label": "potential energy", "units": ["j", "joule", "joules"], "aliases": ["potential energy"]},
            "m": {"label": "mass", "units": ["kg", "kilogram", "kilograms"], "aliases": ["mass"]},
            "g": {"label": "gravitational field strength", "units": ["m/s^2", "n/kg"], "aliases": ["gravity", "g"]},
            "h": {"label": "height", "units": ["m", "meter", "meters"], "aliases": ["height"]},
        },
        "solvers": {"Ep": lambda values: values["m"] * values["g"] * values["h"]},
        "defaults": {"g": DEFAULT_G},
        "examples": ["Find potential energy of a 5 kg object at height 3 m"],
    },
    {
        "name": "Work done",
        "topic": "energy",
        "equation": "W = F d",
        "keywords": ["work", "force", "distance"],
        "variables": {
            "W": {"label": "work", "units": ["j", "joule", "joules"], "aliases": ["work"]},
            "F": {"label": "force", "units": ["n", "newton", "newtons"], "aliases": ["force"]},
            "d": {"label": "distance", "units": ["m", "meter", "meters"], "aliases": ["distance", "displacement"]},
        },
        "solvers": {"W": lambda values: values["F"] * values["d"]},
        "examples": ["Calculate work if force is 20 N and distance is 5 m"],
    },
    {
        "name": "Power from work",
        "topic": "energy",
        "equation": "P = W / t",
        "keywords": ["power", "work", "time"],
        "variables": {
            "P": {"label": "power", "units": ["w", "watt", "watts"], "aliases": ["power"]},
            "W": {"label": "work", "units": ["j", "joule", "joules"], "aliases": ["work", "energy"]},
            "t": {"label": "time", "units": ["s", "second", "seconds"], "aliases": ["time"]},
        },
        "solvers": {"P": lambda values: values["W"] / values["t"]},
        "examples": ["Find power if work is 150 J and time is 5 s"],
    },
    {
        "name": "Wave speed",
        "topic": "waves",
        "equation": "v = f lambda",
        "keywords": ["wave speed", "frequency", "wavelength", "wave"],
        "variables": {
            "v": {"label": "wave speed", "units": ["m/s"], "aliases": ["wave speed", "speed"]},
            "f": {"label": "frequency", "units": ["hz"], "aliases": ["frequency"]},
            "lambda": {"label": "wavelength", "units": ["m", "meter", "meters"], "aliases": ["wavelength", "lambda"]},
        },
        "solvers": {
            "v": lambda values: values["f"] * values["lambda"],
            "f": lambda values: values["v"] / values["lambda"],
            "lambda": lambda values: values["v"] / values["f"],
        },
        "examples": ["Find wave speed if frequency is 8 Hz and wavelength is 2 m"],
    },
    {
        "name": "Period and frequency",
        "topic": "waves",
        "equation": "T = 1 / f",
        "keywords": ["period", "frequency", "oscillation"],
        "variables": {
            "T": {"label": "period", "units": ["s", "second", "seconds"], "aliases": ["period"]},
            "f": {"label": "frequency", "units": ["hz"], "aliases": ["frequency"]},
        },
        "solvers": {
            "T": lambda values: 1 / values["f"],
            "f": lambda values: 1 / values["T"],
        },
        "examples": ["Find period if frequency is 4 Hz"],
    },
    {
        "name": "Ohm's law",
        "topic": "electricity",
        "equation": "V = I R",
        "keywords": ["voltage", "current", "resistance", "ohm", "circuit"],
        "variables": {
            "V": {"label": "voltage", "units": ["v", "volt", "volts"], "aliases": ["voltage"]},
            "I": {"label": "current", "units": ["a", "amp", "amps", "ampere", "amperes"], "aliases": ["current"]},
            "R": {"label": "resistance", "units": ["ohm", "ohms"], "aliases": ["resistance"]},
        },
        "solvers": {
            "V": lambda values: values["I"] * values["R"],
            "I": lambda values: values["V"] / values["R"],
            "R": lambda values: values["V"] / values["I"],
        },
        "examples": ["Calculate current if voltage is 12 V and resistance is 4 ohms"],
    },
    {
        "name": "Electrical power",
        "topic": "electricity",
        "equation": "P = V I",
        "keywords": ["electrical power", "voltage", "current", "power"],
        "variables": {
            "P": {"label": "power", "units": ["w", "watt", "watts"], "aliases": ["power"]},
            "V": {"label": "voltage", "units": ["v", "volt", "volts"], "aliases": ["voltage"]},
            "I": {"label": "current", "units": ["a", "amp", "amps", "ampere", "amperes"], "aliases": ["current"]},
        },
        "solvers": {"P": lambda values: values["V"] * values["I"]},
        "examples": ["Find electrical power if voltage is 220 V and current is 2 A"],
    },
    {
        "name": "Charge",
        "topic": "electricity",
        "equation": "Q = I t",
        "keywords": ["charge", "current", "time"],
        "variables": {
            "Q": {"label": "charge", "units": ["c", "coulomb", "coulombs"], "aliases": ["charge"]},
            "I": {"label": "current", "units": ["a", "amp", "amps", "ampere", "amperes"], "aliases": ["current"]},
            "t": {"label": "time", "units": ["s", "second", "seconds"], "aliases": ["time"]},
        },
        "solvers": {"Q": lambda values: values["I"] * values["t"]},
        "examples": ["Find charge if current is 3 A for 10 s"],
    },
    {
        "name": "Coulomb's law",
        "topic": "electrostatics",
        "equation": "F = k q1 q2 / r^2",
        "keywords": ["coulomb", "charge", "electric force", "distance"],
        "variables": {
            "F": {"label": "electric force", "units": ["n", "newton", "newtons"], "aliases": ["force", "electric force"]},
            "q1": {"label": "first charge", "units": ["c", "coulomb", "coulombs"], "aliases": ["first charge", "q1"]},
            "q2": {"label": "second charge", "units": ["c", "coulomb", "coulombs"], "aliases": ["second charge", "q2"]},
            "r": {"label": "distance", "units": ["m", "meter", "meters"], "aliases": ["distance", "separation"]},
            "k": {"label": "Coulomb constant", "units": [], "aliases": ["coulomb constant", "k"]},
        },
        "solvers": {"F": lambda values: values["k"] * values["q1"] * values["q2"] / (values["r"] ** 2)},
        "defaults": {"k": 8.99e9},
        "examples": ["Find electric force if q1 is 2e-6 C, q2 is 3e-6 C and distance is 0.5 m"],
    },
    {
        "name": "Refractive index",
        "topic": "optics",
        "equation": "n = sin i / sin r",
        "keywords": ["refractive index", "refraction", "angle of incidence", "angle of refraction"],
        "variables": {
            "n": {"label": "refractive index", "units": [], "aliases": ["refractive index"]},
            "i": {"label": "angle of incidence", "units": ["degree", "degrees"], "aliases": ["angle of incidence"]},
            "r": {"label": "angle of refraction", "units": ["degree", "degrees"], "aliases": ["angle of refraction"]},
        },
        "solvers": {"n": lambda values: math.sin(math.radians(values["i"])) / math.sin(math.radians(values["r"]))},
        "examples": ["Find refractive index if angle of incidence is 40 degrees and angle of refraction is 25 degrees"],
    },
    {
        "name": "Radioactive decay",
        "topic": "nuclear",
        "equation": "N = N0 (1/2)^(t / T_half)",
        "keywords": ["half life", "radioactive decay", "remaining amount"],
        "variables": {
            "N": {"label": "remaining amount", "units": [], "aliases": ["remaining amount", "remaining mass"]},
            "N0": {"label": "initial amount", "units": [], "aliases": ["initial amount", "starting amount"]},
            "t": {"label": "time", "units": ["s", "hour", "hours", "day", "days", "year", "years"], "aliases": ["time"]},
            "T_half": {"label": "half life", "units": ["s", "hour", "hours", "day", "days", "year", "years"], "aliases": ["half life", "half-life"]},
        },
        "solvers": {"N": lambda values: values["N0"] * (0.5 ** (values["t"] / values["T_half"]))},
        "examples": ["Find remaining amount if initial amount is 200 and time is 6 hours with half life 2 hours"],
    },
    {
        "name": "Pendulum period",
        "topic": "shm",
        "equation": "T = 2 pi sqrt(l / g)",
        "keywords": ["pendulum", "period", "length", "gravity"],
        "variables": {
            "T": {"label": "period", "units": ["s", "second", "seconds"], "aliases": ["period"]},
            "l": {"label": "length", "units": ["m", "meter", "meters"], "aliases": ["length"]},
            "g": {"label": "gravitational field strength", "units": ["m/s^2", "n/kg"], "aliases": ["gravity", "g"]},
        },
        "solvers": {"T": lambda values: 2 * math.pi * math.sqrt(values["l"] / values["g"])},
        "defaults": {"g": DEFAULT_G},
        "examples": ["Find pendulum period if length is 1.2 m"],
    },
]


NON_PHYSICS_EXAMPLES = {
    "greeting": ["hello", "hi", "good morning", "hey there", "how are you"],
    "capabilities": ["what can you do", "how can you help me", "list your features", "what subjects can you explain"],
    "jokes": ["tell me a joke", "make me laugh", "say something funny"],
    "ai": ["what is ai", "explain artificial intelligence", "how does machine learning work"],
    "python": ["how do i code in python", "teach me python basics", "what is python programming"],
    "trends": ["what is trending now", "show me current trends", "what are people talking about"],
    "unit_conversion": ["convert 10 meters to feet", "change 5 kg to pounds", "convert 32 fahrenheit to celsius"],
}


PHYSICS_INTENTS = {
    "physics",
    "kinematics",
    "projectile_motion",
    "dynamics",
    "forces",
    "momentum",
    "energy",
    "waves",
    "electricity",
    "electrostatics",
    "magnetism",
    "optics",
    "gravitation",
    "thermodynamics",
    "nuclear",
    "shm",
}


def normalize_text(text: str) -> str:
    cleaned = (text or "").lower()
    replacements = {
        "Δ": " delta ",
        "²": "^2",
        "³": "^3",
        "×": " x ",
        "÷": " / ",
        "λ": " lambda ",
        "θ": " theta ",
        "μ": " micro ",
        "Ω": " ohm ",
    }
    for source, target in replacements.items():
        cleaned = cleaned.replace(source, target)
    cleaned = re.sub(r"(\d)\s*[x*]\s*10\^([-+]?\d+)", r"\1e\2", cleaned)
    cleaned = re.sub(r"\bm/s/s\b", "m/s^2", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned.strip()


def build_training_corpus() -> Tuple[List[str], List[str]]:
    texts: List[str] = [
        "what is physics",
        "explain physics simply",
        "help me with a physics question",
        "teach me caps physics",
        "how do i solve a physics problem",
    ]
    labels: List[str] = ["physics"] * len(texts)

    for label, samples in NON_PHYSICS_EXAMPLES.items():
        texts.extend(samples)
        labels.extend([label] * len(samples))

    for topic, record in TOPIC_DATA.items():
        if topic == "physics":
            continue
        title = record["title"].lower()
        topic_samples = [
            title,
            f"what is {title}",
            f"explain {title}",
            f"caps {title}",
            f"help me with {title}",
        ]
        texts.extend(topic_samples)
        labels.extend([topic] * len(topic_samples))

        for keyword in record["keywords"]:
            keyword_samples = [
                keyword,
                f"explain {keyword}",
                f"definition of {keyword}",
                f"formula for {keyword}",
            ]
            texts.extend(keyword_samples)
            labels.extend([topic] * len(keyword_samples))

        for term, definition in record["definitions"].items():
            definition_samples = [
                term,
                f"what is {term}",
                f"define {term}",
                f"explain {term} in physics",
                definition,
            ]
            texts.extend(definition_samples)
            labels.extend([topic] * len(definition_samples))

    for formula in FORMULA_BANK:
        topic = formula["topic"]
        formula_samples = [
            formula["name"],
            formula["equation"],
            f"formula for {formula['name'].lower()}",
            f"equation for {formula['name'].lower()}",
        ]
        texts.extend(formula_samples)
        labels.extend([topic] * len(formula_samples))
        for example in formula.get("examples", []):
            texts.append(example)
            labels.append(topic)
        for meta in formula["variables"].values():
            for stem in ("calculate", "find", "solve for"):
                texts.append(f"{stem} {meta['label']}")
                labels.append(topic)

    return texts, labels


def build_keyword_map() -> Dict[str, List[str]]:
    keyword_map: Dict[str, List[str]] = {}
    for topic, record in TOPIC_DATA.items():
        keyword_map[topic] = list(record["keywords"]) + list(record["definitions"].keys())
    return keyword_map


def _format_number(value: float) -> str:
    if abs(value) >= 10000 or (abs(value) > 0 and abs(value) < 0.001):
        return f"{value:.3e}"
    if abs(value - round(value)) < 1e-9:
        return str(int(round(value)))
    return f"{value:.4f}".rstrip("0").rstrip(".")


def _extract_target(formula: Dict, text: str) -> Optional[str]:
    signals = ("find", "calculate", "determine", "solve for", "work out", "what is", "how much")
    for symbol, meta in formula["variables"].items():
        aliases = [symbol.lower(), meta["label"]] + list(meta["aliases"])
        for alias in aliases:
            if any(f"{signal} {alias}" in text for signal in signals):
                return symbol
    return None


def _resolve_variable_symbol(formula: Dict, target: Optional[str]) -> Optional[str]:
    if not target:
        return None
    for symbol in formula["variables"]:
        if symbol.lower() == target.lower():
            return symbol
    return target if target in formula["variables"] else None


def _extract_explicit_symbol_values(text: str, formula: Dict) -> Dict[str, float]:
    values: Dict[str, float] = {}
    for symbol in formula["variables"]:
        match = re.search(rf"\b{re.escape(symbol.lower())}\s*=\s*{NUM_PATTERN}", text)
        if match:
            values[symbol] = float(match.group(1))
    return values


def _extract_alias_values(text: str, formula: Dict) -> Dict[str, float]:
    values: Dict[str, float] = {}
    for symbol, meta in formula["variables"].items():
        aliases = [meta["label"]] + list(meta["aliases"])
        units = [re.escape(unit) for unit in meta.get("units", []) if unit]
        unit_pattern = "|".join(units)
        for alias in aliases:
            alias_pattern = re.escape(alias)
            patterns = [rf"{alias_pattern}\s*(?:is|=|of|:)?\s*{NUM_PATTERN}"]
            if unit_pattern:
                patterns.append(rf"{NUM_PATTERN}\s*(?:{unit_pattern})\s*(?:for|of)?\s*{alias_pattern}")
                patterns.append(rf"{alias_pattern}\s*(?:is|=|of|:)?\s*{NUM_PATTERN}\s*(?:{unit_pattern})")
            for pattern in patterns:
                match = re.search(pattern, text)
                if match:
                    values[symbol] = float(match.group(1))
                    break
            if symbol in values:
                break
    return values


def _extract_unit_values(text: str, formula: Dict) -> Dict[str, float]:
    values: Dict[str, float] = {}
    unit_to_symbol: Dict[str, Optional[str]] = {}
    for symbol, meta in formula["variables"].items():
        for unit in meta.get("units", []):
            if not unit:
                continue
            if unit in unit_to_symbol:
                unit_to_symbol[unit] = None
            else:
                unit_to_symbol[unit] = symbol
    for unit, symbol in unit_to_symbol.items():
        if not symbol:
            continue
        match = re.search(rf"{NUM_PATTERN}\s*{re.escape(unit)}\b", text)
        if match:
            values[symbol] = float(match.group(1))
    return values


def _collect_values(text: str, formula: Dict) -> Dict[str, float]:
    values: Dict[str, float] = {}
    values.update(formula.get("defaults", {}))
    values.update(_extract_explicit_symbol_values(text, formula))
    values.update(_extract_alias_values(text, formula))
    for symbol, value in _extract_unit_values(text, formula).items():
        values.setdefault(symbol, value)
    return values


def _formula_score(text: str, formula: Dict) -> int:
    score = 0
    if formula["equation"].lower() in text:
        score += 4
    for keyword in formula["keywords"]:
        if keyword in text:
            score += 3
    for meta in formula["variables"].values():
        aliases = [meta["label"]] + list(meta["aliases"])
        if any(alias in text for alias in aliases):
            score += 1
    return score


def _safe_compute(formula: Dict, target: str, values: Dict[str, float]) -> Optional[float]:
    solver = formula["solvers"].get(target)
    if solver is None:
        return None
    try:
        result = solver(values)
    except (ZeroDivisionError, ValueError, KeyError):
        return None
    if result is None or not math.isfinite(result):
        return None
    return float(result)


def _best_formula(text: str) -> Optional[Dict]:
    ranked = [(formula, _formula_score(text, formula)) for formula in FORMULA_BANK]
    ranked = [item for item in ranked if item[1] > 0]
    if not ranked:
        return None
    ranked.sort(key=lambda item: item[1], reverse=True)
    return ranked[0][0]


def _topic_lookup(text: str) -> Optional[str]:
    best_topic = None
    best_score = 0
    for topic, record in TOPIC_DATA.items():
        score = 0
        for keyword in record["keywords"]:
            if keyword in text:
                score += 2
        for term in record["definitions"]:
            if term in text:
                score += 1
        if score > best_score:
            best_topic = topic
            best_score = score
    return best_topic


def build_topic_note(topic: str) -> Optional[str]:
    record = TOPIC_DATA.get(topic)
    if not record:
        return None
    formulas = [formula for formula in FORMULA_BANK if formula["topic"] == topic][:2]
    parts = [record["summary"]]
    if formulas:
        summary = ", ".join(f"{formula['name']}: {formula['equation']}" for formula in formulas)
        parts.append(f"Key formulas: {summary}.")
    return " ".join(parts)


def answer_caps_question(query: str, predicted_intent: Optional[str] = None) -> Optional[Dict[str, str]]:
    text = normalize_text(query)
    if not text:
        return None

    wants_formula = "formula" in text or "equation" in text
    wants_definition = any(phrase in text for phrase in ("what is", "define", "meaning of", "explain"))
    formula = _best_formula(text)

    if formula:
        values = _collect_values(text, formula)
        target = _resolve_variable_symbol(formula, _extract_target(formula, text))
        if not target:
            missing = [symbol for symbol in formula["solvers"] if symbol not in values]
            if len(missing) == 1:
                target = missing[0]
        if wants_definition and target and target in formula["variables"]:
            meta = formula["variables"][target]
            return {
                "intent": formula["topic"],
                "kind": "definition",
                "response": f"In {formula['name']}, {target} means {meta['label']}.",
            }
        if target:
            result = _safe_compute(formula, target, values)
            if result is not None:
                target_meta = formula["variables"][target]
                units = target_meta.get("units", [])
                unit_suffix = f" {units[0]}" if units else ""
                known_values = []
                for symbol, value in values.items():
                    if symbol == target:
                        continue
                    label = formula["variables"].get(symbol, {}).get("label", symbol)
                    known_values.append(f"{label} = {_format_number(value)}")
                known_text = ", ".join(known_values) if known_values else "known values supplied"
                return {
                    "intent": formula["topic"],
                    "kind": "calculation",
                    "response": (
                        f"Using {formula['name']}, {formula['equation']}. "
                        f"Known values: {known_text}. "
                        f"{target_meta['label'].capitalize()} = {_format_number(result)}{unit_suffix}."
                    ),
                }
        if wants_formula or wants_definition:
            variables = ", ".join(
                f"{symbol} means {meta['label']}" for symbol, meta in formula["variables"].items()
            )
            return {
                "intent": formula["topic"],
                "kind": "formula",
                "response": f"{formula['name']} uses {formula['equation']}. {variables}.",
            }

    if wants_definition:
        for topic, record in TOPIC_DATA.items():
            for term, definition in record["definitions"].items():
                if term in text:
                    return {
                        "intent": topic,
                        "kind": "definition",
                        "response": f"{term.capitalize()}: {definition}",
                    }

    topic = predicted_intent if predicted_intent in TOPIC_DATA else _topic_lookup(text)
    if topic:
        note = build_topic_note(topic)
        if note:
            return {"intent": topic, "kind": "topic_note", "response": note}
    return None
