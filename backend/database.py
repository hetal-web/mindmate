import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE_DIR, "database.db")

def get_connection():
    conn = sqlite3.connect(DB, check_same_thread=False)
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def get_mood_data(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DATE(created_at), AVG(score)
        FROM mood_logs
        WHERE user_id = ?
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at)
    """, (user_id,))

    rows = cursor.fetchall()
    conn.close()

    return [
        {"date": r[0], "score": r[1]}
        for r in rows
    ]

def get_last_24h_mood(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT created_at, score
        FROM mood_logs
        WHERE user_id = ?
        AND created_at >= datetime('now', '-1 day')
        ORDER BY created_at ASC
    """, (user_id,))

    rows = cursor.fetchall()
    conn.close()

    return [
        {"time": r[0], "score": r[1]}
        for r in rows
    ]

def create_tables():

    conn = get_connection()
    cursor = conn.cursor()

    # USERS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT DEFAULT 'user'
    )
    """)

    # CHAT DICTIONARY
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_dictionary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT,
        emotion TEXT,
        language TEXT
    )
    """)

    # CHATBOT RESPONSES
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chatbot_responses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        emotion TEXT,
        language TEXT,
        response TEXT
    )
    """)

    # CHAT HISTORY
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        message TEXT,
        response TEXT,
        emotion TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("PRAGMA table_info(chat_history)")
    chat_columns = [row[1] for row in cursor.fetchall()]
    if 'message' not in chat_columns:
        cursor.execute("ALTER TABLE chat_history ADD COLUMN message TEXT")
    if 'response' not in chat_columns:
        cursor.execute("ALTER TABLE chat_history ADD COLUMN response TEXT")
    if 'emotion' not in chat_columns:
        cursor.execute("ALTER TABLE chat_history ADD COLUMN emotion TEXT")

    # MEMORY
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS memory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        topic TEXT,
        message TEXT,
        emotion TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # EMOTIONAL PROFILE
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS emotional_profile (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        emotion TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # PERSONALITY QUESTIONS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS personality_questions (
        id INTEGER PRIMARY KEY,
        question TEXT,
        option_a TEXT,
        option_b TEXT,
        trait_a TEXT,
        trait_b TEXT
    )
    """)

    # PERSONALITY RESULTS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS personality_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        personality_type TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # MENTAL HEALTH QUESTIONS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mental_health_questions (
        id INTEGER PRIMARY KEY,
        question TEXT
    )
    """)

    # MENTAL HEALTH RESULTS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mental_health_results (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        score INTEGER,
        level TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)

    # JOURNAL
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS journal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        content TEXT,
        mood TEXT,
        emotion TEXT,
        created_at TEXT
    )
    """)

    # DAILY SUMMARY
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS daily_summary (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        date TEXT,
        avg_mood REAL,
        journal_count INTEGER,
        summary TEXT,
        meditation INTEGER DEFAULT 0
    )
    """)

    # MOOD LOGS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS mood_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        emotion TEXT,
        score REAL,
        created_at TEXT,
        source TEXT
    )
    """)

    # MEDITATION LOGS
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS meditation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        date TEXT,
        duration INTEGER
    )
    """)

    # INDEXES for faster queries
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_chat_user ON chat_history(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_mood_user ON mood_logs(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_journal_user ON journal(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_memory_user ON memory(user_id)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_summary_user ON daily_summary(user_id)")

    conn.commit()
    conn.close()

    print("Database tables created successfully")


if __name__ == "__main__":
    create_tables()