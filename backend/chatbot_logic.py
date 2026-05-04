import re
import json
import os
import random
from datetime import datetime
from dotenv import load_dotenv
from textblob import TextBlob
from groq import Groq
from database import get_connection
from report import update_daily_summary

load_dotenv()
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def safe_lower(text):
    return text.lower() if isinstance(text, str) else ""


# ================================
# INTENT DETECTION
# ================================

def detect_intent(message):
    msg = safe_lower(message)
    greetings = ["hi", "hello", "hey", "good morning", "good evening"]
    thanks = ["thanks", "thank you"]
    bye = ["bye", "goodbye", "see you"]

    if any(word in msg for word in greetings):
        return "greeting"
    if any(word in msg for word in thanks):
        return "thanks"
    if any(word in msg for word in bye):
        return "bye"
    return "emotion"


def get_intent_response(intent):
    responses = {
        "greeting": [
            "Hello. How are you feeling today?",
            "Hi. I'm here to listen.",
            "Hey. Tell me what's on your mind.",
            "Hello. You can talk to me freely."
        ],
        "thanks": [
            "You're welcome.",
            "I'm glad I could help.",
            "Anytime. I'm here for you."
        ],
        "bye": [
            "Take care.",
            "Goodbye. Remember you're not alone.",
            "See you soon."
        ]
    }
    return random.choice(responses[intent])


# ================================
# SENTIMENT
# ================================

def detect_hindi_sentiment(message):
    positive_words = [
        "खुश", "अच्छा", "बढ़िया", "शानदार", "मस्त", "ठीक", "खुशी",
        "प्यार", "उत्साह", "प्रसन्न", "आनंद", "सुकून", "राहत", "हंसी"
    ]
    negative_words = [
        "दुखी", "उदास", "बुरा", "तकलीफ", "दर्द", "रोना", "परेशान",
        "थका", "निराश", "अकेला", "डर", "चिंता", "गुस्सा", "टूटा",
        "बेकार", "नाराज़", "तनाव", "थकान", "घबराहट", "डरा", "बेचैन"
    ]
    pos = sum(1 for w in positive_words if w in message)
    neg = sum(1 for w in negative_words if w in message)
    if pos > neg:
        return "happy", 0.5
    elif neg > pos:
        return "sad", -0.5
    return "neutral", 0.0


def detect_sentiment(message):
    if re.search(r"[ऀ-ॿ]", message):
        return detect_hindi_sentiment(message)
    analysis = TextBlob(message)
    polarity = analysis.sentiment.polarity
    if polarity > 0.2:
        return "happy", polarity
    elif polarity < -0.2:
        return "sad", polarity
    else:
        return "neutral", polarity


def get_mood_label(score):
    if score == 2:
        return "Positive"
    elif score == 1:
        return "Slightly Positive"
    elif score == 0:
        return "Neutral"
    elif score == -1:
        return "Low"
    else:
        return "Very Low"


# ================================
# EMOTION DETECTION
# ================================

emotion_map_hindi = {
    "intense_sadness": "sad",
    "sadness": "sad",
    "loneliness": "sad",
    "guilt": "sad",
    "anxiety": "stressed",
    "stress": "stressed",
    "anger": "angry",
    "happiness": "happy",
    "fear": "stressed",
}

