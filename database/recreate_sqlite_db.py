import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.app.database import engine, Base
from backend.app.models import *  # Import all models
import sqlite3

# Path to SQLite database
db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend', 'linkedin_content_saas.db')

print(f"Database path: {db_path}")

# Delete existing database file
if os.path.exists(db_path):
    os.remove(db_path)
    print("✓ Existing database deleted")
else:
    print("✓ No existing database found")

print("\nCreating fresh database with all tables...")
Base.metadata.create_all(bind=engine)
print("✓ All tables created successfully")

# Verify tables were created
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
conn.close()

print(f"\n✓ Created {len(tables)} tables:")
for table in tables:
    print(f"  - {table[0]}")

print("\n✓ Database recreation complete!")
