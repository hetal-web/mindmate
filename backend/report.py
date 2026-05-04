import os
import random
import sqlite3
import requests
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from datetime import datetime, timedelta
from dotenv import load_dotenv
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.pagesizes import A4
from database import get_connection, get_mood_data

load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")


# ─────────────────────────────────────────────
# Personality type descriptions (MBTI-style)
# ─────────────────────────────────────────────
PERSONALITY_DESCRIPTIONS = {
    "INTJ": {
        "title": "The Architect",
        "summary": "Strategic, independent, and highly analytical. INTJs are driven by logic and long-term vision, preferring depth over breadth in all pursuits.",
        "strengths": "Strategic thinking, decisiveness, high standards",
        "growth": "Opening up emotionally and embracing flexibility",
    },
    "INTP": {
        "title": "The Logician",
        "summary": "Curious and inventive thinkers who love exploring abstract ideas. INTPs seek precision and often lose themselves in thought.",
        "strengths": "Analytical ability, creativity, open-mindedness",
        "growth": "Following through on ideas and social engagement",
    },
    "ENTJ": {
        "title": "The Commander",
        "summary": "Bold, imaginative, and strong-willed leaders who always find a way — or make one. ENTJs thrive in roles of authority and direction.",
        "strengths": "Leadership, confidence, efficiency",
        "growth": "Patience and emotional sensitivity toward others",
    },
    "ENTP": {
        "title": "The Debater",
        "summary": "Smart, curious thinkers who cannot resist an intellectual challenge. ENTPs love to debate and explore all angles of an idea.",
        "strengths": "Wit, versatility, enthusiasm for ideas",
        "growth": "Focusing energy and respecting boundaries",
    },
    "INFJ": {
        "title": "The Advocate",
        "summary": "Quiet, insightful, and deeply empathetic. INFJs are driven by a core sense of idealism and the desire to help others find their way.",
        "strengths": "Empathy, vision, integrity",
        "growth": "Setting boundaries and avoiding burnout",
    },
    "INFP": {
        "title": "The Mediator",
        "summary": "Poetic and kind-hearted, INFPs are guided by their values and a deep desire for authenticity and meaning in everything they do.",
        "strengths": "Compassion, creativity, open-mindedness",
        "growth": "Managing self-criticism and staying grounded",
    },
    "ENFJ": {
        "title": "The Protagonist",
        "summary": "Charismatic and inspiring leaders who radiate warmth. ENFJs are natural mentors who genuinely care about the growth of those around them.",
        "strengths": "Empathy, communication, altruism",
        "growth": "Prioritising their own needs without guilt",
    },
    "ENFP": {
        "title": "The Campaigner",
        "summary": "Enthusiastic, creative, and sociable free spirits who find reasons to smile everywhere. ENFPs love connecting ideas and people.",
        "strengths": "Energy, empathy, creativity",
        "growth": "Maintaining focus and following through",
    },
    "ISTJ": {
        "title": "The Logistician",
        "summary": "Practical and fact-minded, ISTJs are reliable and dedicated individuals who take responsibilities seriously.",
        "strengths": "Dependability, thoroughness, honesty",
        "growth": "Embracing change and emotional expression",
    },
    "ISFJ": {
        "title": "The Defender",
        "summary": "Warm, caring protectors who are always ready to defend those they love. ISFJs combine practicality with deep emotional loyalty.",
        "strengths": "Reliability, patience, generosity",
        "growth": "Asserting personal needs and resisting overcommitment",
    },
    "ESTJ": {
        "title": "The Executive",
        "summary": "Excellent administrators who are unsurpassed at managing things and people. ESTJs value order, tradition, and clear expectations.",
        "strengths": "Organisation, dedication, directness",
        "growth": "Flexibility and emotional openness",
    },
    "ESFJ": {
        "title": "The Consul",
        "summary": "Caring, social, and popular people who are always eager to help. ESFJs thrive when they feel appreciated and connected to a community.",
        "strengths": "Warmth, practicality, loyalty",
        "growth": "Building self-worth beyond others' opinions",
    },
    "ISTP": {
        "title": "The Virtuoso",
        "summary": "Bold, practical experimenters who love to explore with their hands and eyes. ISTPs master tools and skills with quiet intensity.",
        "strengths": "Problem-solving, calm under pressure, adaptability",
        "growth": "Long-term planning and emotional communication",
    },
    "ISFP": {
        "title": "The Adventurer",
        "summary": "Flexible, charming artists who are always ready to explore something new. ISFPs live in the present and delight in creativity.",
        "strengths": "Creativity, empathy, adaptability",
        "growth": "Confidence and planning for the future",
    },
    "ESTP": {
        "title": "The Entrepreneur",
        "summary": "Smart, energetic, and perceptive people who enjoy living on the edge. ESTPs bring boldness and practicality to every situation.",
        "strengths": "Boldness, directness, perceptiveness",
        "growth": "Patience and consideration of long-term consequences",
    },
    "ESFP": {
        "title": "The Entertainer",
        "summary": "Spontaneous, energetic, and enthusiastic performers who love the spotlight and live for the moment.",
        "strengths": "Optimism, practicality, social energy",
        "growth": "Focus and long-term planning",
    },
}