def detect_emotion(message):
    msg = safe_lower(message)

    hindi_emotion_keywords = {
        "intense_sadness": ["टूट गया", "टूट गई", "जीना नहीं", "खत्म करना", "बेकार हूँ", "कोई उम्मीद नहीं", "सब खत्म"],
        "sadness": ["दुखी", "उदास", "रोना", "दर्द", "तकलीफ", "दिल टूटा", "निराश", "बुरा लग रहा", "अच्छा नहीं", "परेशान", "बहुत बुरा"],
        "anxiety": ["चिंता", "घबराहट", "डर", "बेचैन", "नर्वस", "घबरा", "डरा हुआ", "सोच नहीं पा रहा", "बहुत सोच रहा", "परेशान"],
        "anger": ["गुस्सा", "नाराज़", "चिढ़", "गुस्से में", "बहुत गुस्सा", "नफ़रत", "झल्लाहट", "चिढ़ा हुआ"],
        "loneliness": ["अकेला", "अकेली", "कोई नहीं", "कोई समझता नहीं", "किसी को परवाह नहीं", "अलग-थलग", "छोड़ दिया"],
        "guilt": ["मेरी गलती", "पछतावा", "शर्म", "गलत किया", "माफ़ी", "खुद को माफ़ नहीं", "काश ऐसा न होता"],
        "stress": ["तनाव", "थका हुआ", "थकान", "बोझ", "बहुत काम", "नहीं संभाल पा रहा", "जला हुआ", "ओवरलोड", "डेडलाइन", "प्रेशर"],
        "happiness": ["खुश", "बहुत खुश", "अच्छा लग रहा", "मज़ा आया", "शानदार", "बढ़िया", "खुशी", "उत्साह", "जोश", "प्रसन्न", "आनंद"],
        "fear": ["डर", "डरा हुआ", "डरी हुई", "भयभीत", "खौफ", "घबराहट"],
    }

    if re.search(r"[ऀ-ॿ]", message):
        for emotion, keywords in hindi_emotion_keywords.items():
            for word in keywords:
                if word in message:
                    print("HINDI EMOTION DETECTED:", emotion)
                    mapped = emotion_map_hindi.get(emotion, emotion)
                    return mapped, emotion_to_score(mapped)

    emotion_keywords = {
        "intense_sadness": ["devastated", "broken", "can't go on", "empty", "worthless", "hopeless"],
        "sadness": ["sad", "down", "crying", "hurt", "upset", "depressed", "unhappy",
                    "miserable", "heartbroken", "lonely", "disappointed", "feel bad", "bad day", "bad",
                    "not good", "terrible", "awful", "worst", "sadness", "not okay"],
        "anxiety": ["anxious", "nervous", "worried", "panic", "overthinking", "stressed",
                    "uneasy", "tense", "apprehensive", "dread", "fearful", "scared", "anxiety"],
        "anger": ["angry", "mad", "furious", "annoyed", "frustrated", "irritated", "resentful",
                  "outraged", "rage", "hate", "disgusted", "frustration", "upset", "pissed", "offended"],
        "loneliness": ["alone", "lonely", "isolated", "no one understands", "nobody cares",
                       "feel like a burden", "left out", "abandoned", "disconnected", "loneliness",
                       "nobody is there", "no one is there", "feel invisible", "feel like i don't belong"],
        "guilt": ["my fault", "regret", "shouldn't have", "feel bad about", "guilty",
                  "remorse", "ashamed", "embarrassed", "blame myself", "guilt",
                  "wish i could take it back", "i messed up", "i was wrong"],
        "stress": ["stressed", "pressure", "overwhelmed", "too much work", "can't handle",
                   "burned out", "exhausted", "drained", "stress", "workload", "deadlines", "busy", "overloaded"],
        "happiness": ["happy", "very happy", "so happy", "excited", "great", "good news", "proud",
                      "amazing", "good", "feeling good", "joy", "feel good", "wonderful", "fantastic",
                      "glad", "awesome", "happiest"],
        "fear": ["scared", "afraid", "fear", "terrified", "frightened", "panic", "worried", "nervous"],
        "disgust": ["disgust", "gross", "repulsed", "nauseated", "disgusted", "sickened"],
    }

    emotion_map = {
        "intense_sadness": "sad",
        "sadness": "sad",
        "loneliness": "sad",
        "guilt": "sad",
        "anxiety": "stressed",
        "stress": "stressed",
        "anger": "angry",
        "happiness": "happy",
        "fear": "stressed",
        "disgust": "angry"
    }

    for emotion, keywords in emotion_keywords.items():
        for word in keywords:
            if word in msg:
                print("DETECTED EMOTION:", emotion)
                emotion = emotion_map.get(emotion, emotion)
                return emotion, emotion_to_score(emotion)

    sentiment_emotion, polarity = detect_sentiment(msg)
    print("SENTIMENT DETECTED:", sentiment_emotion)
    return sentiment_emotion, emotion_to_score(sentiment_emotion)


def detect_intensity(message):
    msg = safe_lower(message)
    score = 0

    strong_words = ["very", "extremely", "really", "so", "too much", "completely", "totally", "deeply"]
    crisis_words = ["hopeless", "worthless", "empty", "broken"]

    for word in strong_words:
        if word in msg:
            score += 1
    for word in crisis_words:
        if word in msg:
            score += 2

    if score >= 3:
        return "high"
    elif score >= 1:
        return "medium"
    else:
        return "low"


# ================================
# GET RESPONSE
# ================================

