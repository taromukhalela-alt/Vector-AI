# Code Explanation

This document explains the main Python files in simple language.

## `app.py`

This is the main Flask server.
It receives chat messages, classifies the question, gets a local physics answer when possible, and asks Gemini for a fuller explanation when available.

Important jobs:

- runs the website
- handles the `/chat` route
- sends deterministic physics results into the prompt
- uses a short Gemini timeout when a local answer already exists
- makes voice mode replies safer for text to speech

## `caps_knowledge.py`

This file is the local CAPS physics brain.
It stores:

- topic summaries
- definitions
- formulas
- example training questions

It also contains the local solver that can answer standard formula questions such as force, momentum, kinetic energy, wave speed, and Ohm's law.

## `ml_train.py`

This trains the small local model that decides what type of question the learner asked.
The model is lightweight on purpose.
It uses TF-IDF features and an `SGDClassifier` so it can train faster on a weak laptop.

## `physics_engine.py`

This powers the projectile simulation side of the project.
It has:

- a physics simulator
- a simple ML learner for trajectory prediction
- an explainer for comparing physics and ML results

## `model/generator.py`

This helps with prompt building and fallback replies.
It supports optional local generation, but the project now relies more on the local CAPS knowledge system for practical offline help.

## `prompts/intent_prompts.py`

This file contains short prompt hints for each topic such as electricity, waves, optics, and SHM.

## `tests/`

The tests check that:

- the physics explainer returns structured data
- the new CAPS knowledge module can solve and explain standard questions
