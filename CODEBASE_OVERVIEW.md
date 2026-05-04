# Vector AI - Codebase Overview

This document provides a summary of the major components and files within the Vector AI project.

## Core Application Files

### [app.py](file:///home/taro/Vector-AI-1/app.py)
The central nervous system of the application.
- **Initialization**: Configures Flask, SQLAlchemy, Caching, and CORS.
- **AI Integration**: Handles communication with Groq (Llama 3) and Google Gemini for response generation and summarization.
- **Intent Classification**: Uses a machine learning model to detect if a student is asking about physics, chemistry, or general topics.
- **API Endpoints**: 
    - `/chat`: Main chat interface logic.
    - `/api/notes`: Full CRUD operations for student notes.
    - `/api/history`: Manages conversation sessions.
    - `/voice-tutor`: Handles text-to-speech friendly responses.
- **Compatibility Helpers**: Includes `load_users` and `save_users` wrappers to bridge old JSON-style logic with the new SQLAlchemy backend.

### [auth.py](file:///home/taro/Vector-AI-1/auth.py)
Handles all user-related security and session management.
- **Flask-Login Integration**: Manages user sessions and the `@login_required` decorator.
- **Authentication**: Routes for `/login`, `/register`, and `/logout`.
- **Database Interaction**: Uses SQLAlchemy to query and persist user credentials and profiles.

### [database.py](file:///home/taro/Vector-AI-1/database.py)
Defines the structure of the data.
- **User Model**: Stores email, name, password hashes, avatar, preferences, and serialized conversation history.
- **Note Model**: Stores student-generated notes with fields for title, content, topic, and tags.
- **Relationships**: Defines a one-to-many relationship between Users and Notes.

## Knowledge & Simulation

### [caps_knowledge.py](file:///home/taro/Vector-AI-1/caps_knowledge.py)
The primary knowledge base for the South African CAPS curriculum.
- **Curriculum Mapping**: Contains detailed information on Grades 10-12 Physical Sciences topics.
- **Keyword Engine**: Maps student queries to specific educational concepts.
- **Local Fallback**: Provides educational responses even if external AI APIs are offline.

### [physics_engine.py](file:///home/taro/Vector-AI-1/physics_engine.py)
Powers the interactive simulations.
- **Logic**: Implements mathematical models for projectile motion, forces, and other physical phenomena.
- **Data Export**: Provides data points for the frontend to render dynamic animations on the canvas.

## Machine Learning

### [ml_train.py](file:///home/taro/Vector-AI-1/ml_train.py)
The training pipeline for the intent classifier.
- **Preprocessing**: Tokenizes and encodes user queries.
- **Training**: Trains a Scikit-learn model (or similar) to classify student intent into categories like `kinematics`, `dynamics`, `electricity`, etc.
- **Artifacts**: Produces `intent_model.pkl` and `label_encoder.pkl`.

### [model/generator.py](file:///home/taro/Vector-AI-1/model/generator.py)
Handles low-level AI response logic.
- **History Normalization**: Ensures conversation history stays within token limits.
- **Prompt Engineering**: Templates for different tutor "personalities" (standard vs. voice mode).

## Utilities & Configuration

### [migrate_to_sqlite.py](file:///home/taro/Vector-AI-1/migrate_to_sqlite.py)
A one-time utility script created to migrate legacy `users.json` data into the new SQLite database.

### [.env](file:///home/taro/Vector-AI-1/.env)
Stores sensitive environment variables like `GROQ_API_KEY`, `GOOGLE_API_KEY`, and `SECRET_KEY`.

## Frontend (static & templates)

- **[templates/](file:///home/taro/Vector-AI-1/templates/)**: Contains HTML files (Jinja2 templates) for the landing page, chat interface, notes module, and login screens.
- **[static/](file:///home/taro/Vector-AI-1/static/)**:
    - `style.css`: Premium glassmorphism UI styling.
    - `notes.js`: Handles note-taking logic and API calls.
    - `voice.js`: Manages the voice tutor interaction and ElevenLabs integration.

## Data Storage
- **vector_ai.db**: The primary SQLite database (created by SQLAlchemy).
- **data.json**: A global log of all interactions for administrative and improvement purposes.
- **users.json.bak**: Backup of the original file-based user data.