def get_response(user_id, emotion):
    python_responses = {
        "loneliness": [
            "I'm really sorry you're feeling alone.",
            "Feeling disconnected can be painful.",
            "You don't have to face this by yourself."
        ],
        "anger": [
            "It sounds like something really upset you.",
            "I can sense frustration there.",
            "That must have been intense."
        ],
        "guilt": [
            "It seems like you're being hard on yourself.",
            "Guilt can weigh heavily.",
            "You're reflecting deeply on this."
        ],
        "stress": [
            "That sounds overwhelming.",
            "It seems like there's a lot on your plate.",
            "Pressure like that can be exhausting."
        ],
        "anxiety": [
            "It sounds like you're feeling tense or worried.",
            "Anxiety can feel overwhelming.",
            "That anxious feeling can be exhausting."
        ],
        "sadness": [
            "I'm really sorry you're feeling this way.",
            "That sounds difficult.",
            "It must be hard for you."
        ],
        "happiness": [
            "That's wonderful to hear.",
            "I'm really happy for you.",
            "That sounds positive."
        ]
    }

    if emotion in python_responses:
        responses = python_responses[emotion]
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT response FROM chat_history
            WHERE user_id = ? ORDER BY id DESC LIMIT 3
        """, (user_id,))
        recent = [r[0] for r in cursor.fetchall()]
        conn.close()
        filtered = [r for r in responses if r not in recent]
        if not filtered:
            filtered = responses
        return random.choice(filtered)

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT response FROM chat_history
        WHERE user_id = ? ORDER BY id DESC LIMIT 6
    """, (user_id,))
    recent = [r[0] for r in cursor.fetchall()]
    cursor.execute("SELECT response FROM chatbot_responses WHERE emotion = ?", (emotion,))
    rows = cursor.fetchall()
    conn.close()

    if rows:
        responses = [r[0] for r in rows if r[0] not in recent]
        if not responses:
            responses = [r[0] for r in rows]
        random.shuffle(responses)
        if responses:
            return random.choice(responses)

    return random.choice([
        "I'm here with you.",
        "Tell me more about how you're feeling.",
        "You can take your time.",
        "I'm listening."
    ])


# ================================
# MEMORY SYSTEM
# ================================

def extract_topic(message):
    msg = message.lower()
    topics = []

    if any(word in msg for word in ["exam", "study", "college", "assignment", "test", "school",
                                     "university", "class", "course", "homework", "project",
                                     "finals", "midterms", "grades", "professor", "teacher"]):
        topics.append("study")
    if any(word in msg for word in ["work", "job", "boss", "office", "career"]):
        topics.append("work")
    if any(keyword in msg for keyword in ["boyfriend", "girlfriend", "bf", "gf", "relationship",
                                           "breakup", "broke up", "partner", "ex", "dating",
                                           "marriage", "divorce", "love", "crush", "heartbroken",
                                           "cheated on", "unfaithful"]):
        topics.append("relationship")
    if any(keyword in msg for keyword in ["family", "mother", "father", "parents", "home", "brother", "sister"]):
        topics.append("family")
    if any(keyword in msg for keyword in ["health", "sick", "ill", "pain"]):
        topics.append("health")
    if any(word in msg for word in ["lonely", "alone", "isolated"]):
        topics.append("loneliness")

    return topics


def save_memory(user_id, message, emotion):
    topics = extract_topic(message)
    topic = topics[0] if topics else None
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO memory (user_id, topic, message, emotion)
        VALUES (?, ?, ?, ?)
    """, (user_id, topic, message, emotion))
    conn.commit()
    conn.close()


def get_memory(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT topic, message, emotion FROM memory
        WHERE user_id = ? ORDER BY id DESC LIMIT 1
    """, (user_id,))
    result = cursor.fetchone()
    conn.close()
    return result


def get_recent_messages(user_id, limit=3):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT message FROM chat_history
        WHERE user_id = ? ORDER BY id DESC LIMIT ?
    """, (user_id, limit))
    rows = cursor.fetchall()
    conn.close()
    return [safe_lower(r[0]) for r in rows]


# ================================
# SAVE CHAT HISTORY
# ================================

def save_chat(user_id, message, emotion, response):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO chat_history (user_id, message, emotion, response)
        VALUES (?, ?, ?, ?)
    """, (user_id, message, emotion, response))
    conn.commit()
    conn.close()


# ================================
# EMOTIONAL PROFILE
# ================================

