# Event Lifecycle State Machine

The **TRUTH vs NOISE** referendum lifecycle is governed by a strict, one-way deterministic finite state machine.

---

## Lifecycle State Diagram

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Event Creation (Conductor)

    state DRAFT {
        [*] --> InDraft
        InDraft : Structure fully editable
        InDraft : Options & Scored MCQs configurable
        InDraft : Invisible to Candidates
    }

    DRAFT --> PUBLISHED : Conductor Action ("Publish Event")

    state PUBLISHED {
        [*] --> InPublished
        InPublished : Structure permanently locked
        InPublished : Invisible in Candidate Catalog
        InPublished : Ready for scheduled/immediate voting
    }

    PUBLISHED --> OPEN : Conductor Action ("Open Voting")

    state OPEN {
        [*] --> InOpen
        InOpen : Visible to Candidates
        InOpen : Slot Reservation Active
        InOpen : Assessment & Voting Enabled
    }

    OPEN --> CLOSED : Conductor Action ("Close Voting")

    state CLOSED {
        [*] --> InClosed
        InClosed : Voting permanently halted
        InClosed : Conductor Results Preview Allowed
        InClosed : Candidate Results Blocked (400)
    }

    CLOSED --> RESULT_PUBLISHED : Conductor Action ("Publish Final Results")

    state RESULT_PUBLISHED {
        [*] --> InResultPublished
        InResultPublished : Deterministic Results Engine Runs
        InResultPublished : Results Table Record Persisted
        InResultPublished : Aggregate Results Publicly Accessible
    }

    RESULT_PUBLISHED --> [*] : Terminal State
```

---

## State Transition Rules

| From State | To State | Trigger / Action | Side Effects & Invariants |
|---|---|---|---|
| *(None)* | `DRAFT` | `POST /api/conductor/events` | Event created; conductor assigned. |
| `DRAFT` | `PUBLISHED` | `PATCH .../status` (`PUBLISHED`) | Options and questions locked; no further modifications permitted. |
| `PUBLISHED` | `OPEN` | `PATCH .../status` (`OPEN`) | Event published to candidate catalog; voting opens. |
| `OPEN` | `CLOSED` | `PATCH .../status` (`CLOSED`) | Voting concluded; no new votes permitted. |
| `CLOSED` | `RESULT_PUBLISHED` | `PATCH .../status` (`RESULT_PUBLISHED`) | `calculate_event_results()` executes; results persisted to `results` table. |

### Invalid Transitions
All other transitions (e.g., `DRAFT -> OPEN`, `OPEN -> DRAFT`, `RESULT_PUBLISHED -> CLOSED`) are strictly rejected by the backend validation layer with `400 Bad Request`.
