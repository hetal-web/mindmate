from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from dotenv import load_dotenv
import os
import sqlite3
import random
import requests
from datetime import datetime, timedelta, date

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

from chatbot_logic import (
    calculate_personality, detect_crisis, detect_emotion,
    get_crisis_response, reset_chat, enhance_empathy,
    chatbot_reply, calculate_mental_health_level, emotion_to_score
)
from database import get_connection, get_last_24h_mood, get_mood_data, create_tables
from auth import auth_bp
from journal import add_journal, get_journals, delete_journal
from report import (
    calculate_streak, generate_ai_insight, generate_ai_recommendations,
    generate_recommendations, generate_wellness_report,
    get_personality, get_mental_score, analyze_mood,
    mental_interpretation, update_daily_summary
)
import google.generativeai as genai

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE_DIR, "database.db")

app = Flask(__name__)
CORS(app, 
     origins=["https://mindmateapp.netlify.app", "http://localhost:3000"],
     supports_credentials=True,
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])
app.register_blueprint(auth_bp)

@app.route('/make-admin/<email>', methods=['GET'])
def make_admin(email):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET role='admin' WHERE email=?", (email,))
        conn.commit()
        conn.close()
        return {"message": f"{email} is now admin"}, 200
    except Exception as e:
        return {"error": str(e)}, 500

genai.configure(api_key=GEMINI_API_KEY)

# Create tables on startup



create_tables()
styles = [
    "Respond casually and warmly.",
    "Respond like a supportive friend.",
    "Keep it calm and reassuring.",
    "Be slightly motivational but gentle.",
]
# Auto-seed personality questions
try:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM personality_questions")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
            INSERT OR REPLACE INTO personality_questions
            (id, question, option_a, option_b, trait_a, trait_b)
            VALUES (?, ?, ?, ?, ?, ?)
        """, [
            (1,"You feel more energized after:","Spending time with people","Spending time alone","E","I"),
            (2,"In social situations, you usually:","Start conversations","Wait for others","E","I"),
            (3,"You prefer:","Group activities","Solo activities","E","I"),
            (4,"You think best when:","Talking out loud","Thinking quietly","E","I"),
            (5,"You focus more on:","Facts and details","Ideas and possibilities","S","N"),
            (6,"You trust:","Experience","Intuition","S","N"),
            (7,"You prefer work that is:","Practical","Creative","S","N"),
            (8,"You are more interested in:","Present reality","Future possibilities","S","N"),
            (9,"When making decisions, you rely on:","Logic","Emotions","T","F"),
            (10,"You value more:","Truth","Harmony","T","F"),
            (11,"You are more:","Objective","Compassionate","T","F"),
            (12,"You make decisions based on:","Facts","Feelings","T","F"),
            (13,"You prefer:","Planning ahead","Being spontaneous","J","P"),
            (14,"You like your life to be:","Organized","Flexible","J","P"),
            (15,"You prefer:","Completing tasks early","Doing tasks last minute","J","P"),
            (16,"You work better with:","Clear structure","Freedom and flexibility","J","P"),
        ])
        conn.commit()
        print("Personality questions seeded!")
    conn.close()
except Exception as e:
    print(f"Personality seeding error: {e}")

# Auto-seed mental health questions
try:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM mental_health_questions")
    if cursor.fetchone()[0] == 0:
        cursor.executemany("""
            INSERT OR REPLACE INTO mental_health_questions
            (id, question) VALUES (?, ?)
        """, [
            (1,"I feel sad or down frequently"),
            (2,"I have trouble sleeping"),
            (3,"I feel anxious or nervous"),
            (4,"I have low energy"),
            (5,"I feel hopeless"),
            (6,"I have difficulty concentrating"),
            (7,"I feel overwhelmed"),
            (8,"I feel lonely"),
            (9,"I feel worthless"),
            (10,"I lack motivation"),
        ])
        conn.commit()
        print("Mental health questions seeded!")
    conn.close()
except Exception as e:
    print(f"Mental health seeding error: {e}")

def get_last_messages(user_id, limit=5):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT message, response
        FROM chat_history
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
    """, (user_id, limit))

    rows = cursor.fetchall()
    conn.close()

    rows = rows[::-1]

    history = []
    for u, b in rows:
        history.append({"user": u, "bot": b})

    return history


def build_history_text(history):
    text = ""
    for msg in history:
        text += f"User: {msg['user']}\nBot: {msg['bot']}\n"
    return text


def get_gemini_response(user_message, user_id):
    history = get_last_messages(user_id)
    history_text = build_history_text(history)

    try:
        model = genai.GenerativeModel("gemini-2.5-flash")

        prompt = f"""
        You are MindMate, a supportive mental health assistant.

        Conversation so far:
        {history_text}

        User: {user_message}

    Guidelines:
    - Keep responses short (2–3 sentences)
    - Be empathetic but NOT repetitive
    - Use context from previous messages

    Reply:
    """

        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        print("Gemini ERROR:", e)
        return None