def update_emotional_profile(user_id, emotion):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO emotional_profile (user_id, emotion) VALUES (?, ?)
    """, (user_id, emotion))
    conn.commit()
    conn.close()


def enhance_empathy(emotion, message, base_response):
    topic = extract_topic(message)

    if topic and "relationship" in topic:
        prefix = "Breakups can feel overwhelming. "
    elif topic and "study" in topic and emotion in ["neutral", "anxiety"]:
        prefix = "Exams can bring pressure. "
    elif emotion == "intense_sadness":
        prefix = random.choice([
            "It sounds like this is affecting you deeply. ",
            "That seems really heavy on your heart. ",
            "I can sense how intense this feels for you. "
        ])
    elif emotion == "sadness":
        prefix = random.choice([
            "I'm really sorry you're feeling this way. ",
            "That sounds difficult. ",
            "It must be hard for you. "
        ])
    elif emotion == "happiness":
        prefix = random.choice([
            "That's wonderful to hear. ",
            "I'm really happy for you. ",
            "That sounds great. What's making you feel this way?"
        ])
    elif emotion == "anger":
        prefix = random.choice([
            "It sounds like something really frustrated you. ",
            "I can sense some anger there. ",
            "That must have been upsetting. "
        ])
    elif emotion == "loneliness":
        prefix = random.choice([
            "Feeling alone can be really painful. ",
            "It sounds like you're feeling disconnected. ",
            "Loneliness can feel heavy. "
        ])
    elif emotion == "guilt":
        prefix = random.choice([
            "It sounds like you're being hard on yourself. ",
            "Guilt can weigh heavily on the heart. ",
            "You're reflecting deeply on what happened. "
        ])
    elif emotion == "stress":
        prefix = random.choice([
            "That sounds really stressful. ",
            "It seems like there's a lot on your plate. ",
            "Pressure like that can feel overwhelming. "
        ])
    elif emotion == "anxiety":
        prefix = random.choice([
            "Anxiety can feel overwhelming. ",
            "It sounds like you're feeling tense or worried. ",
            "That anxious feeling can be exhausting. "
        ])
    else:
        prefix = ""

    return prefix + base_response


def generate_follow_up(emotion):
    follow_ups = {
        "sadness": [
            "Would you like to tell me what happened?",
            "What do you think is affecting you the most right now?",
            "Sometimes talking helps. Would you like to share more?",
            "Would a small breathing pause help right now?"
        ],
        "happiness": [
            "What made this happen?",
            "Would you like to share more about it?",
            "What are you most excited about?"
        ],
        "anger": [
            "What triggered this feeling?",
            "Do you want to talk about what caused it?",
            "Has this been bothering you for long?"
        ],
        "anxiety": [
            "What do you think is making you feel anxious?",
            "Is there something specific worrying you?",
            "When does the anxiety feel strongest?"
        ],
        "neutral": [
            "Would you like to share more?",
            "Tell me more about what you're thinking."
        ]
    }
    options = follow_ups.get(emotion, ["Would you like to share more?"])
    return " " + random.choice(options)


def get_last_emotion(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT emotion FROM chat_history
        WHERE user_id = ? ORDER BY timestamp DESC LIMIT 1
    """, (user_id,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None


# ================================
# MAIN CHATBOT FUNCTION
# ================================

def chatbot_reply(user_id, message):

    # 1. Crisis Detection
    risk_level = detect_crisis_level(message)

    if risk_level == "high":
        return high_risk_response()
    elif risk_level == "medium":
        return medium_risk_response()

    # 2. Intent Detection
    intent = detect_intent(message)
    if intent != "emotion":
        response = get_intent_response(intent)
        save_chat(user_id, message, "neutral", response)
        return {"emotion": "neutral", "response": response}

    # 3. Emotion Detection
    emotion_result = detect_emotion(message)
    if isinstance(emotion_result, tuple):
        emotion, score = emotion_result
    else:
        emotion = emotion_result
        score = emotion_to_score(emotion)

    # 4. Context — only update emotion if it was neutral
    if emotion == "neutral":
        recent_messages = get_recent_messages(user_id)
        context_text = " ".join(recent_messages) + " " + message
        context_result = detect_emotion(context_text)
        if context_result is not None:
            if isinstance(context_result, tuple):
                emotion, score = context_result
            else:
                emotion = context_result
                score = emotion_to_score(emotion)

    intensity = detect_intensity(message)
    previous_emotion = get_last_emotion(user_id)

    # 5. Mood Logging
    score = emotion_to_score(emotion)
    conn = get_connection()
    cursor = conn.cursor()
    local_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        INSERT INTO mood_logs (user_id, emotion, score, created_at, source)
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, emotion, score, local_time, "chat"))
    conn.commit()
    conn.close()

    update_daily_summary(user_id)

    # 6. Topic + Memory
    topics = extract_topic(message)
    current_topic = topics[0] if topics else None
    memory_text = ""

    if current_topic:
        memory = get_memory(user_id)
        if memory:
            topic, old_msg, old_emotion = memory
            if topic == current_topic and safe_lower(old_msg) != safe_lower(message):
                memory_text = f"Earlier you mentioned your {topic}. "

    save_memory(user_id, message, emotion)

    # 7. Build Response
    topic = topics[0] if topics else None
    base_response = get_response(user_id, emotion)
    human_response = build_human_response(emotion, topic, base_response)
    personality = get_user_personality(user_id)
    adaptive_response = adapt_tone(personality, human_response)
    adaptive_response = adjust_for_topic(topic, adaptive_response)

    if intensity == "high":
        adaptive_response = "It sounds like you're feeling this very deeply. " + adaptive_response
    elif intensity == "medium":
        adaptive_response = "I can sense this is affecting you. " + adaptive_response

    # 8. Context Awareness
    summary = summarize_emotions(user_id)
    pattern = detect_conversation_pattern(user_id)

    response_parts = []

    if previous_emotion:
        shift_line = detect_emotion_shift(previous_emotion, emotion)
        if shift_line:
            response_parts.append(shift_line)

    if pattern and random.random() < 0.4:
        response_parts.append(pattern)

    if summary and random.random() < 0.3:
        response_parts.append(summary)

    if memory_text:
        response_parts.append(memory_text)

    sentences = adaptive_response.split(". ")
    adaptive_response = ".  ".join(sentences[:random.randint(1, 2)])
    response_parts.append(adaptive_response)

    if current_topic and random.random() < 0.25:
        response_parts.append(generate_context_followup(current_topic))

    final_response = "  ".join(response_parts)
    final_response = add_variation(final_response, emotion)

    sentences = final_response.split(". ")
    seen = []
    for s in sentences:
        if s not in seen:
            seen.append(s)
    final_response = ".  ".join(seen)

    save_chat(user_id, message, emotion, final_response)
    update_emotional_profile(user_id, emotion)

    return {"emotion": emotion, "response": final_response}


