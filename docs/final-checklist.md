# Final Project QA Checklist

This comprehensive quality assurance checklist verifies every technical, architectural, functional, and security requirement of the **TRUTH vs NOISE** application.

---

## 1. System Infrastructure & Setup
- [x] **Backend Service**: FastAPI server starts on `http://127.0.0.1:8000` without errors.
- [x] **Frontend SPA**: React + Vite application builds cleanly and serves on `http://localhost:5173`.
- [x] **Database Engine**: PostgreSQL database connects with all 6 core tables initialized via Alembic migrations.

## 2. Authentication & Role Boundaries
- [x] **Registration**: Validates email uniqueness, password minimum length (8 characters), and explicit role selection.
- [x] **Login & JWT**: Issues signed `HMAC-SHA256` Bearer tokens with embedded user role claims.
- [x] **Role Isolation**:
  - `CANDIDATE` accessing `/api/conductor/*` is blocked with `403 Forbidden`.
  - `CONDUCTOR` accessing `/api/candidate/*` is blocked with `403 Forbidden`.
- [x] **Unauthenticated Protection**: Protected routes return `401 Unauthorized` for missing/invalid tokens.

## 3. Conductor Workflow & Event Management
- [x] **Conductor Dashboard**: Displays real-time counts for Total Events, Drafts, Published, Open, Closed, and Results Published.
- [x] **Event Builder**: Enforces minimum 2 options and minimum 1 question with 2 choices.
- [x] **Score Assignment**: Allows conductor to assign non-negative numerical scores to choices.
- [x] **Lifecycle State Machine**: Enforces strict one-way progression:
  $$\text{DRAFT} \longrightarrow \text{PUBLISHED} \longrightarrow \text{OPEN} \longrightarrow \text{CLOSED} \longrightarrow \text{RESULT\_PUBLISHED}$$
- [x] **Ownership Guard**: Conductors cannot view or mutate events owned by other conductors.

## 4. Candidate Workflow & Score Secrecy
- [x] **Candidate Catalog**: Lists only active `OPEN` referendums with live slot capacity meters.
- [x] **Slot Reservation**: Reserves participation slots using PostgreSQL row locking (`SELECT FOR UPDATE`).
- [x] **Score Secrecy**: Candidate schemas and UI omit all choice scores and weight hints.
- [x] **Ballot Submission**: Commits assessment responses and single option selection in an atomic ACID transaction.
- [x] **Double-Vote Prevention**: Intercepted by application validation and database constraint `UNIQUE(event_id, candidate_id)`.
- [x] **Score Reveal**: Displays server-calculated credibility percentage immediately upon confirmed submission.

## 5. Results Engine & Presentation Dashboard
- [x] **Lifecycle Visibility**: Candidates are blocked from viewing results while event is `OPEN` or `CLOSED`.
- [x] **Deterministic Engine**: Calculates exact raw counts, raw shares, weighted sums, and weighted shares with 4-decimal precision.
- [x] **Divergence Highlighting**: Clearly contrasts raw popular winner against credibility-weighted winner.
- [x] **Zero-Vote Options**: Correctly handled with $0$ votes, $0.0000$ weight, and $0.0000\%$.
- [x] **Zero-PII Assurance**: Results payloads contain zero candidate identities, voter emails, or private responses.
- [x] **Idempotency**: Results table enforces `UNIQUE(event_id)` preventing duplicate calculation records.

## 6. Demonstration Tooling & Code Quality
- [x] **Demo Data Seeder**: `scripts/seed_demo.py` sets up the signature 4 YES / 6 NO dataset on explicit demand.
- [x] **Demo Data Cleanup**: `scripts/reset_demo.py` safely removes only demo records without broad table truncates.
- [x] **Frontend Static Analysis**: `npm run lint` passes with **0 warnings and 0 errors**.
- [x] **Production Bundle**: `npm run build` compiles production assets cleanly in `< 500ms`.
- [x] **Master Integration Suite**: `test_step14_full_integration.py` passes **100% across all 36 test cases**.
