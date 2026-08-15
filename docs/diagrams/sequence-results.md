# Result Publication Sequence Diagram

This sequence diagram illustrates the lifecycle transition from `CLOSED` to `RESULT_PUBLISHED`, the deterministic execution of the results calculation engine, and the secure retrieval of zero-PII aggregate results.

---

## Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor Conductor as Conductor (Host)
    participant UI as React Frontend
    participant Auth as Auth & RBAC
    participant Router as Conductor Router
    participant Service as Results Service
    participant DB as PostgreSQL Database
    actor Candidate as Candidate (Voter)

    Note over Conductor,DB: Event is currently in CLOSED status

    Conductor->>UI: Clicks "Publish Final Results" & Confirms
    UI->>Auth: PATCH /api/conductor/events/{id}/status (status: RESULT_PUBLISHED)
    Auth->>Router: Verified (Role: CONDUCTOR, Owner: true)
    
    Router->>DB: BEGIN TRANSACTION
    Router->>DB: Verify event.status == CLOSED
    Router->>Service: calculate_event_results(event_id, db)
    
    Service->>DB: SELECT * FROM event_options WHERE event_id = {id}
    Service->>DB: SELECT * FROM votes WHERE event_id = {id}
    
    Note over Service: Deterministic Calculations<br/>1. Raw vote tally & percentages per option<br/>2. Sum(credibility_at_vote) & weighted percentages<br/>3. Identify winning option / tie / edge cases
    
    Service->>DB: INSERT INTO results (event_id, winning_option_id, total_voters, total_weight, raw_results, weighted_results, decision_status)
    Router->>DB: UPDATE events SET status = 'RESULT_PUBLISHED' WHERE id = {id}
    Router->>DB: COMMIT TRANSACTION

    Router-->>UI: 200 OK (Event updated to RESULT_PUBLISHED)

    Note over Candidate,DB: Candidate Accesses Published Results

    Candidate->>UI: Navigates to /events/{id}/results
    UI->>Auth: GET /api/events/{id}/results (Bearer JWT)
    Auth->>DB: Verify event.status == RESULT_PUBLISHED
    DB-->>UI: Return 200 OK (Aggregate Data, Zero PII)
    UI-->>Candidate: Render Results Dashboard (Raw vs Weighted Comparison)
```

---

## Results Privacy & Data Hygiene

- **Aggregate Only**: The `results` payload contains strictly summary numbers: `total_votes`, `total_weight`, `raw_results` (option text, count, percentage), and `weighted_results` (option text, weighted sum, percentage).
- **Zero Identity Leakage**: No candidate user IDs, participant enrollment timestamps, individual assessment responses, or personal credibility scores are returned in public result endpoints.