def get_groq_response(user_message, user_id):
    history = get_last_messages(user_id, limit=3)

    messages = [
        {
            "role": "system",
            "content": """You are MindMate, a supportive mental health assistant.
- Keep replies short (2–3 sentences)
- Be natural and human-like
- Do NOT repeat phrases
- Be empathetic but concise
"""
        }
    ]

    for msg in history:
        messages.append({"role": "user", "content": msg["user"]})
        messages.append({"role": "assistant", "content": msg["bot"]})

    messages.append({"role": "user", "content": user_message})

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "llama-3.3-70b-versatile",
        "messages": messages,
        "temperature": 0.8
    }

    try:
        res = requests.post(url, headers=headers, json=data)
        result = res.json()
        return result["choices"][0]["message"]["content"]

    except Exception as e:
        print("Groq error:", e)
        return None


def get_openrouter_response(user_message, user_id):
    history = get_last_messages(user_id, limit=3)

    messages = [
        {
            "role": "system",
            "content": """You are MindMate, a supportive mental health assistant.
- Keep replies short (2–3 sentences)
- Be natural and human-like
- Do NOT repeat phrases
- Be empathetic but concise
"""
        }
    ]

    for msg in history:
        messages.append({"role": "user", "content": msg["user"]})
        messages.append({"role": "assistant", "content": msg["bot"]})

    messages.append({"role": "user", "content": user_message})

    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "mistralai/mistral-7b-instruct",
        "messages": messages,
        "temperature": 0.8
    }

    try:
        res = requests.post(url, headers=headers, json=data)
        result = res.json()
        return result["choices"][0]["message"]["content"]

    except Exception as e:
        print("OpenRouter error:", e)
        return None


def normalize_emotion(emotion):
    if not emotion:
        return "neutral"

    if isinstance(emotion, tuple):
        emotion = emotion[0]

    emotion = emotion.lower()

    mapping = {
        "happy": "happy",
        "joy": "happy",
        "excited": "happy",
        "good": "happy",
        "great": "happy",
        "content": "happy",
        "anger": "angry",
        "angry": "angry",
        "sadness": "sad",
        "intense sadness": "sad",
        "loneliness": "sad",
        "guilt": "sad",
        "sad": "sad",
        "anxiety": "stressed",
        "stress": "stressed",
        "fear": "stressed",
        "stressed": "stressed",
    }

    return mapping.get(emotion, "neutral")


def save_mood(user_id, emotion):
    emotion = normalize_emotion(emotion)
    score = emotion_to_score(emotion)
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO mood_logs (user_id, emotion, score, created_at, source)
        VALUES (?, ?, ?, ?, 'ai')
    """, (user_id, emotion, score, now))

    print("SAVING:", user_id, emotion, score)

    conn.commit()
    conn.close()


def save_chat(user_id, user_msg, bot_msg):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO chat_history (user_id, message, response)
        VALUES (?, ?, ?)
    """, (user_id, user_msg, bot_msg))

    conn.commit()
    conn.close()


def parse_response(raw):
    if not raw:
        return "neutral", "I'm here for you 💙"

    raw = raw.strip()
    emotion = "neutral"
    response = raw

    try:
        if "emotion:" in raw.lower() and "response:" in raw.lower():
            parts = raw.split("Response:")
            emotion_part = parts[0]
            response_part = parts[1]
            emotion = emotion_part.split(":")[1].strip().lower()
            response = response_part.strip()
        else:
            response = raw
    except:
        pass

    return emotion, response


def fill_missing_days(data):
    result = {d: v for d, v in data}
    filled = []

    for i in range(6, -1, -1):
        day = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
        filled.append((day, result.get(day, 0)))

    return filled


# ─── ROUTES ───────────────────────────────────────────────────────────────────

@app.route("/chat", methods=["POST"])
def chat():
    data = request.get_json() or {}
    user_message = data.get("message")
    user_id = data.get("user_id") or 1

    crisis = detect_crisis(user_message)

    if crisis:
        reply = get_crisis_response()
        emotion = "sad"
        print("🚨 CRISIS DETECTED:", user_message)
        save_mood(user_id, emotion)
        save_chat(user_id, user_message, reply)
        return jsonify({
            "reply": reply,
            "emotion": emotion,
            "crisis": crisis
        })

    # Pick a fresh style per request
    style = random.choice(styles)

    raw = get_gemini_response(user_message, user_id)

    if not raw:
        print("⚠ Gemini failed → using Groq")
        raw = get_groq_response(user_message, user_id)

    if not raw:
        print("⚠ Groq failed → using OpenRouter")
        raw = get_openrouter_response(user_message, user_id)

    if not raw:
        print("⚠️ AI failed → using fallback")
        result = chatbot_reply(user_id, user_message)
        reply = result["response"]
    else:
        reply = raw

    emotion, score = detect_emotion(user_message)
    print("RAW GEMINI:", raw)
    emotion = normalize_emotion(emotion)

    save_mood(user_id, emotion)
    save_chat(user_id, user_message, reply)

    return jsonify({
        "reply": reply,
        "emotion": emotion,
        "crisis": crisis
    })


