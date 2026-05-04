import sqlite3
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB = os.path.join(BASE_DIR, "database.db")

conn = sqlite3.connect(DB)
cursor = conn.cursor()

questions = [

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
(16,"You work better with:","Clear structure","Freedom and flexibility","J","P")

]

cursor.executemany("""
INSERT OR REPLACE INTO personality_questions
(id, question, option_a, option_b, trait_a, trait_b)
VALUES (?, ?, ?, ?, ?, ?)
""", questions)

conn.commit()
conn.close()

print("Personality questions inserted successfully")