def detect_emotion_shift(previous, current):
    if previous in ["sadness", "anxiety"] and current == "happiness":
        return "I'm really glad things seem a little better now."
    if previous == "happiness" and current in ["sadness", "anxiety"]:
        return "It sounds like your mood has changed."
    return ""


# ================================
# MBTI / PERSONALITY
# ================================

MBTI_DESCRIPTIONS = {
    "INTJ": "Strategic and logical thinker.",
    "INTP": "Innovative and analytical.",
    "ENTJ": "Natural leader and confident.",
    "ENTP": "Creative and curious.",
    "INFJ": "Insightful and empathetic.",
    "INFP": "Emotional and deep thinker.",
    "ENFJ": "Charismatic and inspiring.",
    "ENFP": "Energetic and creative.",
    "ISTJ": "Responsible and dependable.",
    "ISFJ": "Supportive and caring.",
    "ESTJ": "Organized and efficient.",
    "ESFJ": "Friendly and loyal.",
    "ISTP": "Calm and practical.",
    "ISFP": "Creative and gentle.",
    "ESTP": "Energetic and bold.",
    "ESFP": "Fun loving and spontaneous."
}


def calculate_personality(answers):
    scores = {"E": 0, "I": 0, "S": 0, "N": 0, "T": 0, "F": 0, "J": 0, "P": 0}

    conn = get_connection()
    cursor = conn.cursor()

    for q_id, answer in answers.items():
        cursor.execute("SELECT trait_a, trait_b FROM personality_questions WHERE id=?", (q_id,))
        row = cursor.fetchone()
        if not row:
            continue
        trait_a, trait_b = row
        if answer == "A":
            scores[trait_a] += 1
        else:
            scores[trait_b] += 1

    conn.close()

    personality = ""
    personality += "E" if scores["E"] >= scores["I"] else "I"
    personality += "S" if scores["S"] >= scores["N"] else "N"
    personality += "T" if scores["T"] >= scores["F"] else "F"
    personality += "J" if scores["J"] >= scores["P"] else "P"

    return personality, MBTI_DESCRIPTIONS.get(personality, "Unique personality")


def calculate_mental_health_level(score):
    if score <= 5:
        return "Minimal"
    elif score <= 10:
        return "Mild"
    elif score <= 15:
        return "Moderate"
    else:
        return "Severe"


