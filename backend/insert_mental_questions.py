import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE_DIR, "database.db")

conn = sqlite3.connect(DB)
cursor = conn.cursor()

questions = [

(1,"I feel sad or down frequently"),
(2,"I have trouble sleeping"),
(3,"I feel anxious or nervous"),
(4,"I have low energy"),
(5,"I feel hopeless"),
(6,"I have difficulty concentrating"),
(7,"I feel overwhelmed"),
(8,"I feel lonely"),
(9,"I feel worthless"),
(10,"I lack motivation")

]

cursor.executemany("""
INSERT OR REPLACE INTO mental_health_questions
(id, question)
VALUES (?,?)
""", questions)

conn.commit()
conn.close()

print("Mental health questions inserted")