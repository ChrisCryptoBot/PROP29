"""
One-off script: delete all cameras from the database (e.g. to clear test/demo data).
Run from backend dir: python -m scripts.delete_all_cameras
"""
import os
import sys

# Ensure backend root is on path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import Camera

def main():
    os.environ.setdefault("DATABASE_URL", "sqlite:///./proper29.db")
    db = SessionLocal()
    try:
        count = db.query(Camera).count()
        db.query(Camera).delete()
        db.commit()
        print(f"Deleted {count} camera(s).")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