def get_personality_description(personality_type):
    """Return the description dict for the given type, or a generic fallback."""
    return PERSONALITY_DESCRIPTIONS.get(personality_type.upper() if personality_type else "", {
        "title": "Unique Profile",
        "summary": "Your personality profile is one of a kind. Keep exploring what makes you, you.",
        "strengths": "Self-awareness and openness",
        "growth": "Continued self-exploration",
    })


def generate_mood_chart(user_id):

    from datetime import datetime
    import matplotlib.pyplot as plt

    data = get_mood_data(user_id)

    if not data:
        return None

    data = data[-7:]

    dates = [
        datetime.strptime(d["date"], "%Y-%m-%d").strftime("%b %d")
        for d in data
    ]

    scores = [d["score"] for d in data]

    filepath = f"mood_chart_{user_id}.png"

    plt.figure(figsize=(10, 5))
    plt.style.use('default')

    plt.plot(dates, scores, marker='o', linewidth=2.5, color='#4A90E2')
    plt.fill_between(dates, scores, color='#4A90E2', alpha=0.15)
    plt.scatter(dates[-1], scores[-1], color='red', s=80, label='Today', zorder=5)

    plt.title("Weekly Mood Trend", fontsize=14, fontweight='bold')
    plt.yticks(
        [0, 0.25, 0.5, 0.75, 1],
        ["Very Low", "Low", "Neutral", "Positive", "Very Positive"],
        fontsize=9
    )
    plt.ylim(0, 1)
    plt.xticks(rotation=30, fontsize=9)
    plt.grid(True, linestyle='--', alpha=0.3)
    plt.gca().spines['top'].set_visible(False)
    plt.gca().spines['right'].set_visible(False)
    plt.legend()
    plt.tight_layout()
    plt.savefig(filepath, dpi=300, bbox_inches='tight')
    plt.close()

    return filepath


def get_mood_by_date(user_id, date):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT score FROM mood_logs
        WHERE user_id = ? AND DATE(created_at) = ?
    """, (user_id, date))
    rows = cursor.fetchall()
    conn.close()
    return [{"score": row[0]} for row in rows]

def get_journal_by_date(user_id, date):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT content FROM journal
        WHERE user_id = ? AND DATE(created_at) = ?
    """, (user_id, date))
    rows = cursor.fetchall()
    conn.close()
    return rows

def update_daily_summary(user_id):
    from datetime import date
    today = str(date.today())
    conn = get_connection()
    cursor = conn.cursor()

    moods = get_mood_by_date(user_id, today)
    avg_mood = sum([m["score"] for m in moods]) / len(moods) if moods else 0

    journals = get_journal_by_date(user_id, today)
    journal_count = len(journals)

    cursor.execute("""
        SELECT SUM(duration) FROM meditation_logs
        WHERE user_id = ? AND date = ?
    """, (user_id, today))
    meditation = cursor.fetchone()[0] or 0

    if avg_mood > 0.5:
        summary = "Mostly positive day 😊"
    elif avg_mood < -0.5:
        summary = "Tough day 😔"
    else:
        summary = "Balanced day 😐"

    cursor.execute("""
        INSERT OR REPLACE INTO daily_summary (user_id, date, avg_mood, journal_count, summary, meditation)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (user_id, today, avg_mood, journal_count, summary, meditation))

    conn.commit()
    conn.close()


def get_personality(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT personality_type
        FROM personality_results
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT 1
    """, (user_id,))

    row = cursor.fetchone()
    conn.close()

    return row[0] if row else "Unknown"


