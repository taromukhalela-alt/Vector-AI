import json
import os
from datetime import datetime
from app import app
from database import db, User, Note, Conversation

def migrate():
    USERS_FILE = "users.json"
    if not os.path.exists(USERS_FILE):
        print("No users.json found. Skipping migration.")
        return

    with open(USERS_FILE, "r") as f:
        try:
            users_data = json.load(f)
        except json.JSONDecodeError:
            print("Failed to decode users.json.")
            return

    with app.app_context():
        db.create_all()
        
        for user_id, data in users_data.items():
            # Check if user already exists
            if User.query.get(user_id):
                print(f"User {user_id} already exists. Skipping.")
                continue
                
            created_at = None
            if data.get("created_at"):
                try:
                    created_at = datetime.fromisoformat(data["created_at"])
                except ValueError:
                    pass

            user = User(
                id=user_id,
                email=data.get("email"),
                name=data.get("name"),
                password_hash=data.get("password_hash"),
                provider=data.get("provider", "local"),
                avatar=data.get("avatar"),
                created_at=created_at,
                memory_summary=data.get("memory_summary"),
                preferences=data.get("preferences", {"voice": "default"})
            )
            db.session.add(user)
            
            # Migrate notes
            for note_data in data.get("notes", []):
                n_created_at = None
                if note_data.get("created_at"):
                    try:
                        n_created_at = datetime.fromisoformat(note_data["created_at"])
                    except ValueError:
                        pass
                
                n_updated_at = None
                if note_data.get("updated_at"):
                    try:
                        n_updated_at = datetime.fromisoformat(note_data["updated_at"])
                    except ValueError:
                        pass

                note = Note(
                    id=note_data.get("id"),
                    user_id=user_id,
                    title=note_data.get("title"),
                    content=note_data.get("content"),
                    topic=note_data.get("topic"),
                    created_at=n_created_at,
                    updated_at=n_updated_at,
                    tags=note_data.get("tags", []),
                    source=note_data.get("source", "user")
                )
                db.session.add(note)
            
            # Migrate legacy conversations to the new table
            legacy_convs = data.get("conversations", [])
            for conv_data in legacy_convs:
                c_time = None
                if conv_data.get("time"):
                    try:
                        c_time = datetime.fromisoformat(conv_data["time"])
                    except ValueError:
                        pass
                
                conv = Conversation(
                    user_id=user_id,
                    chat_id=conv_data.get("chat_id", "legacy"),
                    message=conv_data.get("message", ""),
                    reply=conv_data.get("reply", ""),
                    intent=conv_data.get("topic", "unknown"),
                    confidence=conv_data.get("confidence", 0.0),
                    timestamp=c_time
                )
                db.session.add(conv)
        
        db.session.commit()
        print(f"Migrated {len(users_data)} users, their notes, and chat history.")

if __name__ == "__main__":
    migrate()
