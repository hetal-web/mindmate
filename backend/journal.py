from database import get_connection
from chatbot_logic import detect_emotion, emotion_to_score, normalize_emotion
from datetime import datetime
from report import update_daily_summary
from chatbot_logic import ai_detect_emotion

def add_journal(user_id, content):

    print("JOURNAL CONTENT:", content, type(content))
    ai_emotion, confidence = ai_detect_emotion(content)

    if ai_emotion:
        emotion = ai_emotion
    else:
        fallback = detect_emotion(content)

        if isinstance(fallback, tuple):
            emotion, _ = fallback
        else:
            emotion = fallback

# Always normalize
    emotion = normalize_emotion(emotion)


    print("JOURNAL EMOTION:", emotion)

    conn = get_connection()
    cursor = conn.cursor()

    

    local_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    

    cursor.execute("""
    INSERT INTO journal (user_id, content, emotion, created_at)
    VALUES (?, ?, ?, ?)
    """, (user_id, content, emotion, local_time))

    score = emotion_to_score(emotion)

    cursor.execute("""
    INSERT INTO mood_logs (user_id, emotion, score, created_at, source)
    VALUES (?, ?, ?, ?, ?)
    """, (user_id, emotion, score, local_time, "journal"))
    conn.commit()
    conn.close()

    update_daily_summary(user_id)


def get_journals(user_id):

    conn = get_connection()
    cursor = conn.cursor() 

    cursor.execute("""
    SELECT id, content, emotion, created_at
    FROM journal
    WHERE user_id=?
    ORDER BY created_at DESC
    """, (user_id,))

    rows = cursor.fetchall()

    conn.close()

    return [
        {
            "id": r[0],
            "content": r[1],
            "emotion": r[2],
            "created_at": str(r[3])
        }
        for r in rows
    ]


def delete_journal(journal_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM journal WHERE id=?",
        (journal_id,)
    )

    conn.commit()
    conn.close()