def get_mental_score(user_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT score
        FROM mental_health_results
        WHERE user_id = ?
        ORDER BY timestamp DESC
        LIMIT 1
    """, (user_id,))

    row = cursor.fetchone()
    conn.close()

    if not row:
        return None

    raw_score = row[0]
    wellness_score = max(0, 100 - (raw_score * 2))
    return wellness_score

def analyze_mood(user_id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT score, DATE(created_at)
        FROM mood_logs
        WHERE user_id = ?
    """, (user_id,))

    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return None
    scores = [r[0] for r in rows]

    avg = sum(scores) / len(scores)

    best = max(rows, key=lambda x: x[0])
    worst = min(rows, key=lambda x: x[0])

    return {
        "avg": round(avg, 2),
        "best_day": best[1],
        "best_score": best[0],
        "worst_day": worst[1],
        "worst_score": worst[0]
    }

def mental_interpretation(score):

    if score >= 80:
        return "Your emotional wellbeing appears strong and stable."
    elif score >= 60:
        return "Your mental wellbeing appears generally positive with some fluctuations."
    elif score >= 40:
        return "Some emotional stress may be present. Taking time for self-care may help."
    elif score >= 25:
        return "You may be experiencing emotional strain. Support strategies could be beneficial."
    else:
        return "Emotional distress patterns detected. Speaking with supportive people or professionals may help."
    


def generate_wellness_report(user_id, filepath):

    styles = getSampleStyleSheet()

    personality = get_personality(user_id)
    personality_desc = get_personality_description(personality)
    mental_score = get_mental_score(user_id)
    mood = analyze_mood(user_id)
    
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM journal WHERE user_id=?", (user_id,))
    total_journals = cursor.fetchone()[0]

    cursor.execute("SELECT SUM(duration) FROM meditation_logs WHERE user_id=?", (user_id,))
    total_meditation = cursor.fetchone()[0] or 0

    conn.close()

    streak = calculate_streak(user_id)

    elements = []

    elements.append(Paragraph("MindMate Personal Wellness Report", styles["Title"]))
    elements.append(Spacer(1, 20))

    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d')}", styles["Normal"]))
    elements.append(Spacer(1, 20))

    # ── Personality Profile ──────────────────────────────────────────────────
    elements.append(Paragraph("<b>Personality Profile</b>", styles["Heading2"]))
    elements.append(Paragraph(
        f"Personality Type: <b>{personality}</b> — {personality_desc['title']}",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(personality_desc["summary"], styles["Normal"]))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(
        f"<b>Key Strengths:</b> {personality_desc['strengths']}",
        styles["Normal"]
    ))
    elements.append(Paragraph(
        f"<b>Growth Area:</b> {personality_desc['growth']}",
        styles["Normal"]
    ))
    elements.append(Spacer(1, 15))

    # ── Mental Health Capacity ───────────────────────────────────────────────
    elements.append(Paragraph("<b>Mental Health Capacity</b>", styles["Heading2"]))
    elements.append(Paragraph(f"Score: {mental_score} / 100", styles["Normal"]))
    elements.append(Paragraph(mental_interpretation(mental_score), styles["Normal"]))
    elements.append(Spacer(1, 15))

    # ── Mood Analysis ────────────────────────────────────────────────────────
    elements.append(Paragraph("<b>Mood Analysis</b>", styles["Heading2"]))
    elements.append(Paragraph(f"Average Mood Score: {mood['avg']}", styles["Normal"]))
    elements.append(Paragraph(f"Total Journals: {total_journals}", styles["Normal"]))
    elements.append(Paragraph(f"Total Meditation Sessions: {total_meditation} Minutes", styles["Normal"]))
    elements.append(Paragraph(f"Current Streak: {streak} days", styles["Normal"]))
    elements.append(Paragraph(f"Best Mood Day: {mood['best_day']}", styles["Normal"]))
    elements.append(Paragraph(f"Lowest Mood Day: {mood['worst_day']}", styles["Normal"]))

    elements.append(Spacer(1, 15))

    # ── Mood chart ───────────────────────────────────────────────────────────
    chart = generate_mood_chart(user_id)

    if chart:
        from reportlab.platypus import Image
        elements.append(Spacer(1, 20))
        elements.append(Image(chart, width=450, height=250))

    elements.append(Spacer(1, 15))
    elements.append(PageBreak())

    # ── AI Insights ──────────────────────────────────────────────────────────
    insight = generate_ai_insight(mood["avg"], mental_score)

    elements.append(Paragraph("AI Insights", styles["Heading2"]))
    elements.append(Paragraph(insight, styles["Normal"]))
    elements.append(Spacer(1, 15))

    # ── Recommendations ──────────────────────────────────────────────────────
    recommendations = generate_ai_recommendations(mood["avg"], mental_score)

    elements.append(Paragraph("<b>Recommendations</b>", styles["Heading2"]))

    for rec in recommendations:
        elements.append(Paragraph(f"• {rec}", styles["Normal"]))

    elements.append(Spacer(1, 15))

    # ── Overall Summary ──────────────────────────────────────────────────────
    elements.append(Paragraph("<b>Overall Summary</b>", styles["Heading2"]))
    elements.append(Paragraph(
        "This report summarises emotional patterns detected through your interactions with MindMate. "
        "Continued self-awareness and healthy coping strategies can support long-term wellbeing.",
        styles["Normal"]
    ))

    doc = SimpleDocTemplate(filepath, pagesize=A4)
    doc.build(elements)

    if chart and os.path.exists(chart):
        os.remove(chart)

    return filepath