def cbt_reflection(emotion, message):
    reflections = {
        "sadness": [
            "What thoughts are going through your mind right now?",
            "Do you notice any situation that triggers this feeling?",
            "If a friend felt like this, what would you tell them?"
        ],
        "intense_sadness": [
            "When emotions feel this strong, slowing down can help. What feels overwhelming?",
            "Are there thoughts repeating in your mind?",
            "What feels hardest about this situation right now?"
        ],
        "anxiety": [
            "What do you feel worried about specifically?",
            "Is there something coming up that is causing stress?",
            "When does the anxious feeling feel strongest?"
        ],
        "anger": [
            "What triggered this anger?",
            "What would help you release some of this frustration?",
            "Is this anger connected to something deeper?"
        ],
        "loneliness": [
            "When do you feel most alone?",
            "Is there someone you wish you could talk to?",
            "What would connection look like for you right now?"
        ],
        "guilt": [
            "What are you telling yourself about this situation?",
            "Would you judge a friend the same way?",
            "Is there room for self-forgiveness here?"
        ],
        "stress": [
            "What feels most overwhelming right now?",
            "Is there one small step that could reduce this pressure?",
            "What usually helps you when things feel like too much?"
        ],
        "happiness": [
            "What do you think contributed most to this positive feeling?"
        ]
    }
    options = reflections.get(emotion, [])
    if not options:
        return ""
    return "  " + random.choice(options)


# ================================
# CRISIS DETECTION
# ================================

def detect_crisis(message):
    msg = message.lower()
    crisis_keywords = [
        "suicide", "kill myself", "end my life", "want to die",
        "i want to die", "i don't want to live", "no reason to live",
        "suicidal thoughts", "suicidal ideation",
        "life is pointless", "i give up", "can't go on",
        "nothing matters anymore", "i am done", "give up on life",
        "don't want to exist", "cut myself", "hurt myself",
        "self harm", "self-harm", "i feel empty", "i feel hopeless",
        "i am worthless"
    ]
    for word in crisis_keywords:
        if word in msg:
            return True
    return False


def get_crisis_response():
    return (
        "I'm really sorry you're feeling this way. You don't have to go through this alone. 💙\n\n"
        "It might really help to talk to someone you trust or a professional right now.\n\n"
        "📞 India Helplines:\n"
        "• AASRA: +91-9820466726\n"
        "• iCALL: +91-9152987821\n\n"
        "If you're in immediate danger, please seek help nearby right now.\n\n"
        "I'm here with you. Do you want to tell me what's been going on?"
    )


def detect_crisis_level(message):
    msg = safe_lower(message)

    high_risk = [
        "kill myself", "suicide", "end my life", "want to die",
        "self harm", "hurt myself", "dying", "die", "death",
        "no reason to live", "don't want to exist", "give up on life"
    ]
    medium_risk = [
        "i can't take this", "i give up", "life is not worth living",
        "i feel hopeless", "i don't want to exist", "no reason to live"
    ]

    for phrase in high_risk:
        if phrase in msg:
            return "high"
    for phrase in medium_risk:
        if phrase in msg:
            return "medium"
    return None


def crisis_response():
    return {
        "emotion": "crisis",
        "response": (
            "I'm really sorry that you're feeling this much pain. "
            "You are not alone, and your life matters. "
            "It might really help to talk to someone immediately.\n\n"
            "If you're in India, you can call:\n"
            "• KIRAN Mental Health Helpline: 1800-599-0019 (24/7)\n"
            "• iCall: 9152987821\n\n"
            "If you're in immediate danger, please call emergency services (112 in India).\n\n"
            "Would you be willing to reach out to someone right now? I'm here with you."
        )
    }


def high_risk_response():
    return {
        "emotion": "crisis",
        "response": (
            "I'm really sorry you're feeling this much pain. "
            "You deserve support and you are not alone.\n\n"
            "Please consider reaching out immediately:\n\n"
            "🇮🇳 India:\n"
            "• KIRAN Mental Health Helpline: 1800-599-0019 (24/7)\n"
            "• iCall: 9152987821\n\n"
            "🌍 International:\n"
            "• Suicide & Crisis Lifeline (US): 988\n"
            "• Emergency services: 112 / 911\n\n"
            "If you are in immediate danger, please call emergency services now.\n\n"
            "Would you be willing to contact someone right now? I care about your safety."
        ),
        "crisis": True
    }


