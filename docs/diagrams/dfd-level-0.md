# Data Flow Diagram - Level 0 (Context Diagram)

The Level 0 Context Diagram establishes the boundary of the **TRUTH vs NOISE** system and its primary external entities: **Conductor**, **Candidate**, and the **PostgreSQL Relational Store**.

---

## DFD Level 0 Context Diagram

```mermaid
graph TD
    Conductor["Conductor (Referendum Host)"]
    Candidate["Candidate (Voter)"]
    System(("0.0<br/>TRUTH vs NOISE<br/>Core System"))
    DB[("PostgreSQL Database Store")]

    Conductor -->|1. Event Config & Scored MCQs| System
    Conductor -->|2. Lifecycle Commands| System
    System -->|3. Event Summaries & Result Previews| Conductor

    Candidate -->|4. Slot Reservation Request| System
    Candidate -->|5. Assessment Choices & Ballot Vote| System
    System -->|6. Open Catalog & Aggregate Results| Candidate

    System <-->|7. Relational CRUD, Row Locks & Results Persistence| DB
```

---

## Data Flows

1. **Event Config & Scored MCQs**: Referendum titles, capacities, options, and scored credibility questions sent by conductors.
2. **Lifecycle Commands**: Status updates (`DRAFT -> PUBLISHED -> OPEN -> CLOSED -> RESULT_PUBLISHED`).
3. **Event Summaries & Result Previews**: Managed event listings and closed result metrics returned to conductors.
4. **Slot Reservation Request**: Candidate join requests verified against max voter capacity.
5. **Assessment Choices & Ballot Vote**: Candidate MCQ choice selections and chosen ballot option.
6. **Open Catalog & Aggregate Results**: Public event listings and zero-PII final results.
7. **Relational Operations**: ACID transactions, row-level locks, and persisted calculations in PostgreSQL.