@app.route("/chat/history/<int:user_id>")
def get_chat_history(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT message, response, timestamp
        FROM chat_history
        WHERE user_id = ?
        ORDER BY id ASC
    """, (user_id,))

    rows = cursor.fetchall()
    conn.close()

    messages = []
    for r in rows:
        ts = r[2]
        messages.append({"sender": "user", "text": r[0], "timestamp": ts})
        messages.append({"sender": "bot",  "text": r[1], "timestamp": ts})

    return jsonify({"messages": messages})


@app.route("/chat/reset/<int:user_id>", methods=["POST"])
def reset_chat_api(user_id):
    reset_chat(user_id)
    return {"status": "reset successful"}


@app.route("/personality/questions")
def get_questions():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, question, option_a, option_b
        FROM personality_questions
    """)

    rows = cursor.fetchall()
    conn.close()

    questions = []
    for row in rows:
        questions.append({
            "id": row[0],
            "question": row[1],
            "option_a": row[2],
            "option_b": row[3]
        })

    return jsonify(questions)


@app.route("/personality/submit", methods=["POST"])
def submit_personality():
    data = request.json
    user_id = data["user_id"]
    answers = data["answers"]

    personality, description = calculate_personality(answers)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO personality_results (user_id, personality_type)
        VALUES (?, ?)
    """, (user_id, personality))

    conn.commit()
    conn.close()

    return jsonify({
        "personality": personality,
        "description": description
    })


@app.route("/mental/questions")
def mental_questions():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, question FROM mental_health_questions")

    rows = cursor.fetchall()
    conn.close()

    questions = []
    for row in rows:
        questions.append({"id": row[0], "question": row[1]})

    return jsonify(questions)


@app.route("/mental/submit", methods=["POST"])
def mental_submit():
    data = request.json
    user_id = data["user_id"]
    answers = data["answers"]

    score = sum(answers.values())
    level = calculate_mental_health_level(score)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO mental_health_results (user_id, score, level)
        VALUES (?, ?, ?)
    """, (user_id, score, level))

    conn.commit()
    conn.close()

    return jsonify({"score": score, "level": level})


@app.route("/journal/add", methods=["POST"])
def journal_add():
    data = request.json
    user_id = data["user_id"]
    content = data["content"]
    add_journal(user_id, content)
    return jsonify({"status": "ok"})


@app.route("/journal/list/<int:user_id>")
def journal_list(user_id):
    journals = get_journals(user_id)
    return jsonify(journals)


@app.route("/journal/delete/<int:id>", methods=["DELETE"])
def journal_delete(id):
    delete_journal(id)
    return jsonify({"status": "deleted"})


