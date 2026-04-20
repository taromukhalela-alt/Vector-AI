# Vector AI — CAPS Physics & Chemistry Tutor

An intelligent, multi-modal tutoring platform for South African high school students (Grades 10-12) following the CAPS curriculum. Combines AI chat, interactive 3D animations, voice interaction, smart notes, and secure user accounts.

## Features

### Core Functionality
- **AI Chat Tutor** — Powered by Groq's LLaMA 3.3 70B for instant, detailed explanations in Physics & Chemistry
- **3D Animations** — Interactive simulations for mechanics, waves, electromagnetism, optics, thermodynamics, modern physics, and chemistry topics
- **Voice Mode** — Speech recognition + TTS with multiple voice options for hands-free learning
- **Smart Notes** — AI-assisted note creation, editing, organization, and offline export
- **User Accounts** — Secure authentication via local registration, Google OAuth, GitHub OAuth
- **Intent Classifier** — ML-based topic detection that works offline using your saved notes

### CAPS Topics Covered
**Physics:** Kinematics, Dynamics, Forces, Momentum, Energy, Gravitation, Waves, Sound, Electricity, Electrostatics, Magnetism, Electromagnetism, Optics, Thermodynamics, Nuclear Physics, Photoelectric Effect, SHM

**Chemistry:** Gas Laws, Reaction Rates, Chemical Bonding, Acid-Base, Electrochemistry

## Tech Stack

- **Backend**: Flask, Flask-Login, Flask-CORS, Flask-Caching
- **AI/ML**: Groq API (llama-3.3-70b-versatile), scikit-learn intent classifier, joblib
- **Frontend**: Vanilla JavaScript, Three.js (3D), Web Speech API
- **Auth**: Authlib (OAuth 2.0), Werkzeug (password hashing)
- **Storage**: JSON file-based per-user data (ready for DB migration)

## Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```
# Required
GROQ_API_KEY=gsk_your_actual_key_here
SECRET_KEY=random-32-char-string-at-least

