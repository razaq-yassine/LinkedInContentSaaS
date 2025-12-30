import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.app.database import engine, Base
from sqlalchemy import text

print("Dropping existing database...")
with engine.connect() as conn:
    conn.execute(text("DROP DATABASE IF EXISTS linkedin_content_saas"))
    conn.commit()
    print("✓ Database dropped")

print("Creating fresh database...")
with engine.connect() as conn:
    conn.execute(text("CREATE DATABASE linkedin_content_saas"))
    conn.commit()
    print("✓ Database created")

print("Creating all tables...")
Base.metadata.create_all(bind=engine)
print("✓ All tables created successfully")

print("\nDatabase recreation complete!")
