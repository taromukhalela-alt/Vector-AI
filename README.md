# Vector AI — Neural Science Interface

An AI-powered tutoring platform built for South African high school students studying Physics and Chemistry under the CAPS curriculum (Grades 10–12). Vector AI combines conversational AI, interactive 3D simulations, voice-driven learning, smart notes, adaptive practice, and a physics simulation engine into a single web application.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [System Design Decisions](#system-design-decisions)
- [Core Modules](#core-modules)
  - [Flask Application (`app.py`)](#flask-application-apppy)
  - [Authentication (`auth.py`)](#authentication-authpy)
  - [Database Layer (`database.py`)](#database-layer-databasepy)
  - [CAPS Knowledge Base (`caps_knowledge.py`)](#caps-knowledge-base-caps_knowledgepy)
  - [Physics Engine (`physics_engine.py`)](#physics-engine-physics_enginepy)
  - [Intent Classifier (`ml_train.py`)](#intent-classifier-ml_trainpy)
  - [Prompt Engineering (`model/generator.py`, `prompts/`)](#prompt-engineering)
- [Frontend Architecture](#frontend-architecture)
- [Conversation Pipeline](#conversation-pipeline)
- [AI Provider Strategy](#ai-provider-strategy)
- [Animations System](#animations-system)
- [Notes System](#notes-system)
- [Voice Mode](#voice-mode)
- [Security Model](#security-model)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [CAPS Curriculum Coverage](#caps-curriculum-coverage)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [Tech Stack](#tech-stack)
- [Troubleshooting](#troubleshooting)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │  Chat UI │  │ Notes UI │  │ Animations│  │Dashboard │           │
│  │ main.js  │  │ notes.js │  │Three.js   │  │charts    │           │
│  └────┬─────┘  └────┬─────┘  └────┬──────┘  └────┬─────┘           │
│       │              │             │               │                │
│  ┌────┴──────────────┴─────────────┴───────────────┴─────┐          │
│  │           Web Speech API (voice.js)                    │          │
│  └────────────────────────┬──────────────────────────────┘          │
└───────────────────────────┼─────────────────────────────────────────┘
                            │ HTTP/JSON + CSRF
┌───────────────────────────┼─────────────────────────────────────────┐
│                     Flask Server (app.py)                           │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │   CSRF     │  │Rate Limiter│  │ Auth Guard   │  │  CORS      │  │
│  │ Middleware │  │ (per-user) │  │ (Flask-Login)│  │  Filter    │  │
│  └─────┬──────┘  └─────┬──────┘  └──────┬───────┘  └─────┬──────┘  │
│        └────────────────┴───────────────┴─────────────────┘         │
│                              │                                      │
│  ┌───────────────────────────┼──────────────────────────────────┐   │
│  │                    Route Handler                              │   │
│  │  ┌──────────────┐  ┌─────────────┐  ┌────────────────────┐   │   │
│  │  │Intent Classify│  │Local Knowledge│  │AI Response Gen   │   │   │
│  │  │(TF-IDF + SGD)│  │(caps_knowledge)│  │(Groq → OpenRouter│   │   │
│  │  │              │  │  + formula    │  │   → local)       │   │   │
│  │  │              │  │    solver     │  │                  │   │   │
│  │  └──────┬───────┘  └──────┬────────┘  └────────┬─────────┘   │   │
│  │         └─────────────────┴─────────────────────┘             │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌───────────────────────────┼──────────────────────────────────┐   │
│  │              SQLite (SQLAlchemy ORM)                          │   │
│  │  ┌──────┐  ┌──────────────┐  ┌──────────────┐                │   │
│  │  │Users │  │ Conversations│  │    Notes     │                │   │
│  │  └──────┘  └──────────────┘  └──────────────┘                │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                              │                                      │
│  ┌───────────────────────────┼──────────────────────────────────┐   │
│  │          Physics Engine (physics_engine.py)                   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐                │   │
│  │  │Simulator │  │ML Learner│  │  Explainer   │                │   │
│  │  │(Euler    │  │(Ridge    │  │(Physics vs ML│                │   │
│  │  │ integr.) │  │ regress.)│  │ comparison)  │                │   │
│  │  └──────────┘  └──────────┘  └──────────────┘                │   │
│  └───────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## System Design Decisions

### Why Flask (not Django or FastAPI)?

Flask was chosen for its simplicity and minimal boilerplate. The application is a monolith where a single `app.py` handles routing, AI orchestration, and business logic. Django's ORM and admin panel are unnecessary here since the data model is small (three tables), and FastAPI's async model adds complexity without a clear benefit — the AI provider calls already use threaded timeouts.

### Why SQLite (not PostgreSQL)?

SQLite requires zero configuration and is embedded in the application process. For a tutoring platform where each user has their own conversation history and notes, SQLite's single-writer model is acceptable. The schema is simple enough that migration to PostgreSQL requires only changing the `DATABASE_URL` environment variable — SQLAlchemy abstracts the dialect.

### Why TF-IDF + SGDClassifier (not a transformer)?

The intent classifier uses a lightweight scikit-learn pipeline (TF-IDF vectorizer + SGDClassifier) rather than a transformer model. This decision prioritises:
- **Offline capability**: The classifier works without internet access
- **Speed**: Classification takes milliseconds, not seconds
- **Deployability**: No GPU required, runs on any server
- **Transparency**: The model is interpretable — you can inspect feature weights

The classifier handles 17+ intent categories across physics and chemistry topics with word and character n-gram features for robustness against spelling variations common in South African English.

### Why Groq as primary AI provider?

Groq provides fast inference for LLaMA 3.3 70B with low latency. The application uses a cascade fallback strategy: Groq → OpenRouter → local rule-based responses. This ensures the tutor always responds, even if all external APIs are down.

### Why Ridge Regression for physics ML (not a neural network)?

The physics engine's ML component uses Ridge regression intentionally — it's a science expo project that demonstrates the contrast between physics-based simulation and machine learning. A simple, interpretable model makes the educational comparison meaningful: students can see where ML approximations diverge from exact physics and understand why.

### Why vanilla JavaScript (not React/Vue)?

The frontend uses vanilla JavaScript with no build step. This eliminates the need for Node.js, webpack, or any frontend toolchain, keeping the project accessible to students who may be learning to code. Three.js is loaded via CDN for the 3D animations.

---

## Core Modules

### Flask Application (`app.py`)

The central hub of the application (~2850 lines). It handles:

| Responsibility | Functions |
|---|---|
| **Request security** | `csrf_token()`, `enforce_csrf_protection()`, `enforce_rate_limit()` |
| **AI orchestration** | `generate_response()`, `_groq_generate_with_timeout()`, `_openrouter_generate_with_timeout()` |
| **Intent classification** | `classify_intent()`, `ml_detect_intent_with_confidence()` |
| **Local knowledge** | `get_local_science_response()`, `solve_physics_problem()`, `perform_unit_conversion()` |
| **Semantic search** | `semantic_rank_documents()`, `expanded_search_text()` |
| **Learner memory** | `update_learner_memory_profile()`, `weak_areas_for_user()` |
| **Animation matching** | `match_animation_from_keywords()`, `ai_match_animation_choice()` |
| **Response formatting** | `make_voice_friendly()`, `make_chat_friendly()`, `limit_text()` |
| **Notes AI tools** | `infer_note_metadata()`, `fallback_flashcards()`, `fallback_short_note()` |

Key design patterns:
- **Threaded timeouts**: AI provider calls run in daemon threads with `queue.Queue` for timeout control, preventing hung requests from blocking the server
- **Cascade fallback**: Every AI-dependent feature has a deterministic fallback path
- **Environment-driven configuration**: All limits, timeouts, and model choices are configurable via environment variables with safe defaults

### Authentication (`auth.py`)

A Flask Blueprint (`/auth/*`) providing local email/password authentication:

- **Registration** (`POST /auth/register`): Creates a user with a hashed password (Werkzeug's `generate_password_hash`), auto-generated avatar via ui-avatars.com, and a random user ID (`user_{token}`)
- **Login** (`POST /auth/login`): Validates credentials with `check_password_hash`, creates a Flask-Login session with `remember=True`
- **Logout** (`POST /auth/logout`): Clears session and Flask-Login state
- **Auth check** (`GET /auth/check`): Returns current authentication state as JSON
- **Landing page** (`GET /auth/landing`): Public landing page, no auth required

Decision: No OAuth/SSO was implemented to keep the deployment self-contained. The application doesn't require third-party identity providers, which simplifies hosting and avoids callback URL configuration.

### Database Layer (`database.py`)

Three SQLAlchemy models with cascade deletion:

```
User (users)
├── id: String(50) PK — "user_{random_token}"
├── email: String(120) UNIQUE
├── name: String(100)
├── password_hash: String(255)
├── provider: String(20) — always "local"
├── avatar: String(255) — auto-generated URL
├── created_at: DateTime (UTC)
├── memory_summary: Text — AI-generated learner profile
├── preferences: JSON — {"voice": "default", ...}
├── notes: [Note] — cascade delete
└── conversations: [Conversation] — cascade delete

Note (notes)
├── id: String(50) PK — "note_{random_token}"
├── user_id: FK → users.id
├── title: String(200)
├── content: Text
├── topic: String(100)
├── created_at / updated_at: DateTime (UTC)
├── tags: JSON — list of strings
└── source: String(50) — "user" or "chat"

Conversation (conversations)
├── id: Integer PK (auto-increment)
├── user_id: FK → users.id
├── chat_id: String(50) — groups messages into sessions
├── message: Text — user's input
├── reply: Text — AI's response
├── intent: String(50) — classified topic
├── confidence: Float — classification confidence
└── timestamp: DateTime (UTC)
```

Decision: The `memory_summary` field on User stores a compact AI-generated profile of the learner's strengths, weaknesses, and recent topics. This is appended to the system prompt so the AI tutor has context across sessions without needing to replay full conversation history.

### CAPS Knowledge Base (`caps_knowledge.py`)

A self-contained, deterministic knowledge base (~820 lines) that provides:

1. **Topic data** (`TOPIC_DATA`): 16 physics/chemistry topics with titles, summaries, keywords, and definitions aligned to the CAPS curriculum
2. **Formula bank** (`FORMULA_BANK`): Algebraic solvers for standard formulas (F=ma, Ohm's law, kinetic energy, wave speed, etc.) with variable aliases and unit recognition
3. **Question answering** (`answer_caps_question()`): Pattern-matches a natural language question to extract numeric values, identifies the relevant formula, computes the answer, and returns a formatted step-by-step solution
4. **Training corpus generation** (`build_training_corpus()`): Generates synthetic training examples from topic data for the intent classifier

The formula solver uses regex (`NUM_PATTERN`) to extract numeric values from questions, maps them to formula variables via unit and alias matching, and computes results using lambda solvers. This provides instant, deterministic answers for standard textbook problems without any API call.

### Physics Engine (`physics_engine.py`)

Three interconnected components for projectile motion simulation:

**Simulator** — Numerical integrator using explicit Euler method:
- Simulates 2D projectile motion with optional linear drag (`F_drag = -c * v`)
- Parameters: initial velocity, launch angle, mass, drag coefficient
- Returns time series of position and velocity vectors
- Safety: NaN/infinity checks, maximum time cutoff

**Learner** — Ridge regression ML model:
- Trains on synthetic dataset generated by the Simulator (default: 800 samples x 40 timesteps)
- Features: `[t, v0, angle_rad, mass, drag]` → Targets: `[x, y]`
- Pipeline: `StandardScaler → Ridge(alpha=1.0)` for interpretability
- Persists models to `models/ridge_x.joblib` and `models/ridge_y.joblib`
- Auto-trains on first import if no saved models exist

**Explainer** — Generates educational comparisons:
- If SymPy is available and drag is zero: derives analytic solutions symbolically (time of flight, range, max height)
- Compares physics simulation results with ML predictions
- Explains why differences occur (finite training data, lack of conservation law enforcement)
- Provides pedagogical notes on when to trust ML vs physics

### Intent Classifier (`ml_train.py`)

Trains a scikit-learn pipeline for topic classification:

```
Pipeline:
  FeatureUnion:
    ├── word_ngrams: TfidfVectorizer(ngram_range=(1,2), sublinear_tf=True)
    └── char_ngrams: TfidfVectorizer(analyzer="char_wb", ngram_range=(3,5))
  SGDClassifier(loss="log_loss", class_weight="balanced")
```

- Training data comes from two sources: synthetic examples generated by `caps_knowledge.build_training_corpus()` and an enhanced dataset from `intent_training_data.json`
- The char n-gram features handle misspellings and informal language
- `class_weight="balanced"` prevents the model from ignoring rare topics
- Artifacts saved: `intent_model.pkl`, `label_encoder.pkl`, `model_config.pkl`

At runtime, `classify_intent()` in `app.py` tries the ML model first. If it's unavailable, it falls back to keyword counting over the `INTENT_KEYWORDS` dictionary.

### Prompt Engineering

**`prompts/system_prompt.txt`** — The core system prompt that shapes the AI tutor's personality:
- Strict conversation rules to prevent repetitive responses
- Follow-up question flow: explain → example → check understanding → move forward
- Response length guidelines (3–6 sentences, numbered steps for worked examples)
- Active learning: periodically asks students questions and requires answers before progressing

**`prompts/intent_prompts.py`** — Per-intent hints appended to the prompt (e.g., "Explain momentum, impulse, and conservation with a short example")

**`model/generator.py`** — Prompt construction utilities:
- `build_prompt()`: Assembles system prompt + learner memory + conversation history + intent hint + anti-repetition suffix
- `normalize_history()`: Sanitises conversation history to the last 10 messages
- `is_off_topic()`: Detects when the student strays from physics topics
- Fallback generators: rule-based physics snippets and non-physics replies when all AI providers fail

---

## Frontend Architecture

The frontend uses vanilla JavaScript with no build tools or framework dependencies:

| File | Responsibility |
|---|---|
| `main.js` | Chat UI logic — message sending/receiving, topic routing, history panel management, session switching |
| `voice.js` | Speech recognition (Web Speech API), text-to-speech (SpeechSynthesis + ElevenLabs/CAMB), voice preference persistence |
| `animations.js` | 16 Three.js animation scenes with interactive parameter controls |
| `notes.js` | Notes CRUD, semantic search, AI-powered tools (metadata, summarise, flashcards), offline sync |
| `dashboard.js` | Analytics charts — topic distribution, confidence trends, session activity |
| `security.js` | CSRF token injection into all fetch requests |
| `config.js` | Client-side configuration constants |
| `avatar.js` | User avatar display and management |

All client-server communication uses `fetch()` with JSON payloads. CSRF tokens are automatically injected by `security.js` into request headers.

---

## Conversation Pipeline

When a user sends a message, the following pipeline executes:

```
1. Input validation
   ├── JSON format check
   ├── Message length check (max 4000 chars, or 12000 for exams)
   └── Rate limit check (20 requests/60s for chat, 3/900s for exams)

2. Intent classification
   ├── Primary: ML model (TF-IDF + SGDClassifier)
   └── Fallback: keyword frequency matching

3. Deterministic resolution
   ├── Unit conversion? → perform_unit_conversion()
   ├── Physics formula? → solve_physics_problem() → caps_knowledge solver
   └── Topic lookup? → get_local_science_response()

4. Conversation context
   ├── Load session history from SQLite
   ├── Detect affirmative response → fulfill previous offer
   ├── Detect conversation loops → break repetition
   └── Inject deterministic hint as "Reference solution" in prompt

5. AI generation (cascade)
   ├── Groq (LLaMA 3.3 70B, 6-10s timeout)
   ├── OpenRouter (configurable model, 30s timeout)
   └── Local rule-based response (always available)

6. Post-processing
   ├── Voice mode? → strip markdown, expand units to words
   ├── Chat mode? → clean excessive headers and whitespace
   └── Truncate to output limit (6000 chars chat, 1200 voice, 24000 exam)

7. Persistence
   ├── Save to Conversation table (message, reply, intent, confidence)
   ├── Update response cache
   └── Record latency metrics

8. Response
   └── JSON: {intent, confidence, reply, animation_id?, follow_up?}
```

Every 3rd exchange, the system injects an instruction asking the AI to pose questions to the student, enforcing active learning rather than passive consumption.

---

## AI Provider Strategy

The application uses a multi-provider cascade with provider-specific roles:

| Provider | Role | Model | Timeout | Use Case |
|---|---|---|---|---|
| **Groq** | Primary chat | LLaMA 3.3 70B Versatile | 6–10s | All chat interactions |
| **OpenRouter** | Chat fallback | Configurable (default: `inclusionai/ring-2.6-1t`) | 30s | When Groq fails |
| **OpenRouter** | Exam generation | Configurable with fallback chain | 60s | Full exam papers + memos |
| **Google Gemini** | Content summarisation | Gemini 1.5 Flash | — | Optional summarise endpoint |
| **ElevenLabs** | Text-to-speech | `eleven_flash_v2_5` | 20s | Premium voice output |
| **CAMB AI** | Text-to-speech | `mars-8.1-flash-beta` | 20s | Alternative voice output |
| **Local** | Ultimate fallback | Rule-based + physics snippets | Instant | When all APIs are down |

Each provider call runs in a daemon thread with a `queue.Queue` for timeout control. If a thread exceeds its timeout, the caller moves to the next provider without waiting.

---

## Animations System

Interactive 3D visualisations built with Three.js (`static/animations.js`), covering:

| Animation ID | Topic | Description |
|---|---|---|
| `projectile` | Projectile Motion | Adjustable velocity, angle, and drag |
| `waves` | Wave Motion | Frequency, wavelength, amplitude controls |
| `forces` | Newton's Laws | Force vectors and acceleration |
| `collision` | Momentum | Elastic/inelastic collision demos |
| `orbit` | Gravitation | Orbital mechanics visualisation |
| `electricity` | Electric Fields | Field line and charge visualisation |
| `magnetism` | Magnetic Fields | Magnetic field patterns |
| `optics` | Refraction/Optics | Ray diagrams and lens effects |
| `nuclear` | Nuclear Decay | Radioactive decay simulation |
| `thermodynamics` | Gas Laws | PV=nRT visualisation |
| `pendulum` | Simple Harmonic Motion | Pendulum and spring oscillation |
| `gas_laws` | Gas Laws | Boyle's and Charles's law demos |
| `reaction_rates` | Reaction Rates | Collision theory visualisation |
| `bonding` | Chemical Bonding | Ionic and covalent bond demos |
| `acid_base` | Acids and Bases | pH and neutralisation |
| `electrochemistry` | Electrochemistry | Galvanic cell simulation |

Animation matching uses a three-tier strategy:
1. **Keyword matching**: Deterministic regex-based matching against known animation keywords
2. **Intent-based**: Maps the classified intent to the corresponding animation
3. **AI semantic routing**: If neither keyword nor intent matches, the AI selects from the animation list

---

## Notes System

Full CRUD with AI-assisted features:

- **Create/Edit/Delete**: Standard note operations with title, content, topic, and tags
- **Save from chat**: One-click save of AI responses as notes (source: "chat")
- **Semantic search**: TF-IDF cosine similarity across note content, titles, topics, and tags with query expansion (e.g., "voltage" expands to "potential difference circuit electricity ohm")
- **AI tools** (rate-limited):
  - Auto-generate title, topic, and tags from content
  - Summarise notes into concise study material
  - Generate flashcard question/answer pairs
- **Offline sync**: `GET /api/notes/sync?since=` pulls updates; `POST /api/notes/sync` pushes offline changes with merge
- **Export**: Exports all notes as a text corpus

---

## Voice Mode

Hands-free learning through browser APIs:

- **Speech Recognition**: Web Speech API (`webkitSpeechRecognition`) — Chrome/Edge only
- **Text-to-Speech**: Three options:
  1. Browser SpeechSynthesis API (free, works offline)
  2. ElevenLabs streaming TTS (premium quality, requires API key)
  3. CAMB AI streaming TTS (alternative premium, requires API key)
- **Voice-optimised responses**: When voice mode is active, `make_voice_friendly()` converts markdown, symbols, and units to speakable text (e.g., `m/s^2` → "meters per second squared")
- **Voice preference persistence**: Selected voice is saved in user preferences

---

## Security Model

| Layer | Mechanism |
|---|---|
| **CSRF protection** | Token-based, enforced on all mutating methods (POST/PUT/PATCH/DELETE). Token generated via `secrets.token_urlsafe(32)`, stored in session, validated via header or body. |
| **Authentication** | Flask-Login with session cookies. `@login_required` on all data-access routes. |
| **Password hashing** | Werkzeug `generate_password_hash` / `check_password_hash` (PBKDF2 by default). |
| **Rate limiting** | Per-user/IP sliding window. Chat: 20/60s. Exams: 3/900s. TTS: 30/60s. AI tools: 12/300s. Configurable via env vars. |
| **Input limits** | Chat: 4000 chars. Exam: 12000 chars. TTS: 2000 chars. Configurable. |
| **Output limits** | Chat: 6000 chars. Voice: 1200 chars. Exam: 24000 chars. Responses truncated with a notice. |
| **Request size** | Flask's `MAX_CONTENT_LENGTH` enforced (default 1MB). |
| **Cookie security** | `HttpOnly`, `SameSite=Lax`, optional `Secure` flag via env var. |
| **CORS** | Restricted to `ALLOWED_ORIGIN` (default: `http://localhost:5000`). |
| **Secret key** | From `SECRET_KEY` env var, or auto-generated and persisted to `.secret_key` file. |

---

## API Reference

### Pages

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/` | No | Redirects to chat (if logged in) or landing |
| GET | `/auth/landing` | No | Public landing page |
| GET | `/auth/login` | No | Login/register page |
| GET | `/chat` | Yes | Main chat interface |
| GET | `/notes` | Yes | Notes management page |
| GET | `/animations` | Yes | Redirects to chat with animation tab |
| GET | `/dashboard` | Yes | Analytics dashboard |
| GET | `/history` | Yes | Conversation history browser |

### Chat & AI

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/chat` | Yes | Send message, get AI response |
| POST | `/match-animation` | Yes | Match question to animation |
| POST | `/simulate` | Yes | Run physics simulation with ML comparison |
| POST | `/api/tts` | Yes | Text-to-speech (ElevenLabs/CAMB/browser) |

### Notes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/notes` | Yes | List all notes |
| POST | `/api/notes` | Yes | Create note |
| GET | `/api/notes/<id>` | Yes | Get single note |
| PUT | `/api/notes/<id>` | Yes | Update note |
| DELETE | `/api/notes/<id>` | Yes | Delete note |
| POST | `/api/notes/search` | Yes | Semantic note search |
| GET | `/api/notes/sync` | Yes | Pull note updates (offline sync) |
| POST | `/api/notes/sync` | Yes | Push offline changes |
| GET | `/api/notes/export` | Yes | Export notes as text corpus |

### AI Tools

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/notes/ai/metadata` | Yes | Auto-generate title, topic, tags |
| POST | `/api/notes/ai/summarize` | Yes | Summarise note content |
| POST | `/api/notes/ai/flashcards` | Yes | Generate flashcard Q&A pairs |
| POST | `/api/practice/adaptive` | Yes | Generate targeted practice questions |
| POST | `/api/answer/check` | Yes | Rubric-style answer assessment |
| POST | `/api/search/semantic` | Yes | Search notes + chat history by meaning |

### User & Session

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | No | Create account |
| POST | `/auth/login` | No | Log in |
| POST | `/auth/logout` | Yes | Log out |
| GET | `/auth/check` | No | Check auth status |
| GET | `/api/user/profile` | Yes | Get user profile |
| GET | `/api/user/preferences` | Yes | Get preferences |
| POST | `/api/user/preferences` | Yes | Update preferences |
| GET | `/api/history` | Yes | List conversation sessions |
| GET | `/api/session/<chat_id>` | Yes | Get session messages |
| POST | `/api/new_session` | Yes | Start new chat session |
| GET | `/api/metrics` | Yes | Dashboard analytics data |

---

## Project Structure

```
Vector-AI/
├── app.py                          # Main Flask application (routes, AI orchestration, security)
├── auth.py                         # Authentication blueprint (login, register, logout)
├── database.py                     # SQLAlchemy models (User, Note, Conversation)
├── caps_knowledge.py               # CAPS knowledge base, formula bank, deterministic solver
├── physics_engine.py               # Simulator, ML learner (Ridge), explainer
├── ml_train.py                     # Intent classifier training (TF-IDF + SGDClassifier)
├── generate_enhanced_dataset.py    # Script to generate additional training examples
├── migrate_to_sqlite.py            # Legacy JSON → SQLite migration helper
│
├── model/
│   ├── __init__.py
│   └── generator.py                # Prompt building, fallback generators, history normalisation
│
├── prompts/
│   ├── __init__.py
│   ├── system_prompt.txt           # Core tutor personality and conversation rules
│   └── intent_prompts.py           # Per-intent prompt hints
│
├── templates/
│   ├── landing.html                # Public landing page (self-contained CSS/JS)
│   ├── login.html                  # Login and registration form
│   ├── index.html                  # Main chat interface
│   ├── chat.html                   # Chat template
│   ├── animations.html             # 3D animation viewer
│   ├── notes.html                  # Notes management interface
│   ├── profile.html                # User profile page
│   ├── dashboard.html              # Analytics dashboard
│   └── history.html                # Conversation history browser
│
├── static/
│   ├── main.js                     # Chat UI logic, topic routing, history management
│   ├── voice.js                    # Speech recognition & TTS integration
│   ├── animations.js               # Three.js animation scenes (16 simulations)
│   ├── notes.js                    # Notes CRUD, search, AI tools, offline sync
│   ├── dashboard.js                # Dashboard charts and analytics
│   ├── security.js                 # CSRF token management
│   ├── config.js                   # Client-side configuration
│   ├── chat.css                    # Main application styles
│   ├── style.css                   # Animation and landing page styles
│   ├── app.css / app.js            # Additional styles and scripts
│   ├── avatar.js                   # Avatar display logic
│   └── icons/                      # Application icons
│
├── models/
│   ├── ridge_x.joblib              # Trained ML model for x-position prediction
│   └── ridge_y.joblib              # Trained ML model for y-position prediction
│
├── tests/
│   ├── test_auth_flow.py           # Authentication flow tests
│   ├── test_caps_knowledge.py      # Knowledge base and formula solver tests
│   └── test_explainer.py           # Physics engine explainer tests
│
├── intent_model.pkl                # Trained intent classifier
├── label_encoder.pkl               # Intent label encoder
├── model_config.pkl                # Model training metadata
├── intent_training_data.json       # Enhanced training dataset
│
├── requirements.txt                # Python dependencies
├── Procfile                        # Heroku/Render deployment (gunicorn)
├── pytest.ini                      # Test configuration
└── .gitignore                      # Git ignore rules
```

---

## CAPS Curriculum Coverage

### Physics

| Topic | Knowledge Base | Formulas | Animations |
|---|---|---|---|
| Kinematics | Definitions, equations of motion | v=d/t, a=(v-u)/t, s=ut+½at² | — |
| Projectile Motion | Range, max height, trajectory | Projectile formulas | Projectile simulation |
| Dynamics | Newton's three laws | F=ma | Newton's Laws demo |
| Forces | Friction, weight, normal, tension | W=mg, friction formulas | Force vectors |
| Momentum | Conservation, impulse | p=mv, impulse-momentum | Collision demo |
| Energy | KE, PE, work, power | Ek=½mv², Ep=mgh, W=Fd, P=W/t | Energy transfers |
| Gravitation | Universal gravitation, orbits | W=mg, F=Gm₁m₂/r² | Orbital mechanics |
| Waves | Transverse, longitudinal, sound | v=fλ, T=1/f | Wave motion |
| Electricity | Ohm's law, circuits, power | V=IR, P=VI, series/parallel | Electric fields |
| Electrostatics | Coulomb's law, electric fields | F=kq₁q₂/r², E=F/q | Electric fields |
| Magnetism | Magnetic fields, induction | — | Magnetic fields |
| Optics | Reflection, refraction, lenses | n=c/v, Snell's law | Ray diagrams |
| Thermodynamics | Heat, temperature, gas laws | Q=mcΔT, PV=nRT | Gas laws |
| Nuclear Physics | Radioactivity, decay, half-life | N=N₀(½)^(t/T) | Nuclear decay |
| SHM | Pendulum, spring oscillation | T=2π√(l/g) | Pendulum/spring |
| Photoelectric Effect | Photon energy, work function | E=hf | — |

### Chemistry

| Topic | Knowledge Base | Animations |
|---|---|---|
| Gas Laws | Boyle's, Charles's, ideal gas | Gas Laws simulation |
| Reaction Rates | Collision theory, catalysts | Reaction Rates demo |
| Chemical Bonding | Ionic, covalent, metallic | Bonding visualisation |
| Acid-Base | pH, neutralisation, indicators | Acid-Base demo |
| Electrochemistry | Galvanic cells, electrolysis | Electrochemistry demo |

---

## Quick Start

### Prerequisites

- Python 3.9+
- A Groq API key (free tier available at [console.groq.com](https://console.groq.com))

### 1. Clone and install

```bash
git clone https://github.com/taromukhalela-alt/Vector-AI.git
cd Vector-AI
pip install -r requirements.txt
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
# Required — at least one AI provider
GROQ_API_KEY=gsk_your_key_here

# Optional — fallback AI provider
OPENROUTER_API_KEY=sk-or-v1-your-key-here

# Optional — exam generation settings
OPENROUTER_EXAM_MODEL=openrouter/free
OPENROUTER_EXAM_FALLBACK_MODELS=google/gemma-3-27b-it:free,z-ai/glm-4.5-air:free

# Optional — application settings
SECRET_KEY=your-random-32-char-string
ALLOWED_ORIGIN=http://localhost:5000
DATABASE_URL=sqlite:///vector_ai.db
SESSION_COOKIE_SECURE=false
```

### 3. Run

```bash
python app.py
```

### 4. Open

Navigate to [http://localhost:5000](http://localhost:5000) — you'll see the landing page. Register an account to access the chat interface.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | — | Groq API key for LLaMA 3.3 chat |
| `OPENROUTER_API_KEY` | — | OpenRouter API key (fallback chat + exams) |
| `OPENROUTER_CHAT_MODEL` | `inclusionai/ring-2.6-1t` | OpenRouter model for chat fallback |
| `OPENROUTER_EXAM_MODEL` | `openrouter/free` | OpenRouter model for exam generation |
| `OPENROUTER_EXAM_FALLBACK_MODELS` | `google/gemma-3-27b-it:free,...` | Comma-separated fallback models |
| `OPENROUTER_EXAM_TIMEOUT` | `60` | Exam generation timeout (seconds) |
| `OPENROUTER_MODEL_TIMEOUT` | `15` | Per-model timeout within fallback chain |
| `GOOGLE_API_KEY` | — | Google Gemini API key (optional summarisation) |
| `ELEVENLABS_API_KEY` | — | ElevenLabs TTS API key |
| `CAMB_API_KEY` | — | CAMB AI TTS API key |
| `SECRET_KEY` | Auto-generated | Flask session secret key |
| `DATABASE_URL` | `sqlite:///vector_ai.db` | SQLAlchemy database URI |
| `ALLOWED_ORIGIN` | `http://localhost:5000` | CORS allowed origins (comma-separated) |
| `MAX_REQUEST_BYTES` | `1048576` | Maximum request body size |
| `CHAT_MAX_INPUT_CHARS` | `4000` | Maximum chat message length |
| `CHAT_MAX_OUTPUT_CHARS` | `6000` | Maximum chat response length |
| `VOICE_MAX_OUTPUT_CHARS` | `1200` | Maximum voice response length |
| `EXAM_MAX_INPUT_CHARS` | `12000` | Maximum exam prompt length |
| `EXAM_MAX_OUTPUT_CHARS` | `24000` | Maximum exam response length |
| `CHAT_RATE_LIMIT_COUNT` | `20` | Chat requests per window |
| `CHAT_RATE_LIMIT_WINDOW` | `60` | Chat rate limit window (seconds) |
| `EXAM_RATE_LIMIT_COUNT` | `3` | Exam requests per window |
| `EXAM_RATE_LIMIT_WINDOW` | `900` | Exam rate limit window (seconds) |
| `SESSION_COOKIE_SECURE` | `false` | Set `true` for HTTPS deployments |
| `TRUST_PROXY_HEADERS` | `false` | Trust X-Forwarded-For for rate limiting |
| `FORCE_TRAIN` | `false` | Force re-train intent classifier on startup |

---

## Testing

Run the test suite with pytest:

```bash
pytest
```

Test modules:
- `tests/test_auth_flow.py` — Registration, login, logout, session management
- `tests/test_caps_knowledge.py` — Formula solving, topic lookup, knowledge base integrity
- `tests/test_explainer.py` — Physics engine simulation and explanation generation

To retrain the intent classifier:

```bash
python ml_train.py
```

---

## Deployment

### Heroku / Render

The included `Procfile` configures gunicorn:

```
web: gunicorn --timeout 120 app:app
```

Set all required environment variables in your platform's dashboard. The application will auto-create the SQLite database on first run.

### Environment considerations

- Set `SESSION_COOKIE_SECURE=true` for HTTPS deployments
- Set `ALLOWED_ORIGIN` to your production domain
- Set `TRUST_PROXY_HEADERS=true` if behind a reverse proxy
- For PostgreSQL, change `DATABASE_URL` to a `postgresql://` URI

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python, Flask, Flask-Login, Flask-CORS, Flask-Caching, SQLAlchemy |
| **AI/ML** | Groq (LLaMA 3.3), OpenRouter, scikit-learn, joblib, SymPy |
| **Frontend** | Vanilla JavaScript, Three.js, Web Speech API |
| **Database** | SQLite (default), PostgreSQL-compatible via SQLAlchemy |
| **Auth** | Flask-Login, Werkzeug password hashing, CSRF tokens |
| **TTS** | Web SpeechSynthesis, ElevenLabs, CAMB AI |
| **Deployment** | Gunicorn, Heroku/Render-ready |

---

## Troubleshooting

| Issue | Solution |
|---|---|
| "Groq API key NOT found" | Set `GROQ_API_KEY` in your `.env` file |
| Voice not working | Use Chrome or Edge; grant microphone permission |
| Animations not loading | Ensure WebGL is enabled in your browser |
| Blank landing page | Check that Flask is running and static files are served |
| "CSRF token missing" | Ensure cookies are enabled; the token is set via session |
| Slow responses | Check API key validity; the app falls back through providers |
| Intent misclassification | Run `python ml_train.py` to retrain with latest data |
| Database errors | Delete `instance/vector_ai.db` to reset (loses all data) |
