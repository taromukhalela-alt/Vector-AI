import json
import random

def generate_dataset():
    data = []
    
    # helper to add multiple variations
    def add_samples(intent, variations, base_phrases):
        for phrase in base_phrases:
            for var in variations:
                data.append({"text": var.replace("[X]", phrase), "intent": intent})

    # INTENTS & BASE PHRASES
    
    # 1. Kinematics
    kinematics_keywords = ["kinematics", "velocity", "acceleration", "displacement", "constant speed", "frames of reference", "vector", "scalar"]
    kinematics_variations = [
        "What is [X]?", "Explain [X] simply", "How do I calculate [X]?", "Formula for [X]", 
        "Definition of [X]", "Grade 10 [X] help", "Difference between speed and [X]",
        "Help with [X] graphs", "The car is moving with [X]", "Calculate the [X] of the object"
    ]
    add_samples("kinematics", kinematics_variations, kinematics_keywords)
    
    # 2. Projectile Motion (CAPS focus: Vertical)
    projectile_keywords = ["vertical projectile motion", "projectile", "free fall", "thrown upwards", "dropped from a height", "maximum height", "terminal velocity", "time of flight"]
    projectile_variations = [
        "Explain [X]", "What is [X] in physics?", "How to solve [X] problems", "Graph of [X]",
        "A ball is [X]", "Find the maximum height for a [X]", "Equations for [X]", "Calculate [X]"
    ]
    add_samples("projectile_motion", projectile_variations, projectile_keywords)

    # 3. Dynamics (Newton's Laws)
    dynamics_keywords = ["newton's laws", "newton's first law", "newton's second law", "newton's third law", "inertia", "resultant force", "net force", "Fnet = ma"]
    dynamics_variations = [
        "State [X]", "Explain [X] with an example", "What is [X]?", "How does [X] work?",
        "Define [X]", "Application of [X]", "Why is [X] important?", "Help with [X] questions"
    ]
    add_samples("dynamics", dynamics_variations, dynamics_keywords)

    # 4. Momentum & Impulse
    momentum_keywords = ["momentum", "impulse", "collisions", "conservation of momentum", "elastic collision", "inelastic collision", "change in momentum"]
    momentum_variations = [
        "What is [X]?", "Formula for [X]", "Define [X]", "Is momentum conserved in [X]?",
        "Calculate [X] after collision", "Relationship between force and [X]", "Explain [X] to me"
    ]
    add_samples("momentum", momentum_variations, momentum_keywords)

    # 5. Work, Energy & Power
    energy_keywords = ["work", "kinetic energy", "potential energy", "mechanical energy", "conservation of energy", "power", "work-energy theorem", "non-conservative forces"]
    energy_variations = [
        "Define [X]", "What is [X]?", "Calculate the [X]", "State the [X]", "Formula for [X]",
        "Difference between [X] and work", "How much [X] is used?", "Conservation of [X] help"
    ]
    add_samples("energy", energy_variations, energy_keywords)

    # 6. Electricity & Electrodynamics
    electricity_keywords = ["ohm's law", "resistance", "current", "potential difference", "voltage", "series circuit", "parallel circuit", "electrical power", "internal resistance", "emf"]
    electricity_variations = [
        "Explain [X]", "What is [X]?", "How to calculate [X]?", "Formula for [X]", 
        "Circuits and [X]", "Define [X] in physics", "Why does [X] change?", "Help with [X] problems"
    ]
    add_samples("electricity", electricity_variations, electricity_keywords)

    # 7. Electrostatics
    electrostatics_keywords = ["coulomb's law", "electric field", "electrostatic force", "point charges", "electric field lines", "charge", "microcoulombs"]
    electrostatics_variations = [
        "What is [X]?", "State [X]", "Calculate the [X]", "Electric force between [X]",
        "Explain [X]", "Formula for [X]", "Electric field due to [X]"
    ]
    add_samples("electrostatics", electrostatics_variations, electrostatics_keywords)

    # 8. Waves, Sound & Light (Doppler Effect)
    waves_keywords = ["doppler effect", "waves", "frequency", "wavelength", "sound waves", "light waves", "red shift", "blue shift", "ultrasound"]
    waves_variations = [
        "Explain the [X]", "What is the [X]?", "Applications of [X]", "Formula for [X]",
        "How does [X] work?", "Sound and [X]", "Light and [X]", "Calculate the observed frequency in [X]"
    ]
    add_samples("waves", waves_variations, waves_keywords)

    # 9. Matter & Materials (Chemistry - Gas Laws, Bonding)
    chem_keywords = ["gas laws", "boyle's law", "charles's law", "ideal gas", "chemical bonding", "ionic bonding", "covalent bonding", "intermolecular forces"]
    chem_variations = [
        "Explain [X]", "What is [X]?", "State [X]", "Formula for [X]", "Difference between [X] and other bonds",
        "How do [X] work?", "Grade 11 [X] help", "Chemistry [X]"
    ]
    add_samples("thermodynamics", chem_variations, chem_keywords) # Using thermodynamics for gas laws

    # 10. Chemical Change (Rates, Equilibrium, Acids/Bases)
    chem_change_keywords = ["reaction rates", "chemical equilibrium", "le chatelier's principle", "acids and bases", "ph scale", "neutralization", "titration", "galvanic cell", "electrolytic cell", "redox"]
    chem_change_variations = [
        "What is [X]?", "Explain [X]", "Factors affecting [X]", "Define [X]", "How to solve [X] problems",
        "Chemistry [X] grade 12", "Equilibrium and [X]", "Acids and [X]"
    ]
    add_samples("chemistry", chem_change_variations, chem_change_keywords)

    # 11. General Non-Physics
    greetings = ["hi", "hello", "hey", "good morning", "howsit", "greetings", "is anyone there"]
    for g in greetings:
        data.append({"text": g, "intent": "greeting"})
        
    capabilities = ["what can you do", "help me", "how do you work", "show me features", "what subjects", "caps tutor"]
    for c in capabilities:
        data.append({"text": c, "intent": "capabilities"})
        
    jokes = ["tell me a joke", "say something funny", "make me laugh", "physics jokes", "chemistry jokes"]
    for j in jokes:
        data.append({"text": j, "intent": "jokes"})

    # 12. Unit Conversions
    conversions = ["convert [X] to [Y]", "change [X] into [Y]", "how many [X] in a [Y]", "units of [X]"]
    units = ["meters", "kilograms", "seconds", "liters", "celsius", "fahrenheit", "kilometers", "miles"]
    for c in conversions:
        for u1 in units:
            for u2 in units:
                if u1 != u2:
                    data.append({"text": c.replace("[X]", u1).replace("[Y]", u2), "intent": "unit_conversion"})

    # Shuffle
    random.shuffle(data)
    
    with open("intent_training_data.json", "w") as f:
        json.dump(data, f, indent=2)
    
    print(f"Generated {len(data)} training examples.")

if __name__ == "__main__":
    generate_dataset()
