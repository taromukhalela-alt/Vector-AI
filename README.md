# Vector AI

Vector AI is a CAPS-friendly physics helper for South African learners.
It uses:

1. A small local machine learning model to understand what kind of question you asked.
2. A local CAPS physics knowledge system for formulas, definitions, and calculations.
3. Google Gemini for richer explanations when an API key is available.

This version is designed to be much lighter than before, so it is better for a slow laptop with an Intel Celeron, 4 GB RAM, and no GPU.

## What It Can Do

- Recognise CAPS physics topics like kinematics, forces, momentum, energy, waves, electricity, optics, nuclear physics, and more.
- Understand many formula-style questions and some plain English questions.
- Solve common physics calculations locally, even without Gemini.
- Give better fallback answers when the internet or API is not available.
- Show physics simulations and explanations in the web app.

## Why The Local Model Changed

The old local model used a heavier neural-network training setup with a very small dataset.
That made it slow to train and not very smart.

The new local model uses:

- TF-IDF word features
- Character n-grams
- A tiny `SGDClassifier`

This is faster to train, smaller, and better at spotting:

- equations like `V = IR`
- symbols like `m/s^2`
- CAPS topic words
- short English questions

## Main Files

- [app.py](/c:/Users/MBULAWA%20SECONDARY/Vector-AI/app.py) runs the Flask web app.
- [caps_knowledge.py](/c:/Users/MBULAWA%20SECONDARY/Vector-AI/caps_knowledge.py) stores the improved CAPS physics knowledge, formulas, and local solver.
- [ml_train.py](/c:/Users/MBULAWA%20SECONDARY/Vector-AI/ml_train.py) trains the small local intent model.
- [physics_engine.py](/c:/Users/MBULAWA%20SECONDARY/Vector-AI/physics_engine.py) runs the projectile simulation and ML comparison.
- [prompts/intent_prompts.py](/c:/Users/MBULAWA%20SECONDARY/Vector-AI/prompts/intent_prompts.py) gives short instructions for different topic types.
- [tests/test_caps_knowledge.py](/c:/Users/MBULAWA%20SECONDARY/Vector-AI/tests/test_caps_knowledge.py) checks the new local knowledge system.
- [CODE_EXPLANATION.md](/c:/Users/MBULAWA%20SECONDARY/Vector-AI/CODE_EXPLANATION.md) explains the whole project in simple language.

## Setup

1. Make sure Python is installed.
2. Install the packages:

```bash
pip install -r requirements.txt
```

3. Optional: add a Gemini API key.

Windows PowerShell:

```powershell
$env:GEMINI_API_KEY="your_key_here"
```

4. Train the small local model:

```bash
python ml_train.py
```

5. Start the app:

```bash
python app.py
```

6. Open your browser at `http://localhost:5000`

## How The App Answers Questions

1. The local model guesses the topic.
2. The local CAPS knowledge system checks for formulas, definitions, and calculations.
3. If Gemini is available, Gemini gives a fuller explanation.
4. If Gemini is not available, the local system still gives a useful answer.

## Good Example Questions

- `What is acceleration?`
- `Calculate force if mass is 5 kg and acceleration is 3 m/s^2`
- `What is the formula for kinetic energy?`
- `Find current if voltage is 12 V and resistance is 4 ohms`
- `Explain projectile motion`

## Important Note

This project is much better than before, but it is still a school helper, not a perfect scientist.
For tests and exams, always check units, signs, and whether the formula matches the question.
