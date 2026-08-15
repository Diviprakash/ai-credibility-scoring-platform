"""
Truth vs Noise - Demonstration Dataset Cleanup
Explicit execution only: python scripts/reset_demo.py
Deletes ONLY records created for the demo dataset (*.demo@truthvsnoise.local).
"""

import sys
import os

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.models.user import User
from app.models.event import Event, Result
from app.models.participant import EventParticipant, AssessmentResponse
from app.models.vote import Vote

DEMO_TAG = "demo@truthvsnoise.edu"
DEMO_LEGACY_TAG = "demo@truthvsnoise.local"

def reset_demo_data():
    db = SessionLocal()
    try:
        print("=" * 80)
        print("CLEANING TRUTH VS NOISE DEMONSTRATION DATASET")
        print("=" * 80)

        # 1. Find all demo users
        demo_users = db.query(User).filter(
            (User.email.like(f"%{DEMO_TAG}")) | (User.email.like(f"%{DEMO_LEGACY_TAG}"))
        ).all()
        demo_user_ids = [u.id for u in demo_users]
        print(f"[*] Found {len(demo_user_ids)} demo user records.")

        if not demo_user_ids:
            print("[*] No demo dataset records found to remove.")
            return

        # 2. Find demo events hosted by demo conductor
        demo_events = db.query(Event).filter(Event.conductor_id.in_(demo_user_ids)).all()
        demo_event_ids = [e.id for e in demo_events]
        print(f"[*] Found {len(demo_event_ids)} demo event records.")

        if demo_event_ids:
            # Delete Results for demo events
            db.query(Result).filter(Result.event_id.in_(demo_event_ids)).delete(synchronize_session=False)

            # Delete Votes for demo events
            db.query(Vote).filter(Vote.event_id.in_(demo_event_ids)).delete(synchronize_session=False)

            # Delete Assessment Responses for demo events
            demo_participants = db.query(EventParticipant).filter(EventParticipant.event_id.in_(demo_event_ids)).all()
            demo_participant_ids = [p.id for p in demo_participants]
            if demo_participant_ids:
                db.query(AssessmentResponse).filter(AssessmentResponse.participant_id.in_(demo_participant_ids)).delete(synchronize_session=False)

            # Delete Event Participants
            db.query(EventParticipant).filter(EventParticipant.event_id.in_(demo_event_ids)).delete(synchronize_session=False)

            # Delete Events (cascades options, questions, choices)
            for ev in demo_events:
                db.delete(ev)

        # 3. Delete Demo Users
        for usr in demo_users:
            db.delete(usr)

        db.commit()
        print("[OK] Successfully removed all demo users, events, votes, and results.")
        print("=" * 80)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error during demo dataset cleanup: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    reset_demo_data()
