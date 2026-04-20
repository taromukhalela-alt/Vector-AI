# Vector AI — My CAPS Physics & Chemistry Tutor

I'm Vector AI, an intelligent tutoring platform built specifically for South African high school students studying Physics and Chemistry under the CAPS curriculum (Grades 10-12). I combine multiple learning modalities — chat, voice, interactive 3D animations, and smart notes — into one seamless experience.

## How I Work Together

### The Core Architecture

I'm built as a Flask web application with several interconnected systems:

1. **The Flask Server (app.py)** - I'm the central hub that handles all HTTP requests, manages user sessions, routes traffic between components, and orchestrates responses. When you send me a message, I receive it here, classify your intent, generate a response, and send it back.

2. **Authentication System (auth.py)** - I handle user registration and login through both local accounts (email/password) and OAuth (Google and GitHub). User data is stored in users.json, with each user's notes, preferences, and conversation history isolated by their user ID.

3. **Knowledge Base (caps_knowledge.py)** - I contain a comprehensive physics and chemistry knowledge base covering all CAPS topics. This includes topic summaries, definitions, formulas, worked examples, and a local solver for standard problems like force calculations, momentum, kinetic energy, wave speed, and Ohm's law.

4. **Physics Engine (physics_engine.py)** - I run real-time physics simulations for projectile motion. I'm made of three parts: a simulator that calculates ground-truth physics using numerical integration, a machine learning learner (Ridge regression) that predicts trajectories from data, and an explainer that compares physics results with ML predictions and generates educational explanations.

### The Conversation Flow

When you ask me a question:

1. **Intent Classification** - I first use an ML model (TF-IDF + SGDClassifier) to detect what topic you're asking about. This runs locally and works offline. If the ML model isn't available, I fall back to keyword matching.

2. **Local Knowledge Check** - Before calling the AI, I check my local CAPS knowledge base for deterministic answers to standard physics/chemistry problems. If I find a match, I use it as a hint.

3. **AI Generation** - I send your message, the conversation history, and a system prompt to Groq's LLaMA 3.3 70B model. The system prompt tells the AI to act as a CAPS-aligned tutor, provide step-by-step explanations, and use correct technical terms.

4. **Response Formatting** - If you're in voice mode, I strip out markdown, bullet points, and special symbols, converting everything to speakable text. Your response then goes through text-to-speech.

### Animations System

I include interactive 3D animations built with Three.js. When you ask about topics like projectile motion, waves, forces, electricity, or chemistry concepts like gas laws or reaction rates, I can match your question to a relevant animation and launch it.

The animations are configured in `static/animations.js` and include:
- Projectile motion with adjustable velocity, angle, and drag
- Wave motion visualizations
- Newton's laws demonstrations
- Electric and magnetic field simulations
- Thermodynamics and gas laws
- Chemistry reactions and bonding

### Notes System

I let you create, edit, search, and delete notes. Each note has a title, content, topic, tags, and timestamps. You can create notes manually or save them directly from my chat responses using the "Save as Note" button.

Notes are stored in your user profile in users.json and support:
- Full-text search
- Export for offline use
- Synchronization for offline-first scenarios
- Training data for the local intent classifier

### Voice Mode

I support hands-free learning through:
- **Speech Recognition** - Using the Web Speech API (Chrome/Edge), I convert your voice to text
- **Text-to-Speech** - I read responses aloud using the SpeechSynthesis API
- **Voice Selection** - You can choose from available system voices, and your preference is saved

### Data Flow

```
User Input (Text/Voice)
        ↓
    Flask Route (app.py)
        ↓
Intent Classification (ml_train.py)
        ↓
Local Knowledge Check (caps_knowledge.py)
        ↓
AI Generation (Groq API)
        ↓
Response Formatting (voice/chat modes)
        ↓
Save to History (data.json)
        ↓
User Response + Optional Animation
```

## What I Cover

### Physics (CAPS)
Kinematics, Dynamics, Forces, Momentum, Energy, Gravitation, Waves, Sound, Electricity, Electrostatics, Magnetism, Electromagnetism, Optics, Thermodynamics, Nuclear Physics, Photoelectric Effect, Simple Harmonic Motion

### Chemistry (CAPS)
Gas Laws, Reaction Rates, Chemical Bonding, Acid-Base, Electrochemistry

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
Create a `.env` file:
```
GROQ_API_KEY=gsk_your_key_here
SECRET_KEY=your-random-32-char-string
ALLOWED_ORIGIN=http://localhost:5000
```

### 3. Run Me
```bash
python app.py
```

### 4. Open in Browser
```
http://localhost:5000
```

## Project Structure

```
Vector-AI/
├── app.py                      # Main Flask application
├── auth.py                     # Authentication blueprint
├── caps_knowledge.py           # Physics/chemistry knowledge base
├── physics_engine.py           # Simulation engine + ML learner
├── model/
│   ├── __init__.py
│   └── generator.py            # Prompt building utilities
├── prompts/
│   ├── __init__.py
│   ├── system_prompt.txt
│   └── intent_prompts.py
├── ml_train.py                 # Intent classifier training
├── users.json                  # User database (auto-created)
├── data.json                   # Conversation logs
├── templates/
│   ├── landing.html            # Public landing page
│   ├── login.html              # Login/register
│   ├── chat.html               # Main chat interface
│   ├── animations.html         # 3D animation viewer
│   ├── notes.html              # Notes management
│   ├── profile.html            # User profile
│   ├── dashboard.html          # Analytics dashboard
│   └── history.html            # Conversation history
├── static/
│   ├── chat.css                # Main styles
│   ├── style.css               # Animation styles
│   ├── main.js                 # Chat UI logic
│   ├── voice.js                # Speech recognition & TTS
│   ├── animations.js           # Three.js scenes
│   ├── notes.js                # Notes CRUD
│   ├── dashboard.js            # Dashboard charts
│   └── ...                     # Other assets
└── models/
    ├── ridge_x.joblib          # Trained ML model (x)
    └── ridge_y.joblib          # Trained ML model (y)
```

## Key Features

- **AI Chat** - Groq-powered LLaMA 3.3 for detailed CAPS-aligned explanations
- **3D Animations** - Interactive Three.js simulations for physics and chemistry
- **Voice Mode** - Speech recognition and text-to-speech for hands-free learning
- **Smart Notes** - Create, search, and export AI-assisted notes
- **Offline Intent Detection** - Local ML classifier that works without internet
- **Physics Simulation** - Real-time projectile motion with ML comparison
- **Secure Authentication** - Local accounts and OAuth (Google/GitHub)

## Troubleshooting

- **"Groq API key NOT found"** - Ensure `.env` has `GROQ_API_KEY` set
- **Voice not working** - Use Chrome or Edge, grant microphone permission
- **Animations not loading** - Ensure WebGL is enabled in your browser

## Tech Stack

- **Backend**: Flask, Flask-Login, Flask-CORS, Flask-Caching
- **AI/ML**: Groq API (LLaMA 3.3), scikit-learn, joblib
- **Frontend**: Vanilla JavaScript, Three.js, Web Speech API
- **Auth**: Authlib (OAuth 2.0), Werkzeug (password hashing)
- **Storage**: JSON file-based (ready for database migration)