def medium_risk_response():
    return {
        "emotion": "high_distress",
        "response": (
            "It sounds like you're feeling overwhelmed and exhausted. "
            "When things feel this heavy, talking to someone can really help.\n\n"
            "If you're in India, you can call:\n"
            "• KIRAN: 1800-599-0019\n\n"
            "If you're elsewhere, local mental health helplines are available in most countries.\n\n"
            "Would you like to tell me what feels most overwhelming right now?"
        ),
        "crisis": False
    }


# ================================
# PERSONALITY / TONE
# ================================

def get_user_personality(user_id):
    try:
        conn = get_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT personality_type FROM personality_results
            WHERE user_id=? ORDER BY id DESC LIMIT 1
        """, (user_id,))
        row = cursor.fetchone()
        conn.close()
        if row:
            return row[0]
    except:
        return None
    return None


def build_human_response(emotion, topic, base_response):
    openings = {
        "sadness": ["That sounds really tough.", "I can imagine that feels heavy.", "That must be difficult."],
        "happiness": ["That's really nice to hear.", "That sounds positive.", "I'm glad things feel good."],
        "anxiety": ["That sounds stressful.", "It seems like there's pressure.", "I can sense some tension there."],
        "neutral": ["", "", ""]
    }

    prefix = random.choice(openings.get(emotion, [""]))

    if topic == "study":
        context_line = "Exams can create a lot of pressure."
    elif topic == "relationship":
        context_line = random.choice([
            "Breakups can feel incredibly painful.",
            "Relationship struggles can affect us deeply.",
            "Losing someone close can really hurt.",
            "When relationships change suddenly, it can be very hard.",
            "Heartbreak can take time to process."
        ])
    elif topic == "family":
        context_line = "Family situations can be complex."
    else:
        context_line = ""

    if emotion == "happiness":
        base_response = base_response.replace("I'm here to listen.", "")
        base_response = base_response.replace("You don't have to face this alone.", "")

    parts = [prefix, context_line, base_response]
    response = " ".join([p for p in parts if p]).strip()
    response = re.sub(r'(?<=[a-z])(?=[A-Z])', '. ', response)
    response = re.sub(r'\s+', ' ', response)
    sentences = response.split(". ")
    response = ". ".join(sentences[:2])
    return response


def adapt_tone(personality, response):
    if not personality:
        return response
    if personality in ["INFJ", "INFP"]:
        return response + " What do you think this means for you?"
    if personality in ["ENTJ", "INTJ", "ESTJ"]:
        return response + " Let's look at this logically. What can you control here?"
    if personality in ["ENFP", "ENFJ", "ESFP"]:
        return response + " How are you feeling about it right now?"
    return response


def add_variation(response, emotion=None):
    if emotion == "happiness":
        prefixes = ["", "That's great! ", "I'm glad to hear that. "]
        suffixes = ["", " That sounds really positive."]
    else:
        prefixes = [" ", "Thank you for sharing that.", "I'm really glad you told me."]
        suffixes = [" ", " I'm here to listen."]

    prefix = random.choice(prefixes)
    suffix = random.choice(suffixes)
    return prefix + response + suffix


def adjust_for_topic(topic, response):
    topic_prefix = {
        "study": ["Academic pressure can feel overwhelming.", "Exams can create a lot of stress.", "Studying pressure can really build up."],
        "relationship": ["Relationships can be emotionally complex.", "Situations involving someone close can feel intense.", "Connection with others can deeply affect our emotions."],
        "family": ["Family situations can be complicated.", "Things involving family can carry a lot of emotion."],
        "work": ["Work pressure can build up over time.", "Career stress can be exhausting."],
        "health": ["Health concerns can feel very scary.", "It's understandable to feel worried about your health."]
    }
    if topic in topic_prefix:
        return random.choice(topic_prefix[topic]).rstrip(".") + ". " + response
    return response


def summarize_emotions(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT emotion FROM chat_history
        WHERE user_id = ? ORDER BY id DESC LIMIT 8
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()
    emotions = [r[0] for r in rows]

    if emotions.count("anxiety") >= 3:
        return "It seems like you've been feeling quite anxious lately."
    if emotions.count("sadness") >= 3:
        return "It seems like you've been carrying a lot of sadness recently."
    if emotions.count("anger") >= 3:
        return "It sounds like frustration has been building up."
    return ""


def detect_conversation_pattern(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT message FROM chat_history
        WHERE user_id = ? ORDER BY id DESC LIMIT 6
    """, (user_id,))
    rows = cursor.fetchall()
    conn.close()

    if not rows:
        return ""

    messages = [safe_lower(r[0]) for r in rows]
    exam_count = sum(1 for m in messages if "exam" in m or "study" in m)
    work_count = sum(1 for m in messages if "work" in m or "job" in m)
    lonely_count = sum(1 for m in messages if "lonely" in m or "alone" in m)

    if exam_count >= 3:
        return "You've mentioned exam stress several times. That sounds really overwhelming. "
    if work_count >= 3:
        return "It seems like work has been stressing you for a while. "
    if lonely_count >= 3:
        return "You've mentioned feeling lonely several times. That must be really difficult. "
    return ""