# Optional OAuth (for Google/GitHub login)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Allowed origin for CORS
ALLOWED_ORIGIN=http://localhost:5000
```

### 3. Run the App
```bash
python app.py
```

### 4. Open in Browser
```
http://localhost:5000
```

Visit `/auth/landing` for the landing page, create an account, and start learning.

## Project Structure

```
Vector-AI/
├── app.py                      # Main Flask application + routes
├── auth.py                     # Authentication blueprint (OAuth, sessions)
├── caps_knowledge.py           # Physics/chemistry knowledge base + solver
├── physics_engine.py           # Simulation engine for projectile motion
├── model/                      # ML intent classifier (TF-IDF + SGD)
├── requirements.txt            # Python dependencies
├── .env.example               # Environment template
├── users.json                 # User database (auto-created)
├── data.json                  # Conversation logs
├── intent_model.pkl           # Trained ML model (auto-generated)
├── templates/
│   ├── landing.html           # Public landing page
│   ├── login.html             # Login/register modal page
│   ├── chat.html              # Main chat interface
│   ├── animations.html        # 3D animation viewer
│   ├── notes.html             # Notes management
│   └── profile.html           # User profile & settings
├── static/
│   ├── chat.css               # Main styles
│   ├── style.css              # Animation styles
│   ├── main.js                # Chat UI + voice selector + note saving
│   ├── voice.js               # Speech recognition & TTS
│   ├── config.js              # Animation config
│   ├── animations.js          # Three.js physics + chemistry scenes
│   ├── notes.js               # Notes CRUD UI
│   ├── anim-lib.js            # Reusable 3D helpers
│   └── physics-lib.js         # Math utilities
└── prompts/                   # AI prompt templates
```

## API Reference

### Public Endpoints
| Route | Method | Purpose |
|-------|--------|---------|
| `/auth/landing` | GET | Landing page explaining Vector AI |
| `/auth/login` | GET/POST | Login page + local auth |
| `/auth/register` | POST | Create local account |
| `/auth/oauth/<provider>` | GET | OAuth login (google/github) |
| `/auth/oauth/<provider>/callback` | GET | OAuth callback |
| `/auth/check` | GET | Session status check |

### Authenticated Endpoints
| Route | Method | Purpose |
|-------|--------|---------|
| `/` | GET | Redirects to `/chat` |
| `/chat` | GET | Chat interface |
| `/animations` | GET | Animation studio |
| `/notes` | GET | Notes manager |
| `/profile` | GET | User profile |
| `/logout` | POST | End session |

### JSON API (Authenticated)
| Route | Method | Purpose |
|-------|--------|---------|
| `/chat` | POST | Send message (returns AI reply) |
| `/match-animation` | POST | Match question to animation |
| `/api/notes` | GET/POST | List/create notes |
| `/api/notes/<id>` | PUT/DELETE | Update/delete note |
| `/api/notes/search` | POST | Search notes |
| `/api/notes/export` | GET | Export notes as text |
| `/api/notes/sync` | GET/POST | Offline sync |
| `/api/user/preferences` | GET/POST | User settings |
| `/api/user/profile` | GET | User info |
| `/api/train_physics` | POST | Retrain ML model |

## Key Features Explained

### AI Chat
- Sends user message + conversation history to Groq LLaMA 3.3
- Includes CAPS-aligned system prompts for educational tone
- Physics questions get detailed step-by-step explanations
- Chemistry questions include balanced equations and concepts
- Voice mode uses special prompt without markdown/symbols for TTS

### Voice Interaction
- **Speech Recognition**: Web Speech API (Chrome/Edge)
- **Text-to-Speech**: `SpeechSynthesis` with voice selection dropdown
- **Voice preference** saved per user in `preferences.voice`
- **Offline-capable**: Recognizer works without internet (browser-dependent)

### Animations
- Built with **Three.js** for WebGL rendering
- Each animation has configurable sliders (angle, velocity, temperature, etc.)
- Animations linked to intent categories — ask relevant questions to auto-launch related animation
- Includes both Physics and Chemistry simulations

### Notes System
- Create notes manually or from AI responses ("📝 Save as Note" button)
- Each note has: title, topic, content, tags, timestamps
- Full CRUD via REST API
- Export endpoint provides plain-text corpus for offline classifier
- Sync endpoints support offline-first usage

### Authentication & Security
- **Flask-Login** manages sessions with persistent "remember me" cookies
- **Passwords**: Werkzeug `generate_password_hash` + `check_password_hash` (PBKDF2-SHA256)
- **OAuth**: Authlib with Google & GitHub providers
- User data isolated by `current_user.id`
- No plaintext credentials stored

### Intent Classifier Offline Fallback
- Uses TF-IDF + n-grams + SGDClassifier (lightweight)
- Trained on CAPS topic examples
- Can be updated with user notes via `/api/notes/export`
- Runs entirely locally, no API calls needed

## Configuration

### Changing AI Model
In `app.py:263`, change:
```python
model="llama-3.3-70b-versatile"
```
to any Groq-supported model like `llama-3.1-8b`, `mixtral-8x7b`, etc.

### Adjusting Response Detail
Edit system prompts in `app.py`:
- `PHYSICS_SYSTEM_PROMPT` (lines 58-69)
- `VOICE_SYSTEM_PROMPT` (lines 71-79)

Increase timeout in `_groq_generate_with_timeout` if responses get cut (default 8s full, 4s hinted).

### Adding New Chemistry Animation
1. Define `renderChemistryX3D()` in `static/animations.js` before ANIMATIONS array
2. Add entry:
```javascript
{
  id: "chemistry_x",
  label: "Chemistry X",
  icon: "⚗",
  render: renderChemistryX3D,
  controls: [
    { type: "slider", id: "temp", label: "Temp", min: 0, max: 100, step: 5, value: 25 },
  ],
}
```
3. Implement `renderChemistryX3D()` using `THREE` primitives (`createBox`, `createSphere`, etc.)

## Deployment (Production)

1. **Set strong secrets** in `.env`:
   ```bash
   SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
   GROQ_API_KEY=your_production_key
   ```

2. **Use Gunicorn** with multiple workers:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

3. **Enable HTTPS** (required for OAuth in production):
   Use Nginx + Let's Encrypt or cloud load balancer.

4. **Set allowed origins**:
   ```env
   ALLOWED_ORIGIN=https://vector-ai.edu.za
   ```

5. **Database migration** (recommended for scale):
   Replace `users.json` + `data.json` with PostgreSQL/SQLite + SQLAlchemy

6. **Logging**:
   Configure production logging to file/monitoring service.

## Troubleshooting

### "Gemini/Groq API key NOT found"
- Ensure `.env` file exists in project root
- Confirm key is spelled `GROQ_API_KEY` (not `GEMINI_API_KEY`)
- Restart Flask after editing `.env`

### OAuth not working
- Verify client IDs/secrets are correct
- Check redirect URIs match exactly (including trailing slash/no trailing slash)
- Google OAuth requires "External" user type if testing outside G Suite
- Some corporate networks block OAuth ports

### Voice recognition not working
- Requires Chrome or Edge browser
- Must serve over HTTPS for microphone access (except localhost)
- User must grant microphone permission

### Animations not loading
- Check browser console for Three.js errors
- Ensure WebGL is enabled (check `chrome://gpu`)
- Clear browser cache

## Roadmap (Post-September Deploy)

- [ ] Database backend (PostgreSQL + SQLAlchemy)
- [ ] Real-time collaborative notes sharing
- [ ] Image/diagram upload + analysis
- [ ] Student progress tracking + achievements
- [ ] Notes export to PDF/Anki
- [ ] Advanced chemistry reaction engines
- [ ] PWA offline mode with service worker
- [ ] Additional languages: isiZulu, Afrikaans, Xhosa

## Contributing

This is a South African educational project. Contributions welcome:
- Add more CAPS topics
- Improve animation fidelity
- Add worked examples
- Translate content
- Optimize for low-bandwidth users

## License

Proprietary — For South African educational use only.

## Support

Issues: [GitHub Issues](https://github.com/Vector-AI/vector-ai/issues)
Email: support@vector-ai.edu.za
