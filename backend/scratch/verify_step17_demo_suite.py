"""
Truth vs Noise - Step 17 Demo Tooling & Idempotency Verification Suite
"""

import sys
import os

sys.path.insert(0, r"d:\Projects\truth vs noise\backend")

from starlette.testclient import TestClient
from app.main import app
from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.models.event import Event, EventOption, CredibilityQuestion, CredibilityChoice, Result
from app.models.participant import EventParticipant, AssessmentResponse
from app.models.vote import Vote

from scripts.seed_demo import seed_demo_data, DEMO_TAG, DEMO_PASSWORD
from scripts.reset_demo import reset_demo_data

client = TestClient(app)

def run_step17_verification():
    print("=" * 90)
    print("STEP 17: DEMO DATASET & IDEMPOTENCY VERIFICATION SUITE")
    print("=" * 90)

    # Pre-clean
    reset_demo_data()

    # TEST 1: Initial Seed Execution
    print("\n[CHECKPOINT 1: Initial Seed Execution]")
    seed_demo_data(publish_results=True)

    db = SessionLocal()
    try:
        demo_users = db.query(User).filter(User.email.like(f"%{DEMO_TAG}")).all()
        demo_conductors = [u for u in demo_users if u.role == UserRole.CONDUCTOR]
        demo_candidates = [u for u in demo_users if u.role == UserRole.CANDIDATE]
        demo_events = db.query(Event).filter(Event.conductor_id.in_([u.id for u in demo_conductors])).all()

        assert len(demo_conductors) == 1, f"Expected 1 conductor, got {len(demo_conductors)}"
        assert len(demo_candidates) == 10, f"Expected 10 candidates, got {len(demo_candidates)}"
        assert len(demo_events) == 1, f"Expected 1 event, got {len(demo_events)}"

        event = demo_events[0]
        options = db.query(EventOption).filter(EventOption.event_id == event.id).all()
        questions = db.query(CredibilityQuestion).filter(CredibilityQuestion.event_id == event.id).all()
        votes = db.query(Vote).filter(Vote.event_id == event.id).all()

        assert len(options) == 3, f"Expected 3 options, got {len(options)}"
        assert len(questions) == 2, f"Expected 2 questions, got {len(questions)}"
        assert len(votes) == 10, f"Expected 10 votes, got {len(votes)}"
        print(f"-> PASSED: Created exactly 1 Conductor, 10 Candidates, 1 Event, 3 Options, 2 Questions, 10 Votes.")

        # TEST 2: Second Seed Execution (Idempotency)
        print("\n[CHECKPOINT 2: Second Seed Execution (Idempotency)]")
        seed_demo_data(publish_results=True)

        users_count_2 = db.query(User).filter(User.email.like(f"%{DEMO_TAG}")).count()
        events_count_2 = db.query(Event).filter(Event.conductor_id.in_([u.id for u in demo_conductors])).count()
        votes_count_2 = db.query(Vote).filter(Vote.event_id == event.id).count()

        assert users_count_2 == 11, f"Expected 11 demo users on re-run, got {users_count_2}"
        assert events_count_2 == 1, f"Expected 1 demo event on re-run, got {events_count_2}"
        assert votes_count_2 == 10, f"Expected 10 demo votes on re-run, got {votes_count_2}"
        print(f"-> PASSED: Seed script is 100% idempotent. No duplicate records created.")

        # TEST 3: Conductor Authentication
        print("\n[CHECKPOINT 3: Conductor Authentication via API]")
        cond_login = client.post(
            "/api/auth/login",
            json={"email": f"conductor.{DEMO_TAG}", "password": DEMO_PASSWORD},
        )
        assert cond_login.status_code == 200, f"Conductor login failed: {cond_login.text}"
        cond_token = cond_login.json()["access_token"]
        cond_headers = {"Authorization": f"Bearer {cond_token}"}
        me_resp = client.get("/api/auth/me", headers=cond_headers)
        assert me_resp.status_code == 200
        assert me_resp.json()["role"] == "CONDUCTOR"
        print(f"-> PASSED: Conductor successfully authenticated and verified role.")

        # TEST 4: Candidate Authentication
        print("\n[CHECKPOINT 4: Candidate Authentication via API]")
        for i in [1, 5, 10]:
            cand_login = client.post(
                "/api/auth/login",
                json={"email": f"candidate{i}.{DEMO_TAG}", "password": DEMO_PASSWORD},
            )
            assert cand_login.status_code == 200, f"Candidate {i} login failed: {cand_login.text}"
            cand_token = cand_login.json()["access_token"]
            cand_headers = {"Authorization": f"Bearer {cand_token}"}
            cand_me = client.get("/api/auth/me", headers=cand_headers)
            assert cand_me.status_code == 200
            assert cand_me.json()["role"] == "CANDIDATE"
        print(f"-> PASSED: Demo candidates (1, 5, 10) authenticated successfully.")

        # TEST 5: Results Calculation Verification
        print("\n[CHECKPOINT 5: Published Results & Signature Mathematical Outcome]")
        results_resp = client.get(f"/api/events/{event.id}/results", headers=cond_headers)
        assert results_resp.status_code == 200, f"Results query failed: {results_resp.text}"
        res = results_resp.json()

        assert res["total_votes"] == 10, f"Expected 10 total votes, got {res['total_votes']}"
        assert abs(res["total_weight"] - 515.0) < 1e-4, f"Expected 515.0 total weight, got {res['total_weight']}"

        raw_map = {r["option_text"]: r for r in res["raw_results"]}
        weighted_map = {w["option_text"]: w for w in res["weighted_results"]}

        # Raw percentages: YES = 40.0000%, NO = 60.0000%, NEUTRAL = 0.0000%
        assert raw_map["YES"]["count"] == 4 and abs(raw_map["YES"]["percentage"] - 40.0000) < 1e-4
        assert raw_map["NO"]["count"] == 6 and abs(raw_map["NO"]["percentage"] - 60.0000) < 1e-4
        assert raw_map["NEUTRAL"]["count"] == 0 and abs(raw_map["NEUTRAL"]["percentage"] - 0.0000) < 1e-4

        # Weighted percentages: YES = 67.9612%, NO = 32.0388%, NEUTRAL = 0.0000%
        assert abs(weighted_map["YES"]["weighted_sum"] - 350.0000) < 1e-4
        assert abs(weighted_map["YES"]["percentage"] - 67.9612) < 1e-4

        assert abs(weighted_map["NO"]["weighted_sum"] - 165.0000) < 1e-4
        assert abs(weighted_map["NO"]["percentage"] - 32.0388) < 1e-4

        assert abs(weighted_map["NEUTRAL"]["weighted_sum"] - 0.0000) < 1e-4
        assert abs(weighted_map["NEUTRAL"]["percentage"] - 0.0000) < 1e-4

        # Winners
        assert res["raw_winner"]["option_text"] == "NO"
        assert res["winning_option"]["option_text"] == "YES"
        assert res["decision_status"] == "DECIDED"

        print(f"  Raw YES:      {raw_map['YES']['count']} votes ({raw_map['YES']['percentage']}%)")
        print(f"  Raw NO:       {raw_map['NO']['count']} votes ({raw_map['NO']['percentage']}%)")
        print(f"  Weighted YES: {weighted_map['YES']['weighted_sum']} score ({weighted_map['YES']['percentage']}%)")
        print(f"  Weighted NO:  {weighted_map['NO']['weighted_sum']} score ({weighted_map['NO']['percentage']}%)")
        print(f"  Raw Winner:   {res['raw_winner']['option_text']}")
        print(f"  Final Winner: {res['winning_option']['option_text']}")
        print(f"-> PASSED: Demonstration mathematics verified with 100% precision.")

        # TEST 6: Demo Reset Execution
        print("\n[CHECKPOINT 6: Demo Reset Execution & Scoped Deletion]")
        reset_demo_data()

        post_users = db.query(User).filter(User.email.like(f"%{DEMO_TAG}")).count()
        post_events = db.query(Event).filter(Event.title == "Should Our College Introduce a Four-Day Working Week?").count()
        assert post_users == 0, f"Expected 0 demo users, found {post_users}"
        assert post_events == 0, f"Expected 0 demo events, found {post_events}"
        print(f"-> PASSED: reset_demo.py removed all demo records cleanly.")

        # TEST 7: Demo Reset Second Execution (Idempotency)
        print("\n[CHECKPOINT 7: Second Reset Execution (Idempotency)]")
        reset_demo_data()
        print(f"-> PASSED: reset_demo.py is safe and idempotent.")

    finally:
        db.close()

    print("\n" + "=" * 90)
    print("ALL STEP 17 DEMO TOOLING & IDEMPOTENCY VERIFICATIONS PASSED PERFECTLY!")
    print("=" * 90)

if __name__ == "__main__":
    run_step17_verification()
