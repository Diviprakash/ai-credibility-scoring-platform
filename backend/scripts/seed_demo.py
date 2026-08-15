"""
Truth vs Noise - Demonstration Dataset Seeder
Explicit execution only: python scripts/seed_demo.py
"""

import sys
import os
import uuid

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.event import Event, EventOption, CredibilityQuestion, CredibilityChoice, EventStatus, Result
from app.models.participant import EventParticipant, AssessmentResponse
from app.models.vote import Vote
from app.core.security import get_password_hash
from app.services.results_service import calculate_event_results

DEMO_TAG = "demo@truthvsnoise.edu"
DEMO_PASSWORD = "DemoPassword2026!"

def seed_demo_data(publish_results: bool = True):
    db = SessionLocal()
    try:
        print("=" * 80)
        print("SEEDING TRUTH VS NOISE DEMONSTRATION DATASET")
        print("=" * 80)

        # 1. Create Conductor
        conductor_email = f"conductor.{DEMO_TAG}"
        conductor = db.query(User).filter(User.email == conductor_email).first()
        if not conductor:
            conductor = User(
                email=conductor_email,
                hashed_password=get_password_hash(DEMO_PASSWORD),
                full_name="Prof. Sarah Jenkins (Conductor)",
                role=UserRole.CONDUCTOR,
            )
            db.add(conductor)
            db.flush()
            print(f"[OK] Created Conductor: {conductor.email}")
        else:
            print(f"[*] Conductor already exists: {conductor.email}")

        # 2. Create Event: "Should Our College Introduce a Four-Day Working Week?"
        event_title = "Should Our College Introduce a Four-Day Working Week?"
        event = db.query(Event).filter(Event.title == event_title, Event.conductor_id == conductor.id).first()
        if not event:
            event = Event(
                conductor_id=conductor.id,
                title=event_title,
                description="Institutional referendum regarding restructuring academic schedules to 4 extended working days per week.",
                status=EventStatus.OPEN,
                max_voters=25,
            )
            db.add(event)
            db.flush()

            # Create Options: YES, NO, NEUTRAL
            opt_yes = EventOption(event_id=event.id, option_text="YES")
            opt_no = EventOption(event_id=event.id, option_text="NO")
            opt_neutral = EventOption(event_id=event.id, option_text="NEUTRAL")
            db.add_all([opt_yes, opt_no, opt_neutral])
            db.flush()

            # Create Credibility Questions (2 MCQs)
            # Question 1: Institutional Policy Experience (Max: 10.0)
            q1 = CredibilityQuestion(
                event_id=event.id,
                question_text="What is your level of direct experience with academic curriculum and scheduling policy?",
                order_index=1,
            )
            db.add(q1)
            db.flush()

            c1_high = CredibilityChoice(question_id=q1.id, choice_text="Faculty / Department Curriculum Committee Member", score=10.0)
            c1_mid = CredibilityChoice(question_id=q1.id, choice_text="Student Council / Academic Representative", score=6.0)
            c1_low = CredibilityChoice(question_id=q1.id, choice_text="General Student / Unaffiliated Observer", score=2.0)
            db.add_all([c1_high, c1_mid, c1_low])

            # Question 2: Operational Knowledge (Max: 10.0)
            q2 = CredibilityQuestion(
                event_id=event.id,
                question_text="How familiar are you with statutory lab hour requirements and state accreditation standards?",
                order_index=2,
            )
            db.add(q2)
            db.flush()

            c2_high = CredibilityChoice(question_id=q2.id, choice_text="Thorough knowledge of accreditation guidelines and lab scheduling", score=10.0)
            c2_mid = CredibilityChoice(question_id=q2.id, choice_text="Basic familiarity with credit-hour calculations", score=5.0)
            c2_low = CredibilityChoice(question_id=q2.id, choice_text="No prior familiarity with accreditation rules", score=1.0)
            db.add_all([c2_high, c2_mid, c2_low])
            db.flush()

            print(f"[OK] Created Referendum: '{event.title}' with 3 options and 2 scored MCQs")
        else:
            print(f"[*] Event already exists: '{event.title}'")
            opt_yes = db.query(EventOption).filter(EventOption.event_id == event.id, EventOption.option_text == "YES").first()
            opt_no = db.query(EventOption).filter(EventOption.event_id == event.id, EventOption.option_text == "NO").first()
            opt_neutral = db.query(EventOption).filter(EventOption.event_id == event.id, EventOption.option_text == "NEUTRAL").first()

        # 3. Signature 10-Voter Scenario Setup
        # 4 YES voters: weights 95.0, 90.0, 85.0, 80.0 (Sum = 350.0)
        # 6 NO voters: weights 40.0, 35.0, 30.0, 25.0, 20.0, 15.0 (Sum = 165.0)
        voters_config = [
            # 4 YES Voters (High Domain Weight)
            {"num": 1, "name": "Dr. Arthur Pendelton", "option": opt_yes, "weight": 95.0},
            {"num": 2, "name": "Prof. Elena Rostova", "option": opt_yes, "weight": 90.0},
            {"num": 3, "name": "Dean Marcus Vance", "option": opt_yes, "weight": 85.0},
            {"num": 4, "name": "Dr. Claire Sterling", "option": opt_yes, "weight": 80.0},
            # 6 NO Voters (Lower Domain Weight)
            {"num": 5, "name": "Kevin Hayes", "option": opt_no, "weight": 40.0},
            {"num": 6, "name": "Samantha Reed", "option": opt_no, "weight": 35.0},
            {"num": 7, "name": "Brian Miller", "option": opt_no, "weight": 30.0},
            {"num": 8, "name": "Jessica Taylor", "option": opt_no, "weight": 25.0},
            {"num": 9, "name": "David Clark", "option": opt_no, "weight": 20.0},
            {"num": 10, "name": "Ashley Young", "option": opt_no, "weight": 15.0},
        ]

        # Ensure participants and votes exist
        for v in voters_config:
            cand_email = f"candidate{v['num']}.{DEMO_TAG}"
            candidate = db.query(User).filter(User.email == cand_email).first()
            if not candidate:
                candidate = User(
                    email=cand_email,
                    hashed_password=get_password_hash(DEMO_PASSWORD),
                    full_name=v["name"],
                    role=UserRole.CANDIDATE,
                )
                db.add(candidate)
                db.flush()

            # Participant link
            participant = db.query(EventParticipant).filter(
                EventParticipant.event_id == event.id,
                EventParticipant.candidate_id == candidate.id,
            ).first()
            if not participant:
                participant = EventParticipant(
                    event_id=event.id,
                    candidate_id=candidate.id,
                )
                db.add(participant)
                db.flush()

            # Vote link with snapshot weight
            vote = db.query(Vote).filter(
                Vote.event_id == event.id,
                Vote.candidate_id == candidate.id,
            ).first()
            if not vote:
                vote = Vote(
                    event_id=event.id,
                    candidate_id=candidate.id,
                    selected_option_id=v["option"].id,
                    credibility_at_vote=v["weight"],
                )
                db.add(vote)
                db.flush()

        db.commit()
        db.refresh(event)
        print("[OK] Created 10 Demo Candidates with Signature Weights (4 YES / 6 NO)")

        if publish_results:
            calc_results = calculate_event_results(
                event_id=event.id,
                event_title=event.title,
                status_val=EventStatus.RESULT_PUBLISHED.value,
                options=event.options,
                votes=event.votes,
            )

            winning_opt_id = None
            if calc_results.get("winning_option"):
                winning_opt_id = uuid.UUID(calc_results["winning_option"]["option_id"])

            result_record = db.query(Result).filter(Result.event_id == event.id).first()
            if not result_record:
                result_record = Result(
                    event_id=event.id,
                    raw_results=calc_results["raw_results"],
                    weighted_results=calc_results["weighted_results"],
                    winning_option_id=winning_opt_id,
                    total_voters=calc_results["total_votes"],
                    total_weight=calc_results["total_weight"],
                )
                db.add(result_record)
            else:
                result_record.raw_results = calc_results["raw_results"]
                result_record.weighted_results = calc_results["weighted_results"]
                result_record.winning_option_id = winning_opt_id
                result_record.total_voters = calc_results["total_votes"]
                result_record.total_weight = calc_results["total_weight"]

            event.status = EventStatus.RESULT_PUBLISHED
            db.commit()
            print("[OK] Published Final Results in RESULTS table")

        print("\n" + "=" * 80)
        print("DEMONSTRATION CREDENTIALS (FOR LOCAL PRESENTATION ONLY)")
        print("=" * 80)
        print(f"Password for all demo accounts: {DEMO_PASSWORD}\n")
        print(f"Conductor Account: {conductor_email}")
        print(f"Candidate 1 (YES, Weight 95%): candidate1.{DEMO_TAG}")
        print(f"Candidate 5 (NO,  Weight 40%): candidate5.{DEMO_TAG}")
        print(f"Event ID: {event.id}")
        print(f"Results URL: http://localhost:5173/events/{event.id}/results")
        print("=" * 80)

    except Exception as e:
        db.rollback()
        print(f"[ERROR] Error seeding demo dataset: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data(publish_results=True)
