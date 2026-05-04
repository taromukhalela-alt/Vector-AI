import os
from datetime import datetime
from flask import (
    Blueprint,
    render_template,
    request,
    jsonify,
    session,
    redirect,
    url_for,
)
from flask_login import (
    LoginManager,
    login_user,
    logout_user,
    login_required,
    current_user,
)
from werkzeug.security import generate_password_hash, check_password_hash
from database import db, User

auth_bp = Blueprint("auth", __name__, url_prefix="/auth")
login_manager = LoginManager()

def _chat_redirect():
    return url_for("chat_page")

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(user_id)

def init_auth(app):
    login_manager.init_app(app)
    login_manager.login_view = "auth.login"
    login_manager.login_message = "Please log in to access this page."
    app.register_blueprint(auth_bp)

@auth_bp.route("/landing")
def landing():
    return render_template("landing.html")

@auth_bp.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(_chat_redirect())

    if request.method == "POST":
        if request.is_json:
            data = request.get_json(silent=True) or {}
        else:
            data = request.form.to_dict() if request.form else {}

        if not isinstance(data, dict):
            data = {}

        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        user = User.query.filter_by(email=email, provider="local").first()

        if not user or not check_password_hash(user.password_hash, password):
            if request.is_json:
                return jsonify(
                    {"success": False, "message": "Invalid email or password"}
                ), 401
            return render_template("login.html", error="Invalid email or password")

        login_user(user, remember=True)
        session["user"] = user.id
        session["chat_id"] = os.urandom(6).hex()

        if request.is_json:
            return jsonify({"success": True, "redirect": _chat_redirect()})
        return redirect(_chat_redirect())

    return render_template("login.html")

@auth_bp.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(_chat_redirect())

    if request.method == "POST":
        if request.is_json:
            data = request.get_json(silent=True) or {}
        else:
            data = request.form.to_dict() if request.form else {}

        if not isinstance(data, dict):
            data = {}

        name = data.get("name", "").strip()
        email = data.get("email", "").strip().lower()
        password = data.get("password", "")

        if not name or not email or not password:
            return jsonify({"success": False, "message": "All fields required"}), 400

        if len(password) < 6:
            return jsonify(
                {"success": False, "message": "Password must be 6+ characters"}
            ), 400

        if User.query.filter_by(email=email).first():
            return jsonify(
                {"success": False, "message": "Email already registered"}
            ), 400

        user_id = f"user_{datetime.now().timestamp()}"
        avatar = f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=random"
        
        new_user = User(
            id=user_id,
            email=email,
            name=name,
            password_hash=generate_password_hash(password),
            provider="local",
            avatar=avatar,
            created_at=datetime.utcnow(),
            preferences={"voice": "default"}
        )
        
        db.session.add(new_user)
        db.session.commit()

        login_user(new_user, remember=True)
        session["user"] = new_user.id
        session["chat_id"] = os.urandom(6).hex()

        if request.is_json:
            return jsonify({"success": True, "redirect": _chat_redirect()})
        return redirect(_chat_redirect())

    return render_template("login.html", register=True)

@auth_bp.route("/logout", methods=["GET", "POST"])
def logout():
    logout_user()
    session.clear()
    if request.is_json or request.method == "POST":
        return jsonify({"success": True, "redirect": url_for("auth.landing")})
    return redirect(url_for("auth.landing"))

@auth_bp.route("/check")
def check_auth():
    if current_user.is_authenticated:
        return jsonify(
            {
                "authenticated": True,
                "user": {
                    "id": current_user.id,
                    "email": current_user.email,
                    "name": current_user.name,
                    "avatar": current_user.avatar,
                },
            }
        )
    return jsonify({"authenticated": False})