def reset_chat(user_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM chat_history WHERE user_id = ?", (user_id,))
    cursor.execute("DELETE FROM memory WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()


def generate_context_followup(topic):
    followups = {
        "study": ["Are exams coming up soon?", "What part of studying feels most overwhelming right now?", "Do you feel pressure from expectations?"],
        "work": ["Has work been stressful for a long time?", "Is it workload or something happening at work?", "Do you feel like you're getting enough rest?"],
        "relationship": ["Do you feel comfortable sharing what happened?", "Has this situation been going on for a while?", "How did that make you feel?"],
        "family": ["Family situations can be complicated. What happened?", "Has this been affecting you recently?"],
        "health": ["Health worries can be stressful. What's been on your mind?"],
        "loneliness": ["Have you been feeling lonely for a while?", "Do you feel like you have someone you can talk to?"]
    }
    options = followups.get(topic, [])
    if not options:
        return ""
    return random.choice(options)


def emotion_to_score(emotion):
    if not emotion:
        return 0
    emotion = emotion.lower()
    mapping = {
        "happy": 2,
        "neutral": 0,
        "sad": -1,
        "angry": -2,
        "stressed": -2
    }
    return mapping.get(emotion, 0)


def compose_response(emotion, base_response, follow_up=""):
    empathy = {
        "sadness": [
            "I'm really sorry you're feeling this way.", "That sounds difficult.",
            "It must be hard.", "I can imagine that's not easy.",
            "That must feel overwhelming.", "That sounds tough to deal with.",
            "I hear you — that's not easy."
        ],
        "anxiety": ["That sounds stressful.", "I can imagine that feels overwhelming."],
        "happiness": ["That's wonderful to hear!", "I'm really glad you're feeling happy."],
        "anger": ["It sounds like something really upset you.", "That must have been frustrating."],
        "neutral": [""]
    }
    empathy_line = random.choice(empathy.get(emotion, [""]))
    parts = [empathy_line, base_response, follow_up]
    return " ".join([p for p in parts if p]).strip()


def normalize_emotion(emotion):
    if not emotion:
        return "neutral"
    if isinstance(emotion, tuple):
        emotion = emotion[0]
    emotion = emotion.lower()
    mapping = {
        "happy": "happy", "joy": "happy", "excited": "happy", "good": "happy",
        "great": "happy", "content": "happy",
        "anger": "angry", "angry": "angry",
        "sadness": "sad", "intense sadness": "sad", "depressed": "sad", "low": "sad", "sad": "sad",
        "anxious": "stressed", "anxiety": "stressed", "stress": "stressed",
        "fear": "stressed", "stressed": "stressed",
    }
    return mapping.get(emotion, "neutral")


# ================================
# AI EMOTION DETECTION (GROQ)
# ================================

def get_groq_response(prompt):
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a strict JSON generator."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print("Groq error:", e)
        return None


def ai_detect_emotion(text):
    try:
        prompt = f"""
        You are an emotion detection AI for mental health journaling.

        Classify the PRIMARY emotion from:
        happy, sad, anxious, angry, neutral

        Be sensitive to indirect emotions.

        Examples:
        - "I feel empty" → sad
        - "I'm tired of everything" → sad
        - "I don't know what to do" → anxious
        - "Things are okay" → neutral

        Return ONLY JSON:
        {{
        "emotion": "...",
        "confidence": 0.0 to 1.0
        }}

        Text:
        {text}
        """

        response = get_groq_response(prompt)
        print("AI response for emotion detection:", response)

        json_match = re.search(r"\{.*\}", response, re.DOTALL)
        if not json_match:
            print("No JSON found in AI response")
            return None, None

        clean_json = json_match.group()
        data = json.loads(clean_json)
        return data["emotion"], data.get("confidence", 0.5)

    except Exception as e:
        print("AI detection failed:", e)
        return None, None