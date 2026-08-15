# Database Schema Specification

The **TRUTH vs NOISE** database utilizes **PostgreSQL** configured via **SQLAlchemy 2.0 ORM** and synchronized using **Alembic** migrations.

---

## 1. Schema Tables

### Table: `users`
Stores user identities, credentials, and access roles.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | Unique user identifier (UUIDv4) |
| `email` | `VARCHAR(255)` | `UNIQUE, NOT NULL` | Login email address |
| `hashed_password` | `VARCHAR(255)` | `NOT NULL` | bcrypt salted password hash |
| `full_name` | `VARCHAR(255)` | `NOT NULL` | Full display name |
| `role` | `VARCHAR(50)` | `NOT NULL` | Enum: `CONDUCTOR`, `CANDIDATE` |
| `created_at` | `TIMESTAMP` | `NOT NULL` | Record creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL` | Last update timestamp |

---

### Table: `events`
Stores referendum master configurations and lifecycle states.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | Unique event identifier (UUIDv4) |
| `conductor_id` | `UUID` | `FK -> users.id, NOT NULL` | Conductor owner |
| `title` | `VARCHAR(255)` | `NOT NULL` | Referendum title |
| `description` | `TEXT` | `NULLABLE` | Context and background |
| `status` | `VARCHAR(50)` | `NOT NULL` | Enum: `DRAFT`, `PUBLISHED`, `OPEN`, `CLOSED`, `RESULT_PUBLISHED` |
| `max_voters` | `INTEGER` | `NOT NULL` | Maximum participant capacity |
| `created_at` | `TIMESTAMP` | `NOT NULL` | Creation timestamp |
| `updated_at` | `TIMESTAMP` | `NOT NULL` | Last update timestamp |

---

### Table: `event_options`
Stores distinct voting ballot options for a referendum.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | Unique option identifier (UUIDv4) |
| `event_id` | `UUID` | `FK -> events.id ON DELETE CASCADE, NOT NULL` | Associated referendum |
| `option_text` | `VARCHAR(255)` | `NOT NULL` | Ballot choice text (e.g. "YES", "NO") |
| `created_at` | `TIMESTAMP` | `NOT NULL` | Creation timestamp |

---

### Table: `credibility_questions`
Stores multiple-choice credibility questions.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | Unique question identifier (UUIDv4) |
| `event_id` | `UUID` | `FK -> events.id ON DELETE CASCADE, NOT NULL` | Associated referendum |
| `question_text` | `TEXT` | `NOT NULL` | Assessment question prompt |
| `order_index` | `INTEGER` | `NOT NULL` | Sequential display order |
| `created_at` | `TIMESTAMP` | `NOT NULL` | Creation timestamp |

---

### Table: `credibility_choices`
Stores answer choices and conductor scoring weights.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | Unique choice identifier (UUIDv4) |
| `question_id` | `UUID` | `FK -> credibility_questions.id ON DELETE CASCADE, NOT NULL` | Parent question |
| `choice_text` | `TEXT` | `NOT NULL` | Answer text shown to voter |
| `score` | `FLOAT` | `NOT NULL` | Conductor weight score ($\ge 0$) |
| `created_at` | `TIMESTAMP` | `NOT NULL` | Creation timestamp |

---

### Table: `event_participants`
Tracks candidate enrollment and slot reservations.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | Unique participant record |
| `event_id` | `UUID` | `FK -> events.id ON DELETE CASCADE, NOT NULL` | Referendum |
| `candidate_id` | `UUID` | `FK -> users.id, NOT NULL` | Candidate |
| `joined_at` | `TIMESTAMP` | `NOT NULL` | Slot reservation timestamp |
| *(Index)* | `UNIQUE(event_id, candidate_id)` | Constraint | Single enrollment guarantee |

---

### Table: `assessment_responses`
Stores candidate answers to credibility questions.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | Response record identifier |
| `participant_id` | `UUID` | `FK -> event_participants.id ON DELETE CASCADE, NOT NULL` | Participant |
| `question_id` | `UUID` | `FK -> credibility_questions.id, NOT NULL` | Question answered |
| `choice_id` | `UUID` | `FK -> credibility_choices.id, NOT NULL` | Choice selected |
| `created_at` | `TIMESTAMP` | `NOT NULL` | Answer timestamp |

---

### Table: `votes`
Records cast ballots and permanent credibility weight snapshots.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | Vote identifier (UUIDv4) |
| `event_id` | `UUID` | `FK -> events.id ON DELETE CASCADE, NOT NULL` | Referendum |
| `candidate_id` | `UUID` | `FK -> users.id, NOT NULL` | Candidate |
| `selected_option_id` | `UUID` | `FK -> event_options.id, NOT NULL` | Cast ballot option |
| `credibility_at_vote` | `FLOAT` | `NOT NULL` | Server credibility snapshot |
| `created_at` | `TIMESTAMP` | `NOT NULL` | Timestamp of vote |
| *(Index)* | `UNIQUE(event_id, candidate_id)` | Constraint | Single vote guarantee |

---

### Table: `results`
Persists deterministic calculations once results are published.
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PRIMARY KEY` | Result record identifier |
| `event_id` | `UUID` | `FK -> events.id ON DELETE CASCADE, UNIQUE, NOT NULL` | Referendum |
| `winning_option_id` | `UUID` | `FK -> event_options.id, NULLABLE` | Winning option ID |
| `total_voters` | `INTEGER` | `NOT NULL` | Total cast ballots |
| `total_weight` | `FLOAT` | `NOT NULL` | Sum of credibility weights |
| `raw_results` | `JSON` | `NOT NULL` | Array of raw tally objects |
| `weighted_results` | `JSON` | `NOT NULL` | Array of weighted score objects |
| `decision_status` | `VARCHAR(50)` | `NOT NULL` | `DECIDED`, `TIE`, `NO_VOTES`, `NO_WEIGHT` |
| `calculated_at` | `TIMESTAMP` | `NOT NULL` | Calculation timestamp |
