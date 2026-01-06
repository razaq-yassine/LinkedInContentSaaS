"""
Database migration script to add verification_code column to user_tokens table.
Run this script to update your existing database.
"""
import sqlite3
import os
from datetime import datetime

def run_migration():
    db_path = "linkedin_content_saas.db"
    
    if not os.path.exists(db_path):
        print(f"Database file not found at {db_path}")
        print("The database will be created automatically when you start the application.")
        return
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if column already exists
        cursor.execute("PRAGMA table_info(user_tokens)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'verification_code' in columns:
            print("✓ verification_code column already exists. No migration needed.")
            conn.close()
            return
        
        print("Adding verification_code column to user_tokens table...")
        
        # Add the verification_code column
        cursor.execute("""
            ALTER TABLE user_tokens 
            ADD COLUMN verification_code VARCHAR(6)
        """)
        
        # Create index for verification_code
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS ix_user_tokens_verification_code 
            ON user_tokens (verification_code)
        """)
        
        conn.commit()
        print("✓ Migration completed successfully!")
        print("  - Added verification_code column")
        print("  - Created index on verification_code")
        
        conn.close()
        
    except Exception as e:
        print(f"✗ Migration failed: {str(e)}")
        if conn:
            conn.rollback()
            conn.close()
        raise

if __name__ == "__main__":
    print("=" * 60)
    print("Database Migration: Add Email Verification Code Support")
    print("=" * 60)
    run_migration()
    print("=" * 60)