@app.route("/mood/history/<int:user_id>")
def get_mood_history(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DATE(timestamp), emotion
        FROM chat_history
        WHERE user_id = ?
        ORDER BY timestamp ASC
    """, (user_id,))

    rows = cursor.fetchall()
    conn.close()

    emotion_scores = {
        "happiness": 2,
        "neutral": 0,
        "sadness": -1,
        "stress": -1,
        "anxiety": -2,
        "anger": -2,
        "loneliness": -2,
        "guilt": -1
    }

    data = []
    for date, emotion in rows:
        score = emotion_scores.get(emotion, 0)
        data.append({"date": date, "score": score})

    return jsonify(data)


@app.route("/streak/<int:user_id>")
def get_streak(user_id):
    streak = calculate_streak(user_id)
    return jsonify({"streak": streak})


@app.route("/report/<int:user_id>")
def download_report(user_id):
    filepath = f"wellness_report_{user_id}.pdf"
    generate_wellness_report(user_id, filepath)
    return send_file(filepath, as_attachment=True)


@app.route("/report/data/<int:user_id>")
def get_report_data(user_id):
    personality = get_personality(user_id)
    mental_score = get_mental_score(user_id)
    mood = analyze_mood(user_id)
    weekly_mood = get_mood_data(user_id)

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM journal WHERE user_id=?", (user_id,))
    total_journals = cursor.fetchone()[0]

    cursor.execute("SELECT SUM(duration) FROM meditation_logs WHERE user_id=?", (user_id,))
    total_meditation = cursor.fetchone()[0] or 0

    conn.close()

    is_empty = (
        mood is None and
        total_journals == 0 and
        total_meditation == 0 and
        mental_score is None
    )

    if is_empty:
        return jsonify({"empty": True})

    if mood is None:
        avg_mood = None
        best_day = None
        best_score = None
        worst_day = None
        worst_score = None
    else:
        avg_mood = mood["avg"]
        best_day = mood["best_day"]
        best_score = mood["best_score"]
        worst_day = mood["worst_day"]
        worst_score = mood["worst_score"]

    mental_interpret = mental_interpretation(mental_score) if mental_score is not None else None
    streak = calculate_streak(user_id)

    return jsonify({
        "empty": False,
        "personality": personality,
        "mental_score": mental_score,
        "mental_interpretation": mental_interpret,
        "weekly_mood": weekly_mood,
        "avg_mood": avg_mood,
        "best_day": best_day,
        "best_score": best_score,
        "worst_day": worst_day,
        "worst_score": worst_score,
        "total_journals": total_journals,
        "total_meditation": total_meditation,
        "streak": streak,
        "recommendations": generate_ai_recommendations(avg_mood, mental_score),
        "insight": generate_ai_insight(avg_mood, mental_score)
    })


@app.route("/mood-last-24h/<int:user_id>")
def mood_last_24h(user_id):
    return jsonify(get_last_24h_mood(user_id))


@app.route('/mood-data/<int:user_id>')
def mood_data(user_id):
    data = get_mood_data(user_id)
    return jsonify(data)


@app.route("/calendar/<int:user_id>")
def get_calendar(user_id):
    year = request.args.get("year")
    month = request.args.get("month")

    conn = get_connection()
    cursor = conn.cursor()

    if year and month:
        cursor.execute("""
            SELECT date, avg_mood, journal_count, summary, meditation
            FROM daily_summary
            WHERE user_id = ? AND strftime('%Y', date) = ? AND strftime('%m', date) = ?
        """, (user_id, year, f"{int(month):02d}"))
    else:
        cursor.execute("""
            SELECT date, avg_mood, journal_count, summary, meditation
            FROM daily_summary
            WHERE user_id = ?
        """, (user_id,))

    data = cursor.fetchall()
    conn.close()

    result = []
    for row in data:
        result.append({
            "date": row[0],
            "avg_mood": row[1],
            "journal_count": row[2],
            "summary": row[3],
            "meditation": row[4]
        })

    streak = calculate_streak(user_id)

    return jsonify({"calendar": result, "streak": streak})


@app.route("/meditation", methods=["POST"])
def add_meditation():
    data = request.json
    user_id = data.get("user_id")
    duration = data.get("duration")
    today = str(date.today())

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO meditation_logs (user_id, date, duration)
        VALUES (?, ?, ?)
    """, (user_id, today, duration))

    conn.commit()
    conn.close()

    update_daily_summary(user_id)
    streak = calculate_streak(user_id)

    return jsonify({"message": "Meditation saved", "streak": streak})


@app.route("/meditation/<int:user_id>")
def get_meditation(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT date, SUM(duration) as total_duration
        FROM meditation_logs
        WHERE user_id = ?
        GROUP BY date
    """, (user_id,))

    rows = cursor.fetchall()
    conn.close()

    data = [{"date": row[0], "duration": row[1]} for row in rows]
    return jsonify(data)


@app.route('/mood-data-range/<int:user_id>')
def mood_data_range(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    now = datetime.now()
    start_date = (now - timedelta(days=6)).strftime("%Y-%m-%d")
    end_date = now.strftime("%Y-%m-%d")

    cursor.execute("""
        SELECT DATE(timestamp),
        AVG(
            CASE
                WHEN emotion = '' THEN 1
                WHEN emotion = 'neutral' THEN 0
                WHEN emotion = 'sadness' THEN -1
                WHEN emotion = 'sad' THEN -1
            END
        )
        FROM chat_history
        WHERE user_id = ?
        AND DATE(timestamp) BETWEEN ? AND ?
        AND emotion IS NOT NULL
        GROUP BY DATE(timestamp)
        ORDER BY DATE(timestamp) ASC
    """, (user_id, start_date, end_date))

    rows = cursor.fetchall()
    conn.close()

    rows = fill_missing_days(rows)
    return jsonify(rows)


@app.route("/tts/hindi", methods=["POST"])
def hindi_tts():
    data = request.get_json() or {}
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400

    try:
        url = "https://translate.google.com/translate_tts"
        params = {
            "ie": "UTF-8",
            "tl": "hi",
            "client": "tw-ob",
            "q": text[:200]
        }
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        res = requests.get(url, params=params, headers=headers, timeout=10)
        res.raise_for_status()
        return Response(res.content, mimetype="audio/mpeg")

    except Exception as e:
        print("Hindi TTS proxy error:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/")
def home():
    return "MindMate Backend Running"


if __name__ == "__main__":
    app.run(debug=True)