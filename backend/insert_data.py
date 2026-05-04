import sqlite3

conn = sqlite3.connect("database.db")
cursor = conn.cursor()

# Dictionary words
dictionary_data = [

    # Sadness
    ("sad", "sadness", "en"),
    ("cry", "sadness", "en"),
    ("crying", "sadness", "en"),
    ("heartbroken", "sadness", "en"),
    ("breakup", "sadness", "en"),
    ("lonely", "sadness", "en"),
    ("hurt", "sadness", "en"),
    ("pain", "sadness", "en"),

    # Happiness
    ("happy", "happiness", "en"),
    ("joy", "happiness", "en"),
    ("excited", "happiness", "en"),
    ("good", "happiness", "en"),
    ("great", "happiness", "en"),
    ("love", "happiness", "en"),

    # Anxiety
    ("anxious", "anxiety", "en"),
    ("nervous", "anxiety", "en"),
    ("worried", "anxiety", "en"),
    ("fear", "anxiety", "en"),
    ("scared", "anxiety", "en"),

    # Neutral
    ("okay", "neutral", "en"),
    ("fine", "neutral", "en")

]

cursor.executemany("""
INSERT INTO chat_dictionary (word, emotion, language)
VALUES (?, ?, ?)
""", dictionary_data)


# Chatbot responses
responses_data = [

    ("sadness", "en", "I'm really sorry you're feeling this way. I'm here to listen."),
    ("sadness", "en", "That sounds very painful. You are not alone."),
    ("sadness", "en", "It's okay to feel sad. Your feelings are valid."),
    ("sadness", "en", "I understand this must be difficult for you."),

    ("happiness", "en", "That's wonderful to hear. I'm glad you're feeling happy."),
    ("happiness", "en", "Your happiness is important. Keep smiling."),
    ("happiness", "en", "That sounds positive. I'm happy for you."),

    ("anxiety", "en", "Take a deep breath. Everything will be okay."),
    ("anxiety", "en", "It's okay to feel anxious sometimes. Try to relax."),
    ("anxiety", "en", "I'm here with you. You can share what's worrying you."),

    ("neutral", "en", "I understand. Tell me more."),
    ("neutral", "en", "I'm listening. Please continue."),

    ("stress", "en", "Feeling stressed can be really exhausting."),
("stress", "en", "It sounds like you're dealing with a lot right now."),
("stress", "en", "Stress can build up when too many things are happening at once."),
("stress", "en", "That kind of pressure can feel overwhelming."),
("stress", "en", "It makes sense that you’re feeling stressed."),
("stress", "en", "Sometimes stress can slowly build up over time."),
("stress", "en", "That sounds like a lot to handle."),
("stress", "en", "Feeling overwhelmed like that can be really difficult."),
("stress", "en", "It seems like things have been heavy for you lately."),
("stress", "en", "When stress piles up it can feel draining."),
("stress", "en", "It sounds like something has been weighing on your mind."),
("stress", "en", "Pressure like that can be tough to deal with."),
("stress", "en", "Stress can affect both the mind and body."),
("stress", "en", "Sometimes stress can make everything feel harder."),
("stress", "en", "It’s understandable to feel stressed in situations like that.")

]

cursor.executemany("""
INSERT INTO chatbot_responses (emotion, language, response)
VALUES (?, ?, ?)
""", responses_data)

conn.commit()
conn.close()

print("Dictionary and responses inserted successfully")
