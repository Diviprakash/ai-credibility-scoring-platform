# Candidate Voting Sequence Diagram

This diagram demonstrates the end-to-end execution of candidate assessment, server-side credibility calculation, and atomic vote casting.

---

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Candidate as Candidate (Voter)
    participant UI as React Frontend
    participant Auth as Auth & RBAC
    participant Router as Candidate API Router
    participant DB as PostgreSQL Database

    Candidate->>UI: Selects Referendum & clicks "Join Event"
    UI->>Auth: POST /api/candidate/events/{id}/join (Bearer JWT)
    Auth->>Router: Verified (Role: CANDIDATE)
    Router->>DB: BEGIN TRANSACTION
    Router->>DB: SELECT * FROM events WHERE id = {id} FOR UPDATE
    Router->>DB: Check (current_participants < max_voters) & status == OPEN
    Router->>DB: INSERT INTO event_participants (event_id, candidate_id)
    Router->>DB: COMMIT TRANSACTION
    Router-->>UI: 201 Created (Participant Slot Reserved)
    UI-->>Candidate: Render Credibility Questionnaire (Zero Scores Visible)

    Candidate->>UI: Selects MCQ choices & picks single Ballot Option (e.g. YES)
    Candidate->>UI: Clicks "CAST MY VOTE"
    UI->>Auth: POST /api/candidate/events/{id}/vote (selected_option_id, answers)
    Note over UI,Auth: Client payload contains ZERO scores or weights

    Auth->>Router: Verified (Role: CANDIDATE)
    Router->>DB: BEGIN TRANSACTION
    Router->>DB: Verify event status is OPEN
    Router->>DB: Verify candidate is enrolled in event_participants
    Router->>DB: Verify candidate has not voted (check votes table)
    Router->>DB: Query event credibility questions & choices

    Note over Router: Server-Side Credibility Calculation<br/>S_earned = Sum(selected_choice.score)<br/>S_max = Sum(max(choice.score) for each question)<br/>Score% = (S_earned / S_max) * 100.0

    loop For each answer
        Router->>DB: INSERT INTO assessment_responses (participant_id, question_id, choice_id)
    end

    Router->>DB: INSERT INTO votes (event_id, candidate_id, selected_option_id, credibility_at_vote)
    Router->>DB: COMMIT TRANSACTION

    Router-->>UI: 201 Created (selected_option_id, credibility_score)
    UI-->>Candidate: Render "Vote Recorded & Sealed" (Displays server credibility score %)
```

---

## Security & Integrity Points

1. **Client Score Ignorance**: The client payload consists exclusively of `selected_option_id` and a list of `{ question_id, selected_choice_id }`.
2. **Server-Side Scoring**: The calculation engine directly fetches `score` from the relational `credibility_choices` table on the server.
3. **Double-Voting Prevention**: Protected by both application validation and the database constraint `UNIQUE(event_id, candidate_id)` on the `votes` table.
4. **Immutable Snapshot**: The calculated percentage is stored permanently in `votes.credibility_at_vote`, insulating the ballot from any future MCQ edits.