def generate_recommendations(avg_mood, mental_score):

    general = [
        "Maintain a regular sleep schedule to support emotional balance.",
        "Spending time outdoors can help improve mood and reduce stress.",
        "Talking with trusted friends or family members may provide emotional relief.",
        "Taking short breaks during work or study sessions can help prevent burnout.",
        "Engaging in hobbies you enjoy can support positive emotional wellbeing."
    ]

    stress = [
        "Practice breathing exercises or mindfulness techniques to manage stress.",
        "Breaking large tasks into smaller steps may make challenges feel more manageable.",
        "Limiting screen time before sleep may help improve rest quality."
    ]

    low_mood = [
        "Consider journaling your thoughts to better understand emotional patterns.",
        "Gentle physical activity such as walking can help improve mood.",
        "Listening to music or engaging in creative activities may help lift mood."
    ]

    positive = [
        "Continue maintaining the habits that support your positive emotional wellbeing.",
        "Sharing positive experiences with others can strengthen emotional resilience.",
        "Reflecting on accomplishments may help reinforce positive mindset."
    ]

    recommendations = []
    recommendations.extend(random.sample(general, 2))

    if mental_score < 50:
        recommendations.extend(random.sample(low_mood, 2))
    elif avg_mood < 0:
        recommendations.extend(random.sample(stress, 2))
    else:
        recommendations.extend(random.sample(positive, 2))

    return recommendations


from datetime import datetime, timedelta

def calculate_streak(user_id):

    conn = get_connection() 
    cursor = conn.cursor()

    cursor.execute("""
        SELECT DISTINCT date
        FROM daily_summary
        WHERE user_id=?
        ORDER BY date DESC
    """, (user_id,))

    rows = cursor.fetchall()

    if not rows:
        return 0

    streak = 0
    today = datetime.today().date()

    for row in rows:
        entry_date = datetime.strptime(row[0], "%Y-%m-%d").date()
        if entry_date == today - timedelta(days=streak):
            streak += 1
        else:
            break

    return streak

def is_new_user(user_id):
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) FROM mood_logs WHERE user_id=?", (user_id,))
    mood_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM journal WHERE user_id=?", (user_id,))
    journal_count = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM mental_health_results WHERE user_id=?", (user_id,))
    mental_count = cursor.fetchone()[0]

    conn.close()

    return (mood_count + journal_count + mental_count) == 0


import requests

def generate_ai_recommendations(avg_mood, mental_score):

    prompt = f"""
You are a mental wellness assistant.

User data:
- Average mood: {avg_mood}
- Mental health score: {mental_score}/100

Give 3 short, practical, supportive recommendations.

Rules:
- Keep each recommendation 1 sentence
- Be human and empathetic
- Do NOT repeat phrases
- No numbering
"""

    try:
        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "system", "content": "You help with mental wellness."},
                    {"role": "user", "content": prompt}
                ],
                "temperature": 0.7
            }
        )

        data = res.json()
        text = data["choices"][0]["message"]["content"]
        recommendations = [line.strip("-• ") for line in text.split("\n") if line.strip()]
        return recommendations[:3]

    except Exception as e:
        print("AI recommendation error:", e)
        return [
            "Take a short break and breathe slowly.",
            "Talk to someone you trust.",
            "Get some fresh air or light movement."
        ]


def generate_ai_insight(avg_mood, mental_score):
    prompt = f"""
Analyse this user's mental wellness:

- Avg mood: {avg_mood}

Write a short 2-3 line insight about their emotional pattern.
Be supportive and human.
"""

    try:
        res = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {"role": "user", "content": prompt}
                ]
            }
        )

        return res.json()["choices"][0]["message"]["content"]

    except:
        return "Your emotional patterns show balance with areas to improve. Keep taking care of yourself."