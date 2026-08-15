# Entity-Relationship (ER) Diagram

The ER diagram illustrates the relational data model implemented via SQLAlchemy 2.0 and persisted in PostgreSQL.

---

## Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ events : "hosts (conductor_id)"
    users ||--o{ event_participants : "joins as candidate"
    users ||--o{ votes : "casts ballot"

    events ||--o{ event_options : "has options"
    events ||--o{ credibility_questions : "has questions"
    events ||--o{ event_participants : "enrolls"
    events ||--o{ votes : "records"
    events ||--o| results : "produces final result"

    credibility_questions ||--o{ credibility_choices : "contains choices"
    credibility_questions ||--o{ assessment_responses : "targeted by"

    credibility_choices ||--o{ assessment_responses : "selected in"

    event_participants ||--o{ assessment_responses : "submits answers"

    event_options ||--o{ votes : "selected in"
    event_options ||--o{ results : "declared winner"

    users {
        uuid id PK
        varchar email UK
        varchar hashed_password
        varchar full_name
        enum role "CONDUCTOR | CANDIDATE"
        timestamp created_at
        timestamp updated_at
    }

    events {
        uuid id PK
        uuid conductor_id FK
        varchar title
        text description
        enum status "DRAFT | PUBLISHED | OPEN | CLOSED | RESULT_PUBLISHED"
        int max_voters
        timestamp created_at
        timestamp updated_at
    }

    event_options {
        uuid id PK
        uuid event_id FK
        varchar option_text
        timestamp created_at
    }

    credibility_questions {
        uuid id PK
        uuid event_id FK
        text question_text
        int order_index
        timestamp created_at
    }

    credibility_choices {
        uuid id PK
        uuid question_id FK
        text choice_text
        float score
        timestamp created_at
    }

    event_participants {
        uuid id PK
        uuid event_id FK
        uuid candidate_id FK
        timestamp joined_at
    }

    assessment_responses {
        uuid id PK
        uuid participant_id FK
        uuid question_id FK
        uuid choice_id FK
        timestamp created_at
    }

    votes {
        uuid id PK
        uuid event_id FK
        uuid candidate_id FK
        uuid selected_option_id FK
        float credibility_at_vote
        timestamp created_at
    }

    results {
        uuid id PK
        uuid event_id FK, UK
        uuid winning_option_id FK
        int total_voters
        float total_weight
        json raw_results
        json weighted_results
        varchar decision_status
        timestamp calculated_at
    }
```

---

## Key Constraints & Relationships

1. **Unique Participant Per Event**: `UNIQUE(event_id, candidate_id)` on `event_participants` ensures a candidate can only join an event once.
2. **Single Vote Constraint**: `UNIQUE(event_id, candidate_id)` on `votes` enforces that each candidate can cast at most one ballot per referendum.
3. **Single Result Constraint**: `UNIQUE(event_id)` on `results` ensures results publication is strictly idempotent.
4. **Historical Credibility Snapshot**: `votes.credibility_at_vote` permanently stores the voter's calculated weight percentage at the time of voting, decoupling it from any subsequent MCQ edits.
