from flask import Blueprint, request, jsonify
import sqlite3
import os
from database import get_connection
from werkzeug.security import generate_password_hash, check_password_hash

auth_bp = Blueprint("auth", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE_DIR, "database.db")


# ── REGISTER ───────────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.json
    name = data.get("name")
    email = data.get("email")
    password = data.get("password")

    if not name or not email or not password:
        return jsonify({"error": "Missing fields"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    conn = get_connection()
    cursor = conn.cursor()

    try:
        hashed_password = generate_password_hash(password)
        cursor.execute("""
            INSERT INTO users (name, email, password)
            VALUES (?, ?, ?)
        """, (name, email, hashed_password))
        conn.commit()
        return jsonify({"message": "User registered successfully"})

    except sqlite3.IntegrityError:
        return jsonify({"error": "Email already exists"}), 400

    finally:
        conn.close()


# ── LOGIN ──────────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, name, password, role FROM users
        WHERE email = ?
    """, (email,))

    user = cursor.fetchone()
    conn.close()

    if user and check_password_hash(user[2], password):
        return jsonify({
            "message": "Login successful",
            "user": {
                "id": user[0],
                "name": user[1],
                "email": email,
                "role": user[3] or "user"
            }
        })

    return jsonify({"error": "Invalid email or password"}), 401


# ── ADMIN: stats ───────────────────────────────────────
@auth_bp.route("/admin/stats", methods=["GET"])
def admin_stats():
    token_role = request.args.get("role")
    if token_role != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM users WHERE role != 'admin'")
    total_users = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM chat_history")
    total_chats = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM journal")
    total_journals = cursor.fetchone()[0]

    cursor.execute("SELECT COALESCE(SUM(duration), 0) FROM meditation_logs")
    total_meditation = cursor.fetchone()[0]

    cursor.execute("""
        SELECT name, email, id FROM users
        WHERE role != 'admin'
        ORDER BY id DESC
        LIMIT 10
    """)
    recent_users = [{"name": r[0], "email": r[1], "id": r[2]} for r in cursor.fetchall()]

    conn.close()

    return jsonify({
        "total_users": total_users,
        "total_chats": total_chats,
        "total_journals": total_journals,
        "total_meditation": total_meditation,
        "recent_users": recent_users,
    })


# ── ADMIN: delete user ─────────────────────────────────
@auth_bp.route("/admin/delete-user/<int:user_id>", methods=["DELETE"])
def delete_user(user_id):
    role = request.args.get("role")
    if role != "admin":
        return jsonify({"error": "Unauthorized"}), 403

    conn = get_connection()
    cursor = conn.cursor()

    # Confirm user exists and is not an admin
    cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()

    if not row:
        conn.close()
        return jsonify({"error": "User not found"}), 404

    if row[0] == "admin":
        conn.close()
        return jsonify({"error": "Cannot delete an admin account"}), 403

    # Delete all associated data first (foreign key safety)
    tables = [
        "mood_logs",
        "journal",
        "meditation_logs",
        "chat_history",
        "daily_summary",
        "mental_health_results",
        "personality_results",
    ]
    for table in tables:
        try:
            cursor.execute(f"DELETE FROM {table} WHERE user_id = ?", (user_id,))
        except Exception:
            pass  # skip tables that don't exist yet

    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()

    return jsonify({"message": f"User {user_id} and all associated data deleted successfully."})