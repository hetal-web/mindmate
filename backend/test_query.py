import sqlite3
import sys

def main():
    try:
        conn = sqlite3.connect('database.db')
        
        # Get all tables
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [r[0] for r in cursor.fetchall() if r[0] != 'sqlite_sequence']
        
        print("Database Tables Overview:")
        print("="*50)
        
        for table in tables:
            print(f"\n--- {table.upper()} ---")
            try:
                # Get row count
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                count = cursor.fetchone()[0]
                print(f"Total rows: {count}")
                
                # Fetch first 3 records and columns
                cursor.execute(f"SELECT * FROM {table} LIMIT 3")
                rows = cursor.fetchall()
                if rows:
                    columns = [description[0] for description in cursor.description]
                    print(f"Columns: {', '.join(columns)}")
                    for row in rows:
                        print(row)
                else:
                    print("(Empty)")
            except Exception as e:
                print(f"Error reading {table}: {e}")
                
    except Exception as e:
        print("Database connection error:", e)

if __name__ == '__main__':
    main()
