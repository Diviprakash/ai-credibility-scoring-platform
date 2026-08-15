# Demonstration Checklist

This checklist guides the presenter through the live demonstration of **TRUTH vs NOISE** during a defense or evaluation.

---

## Pre-Demonstration Setup

- [ ] **A. PostgreSQL Database**: Ensure the PostgreSQL service is active and accessible.
  ```sql
  -- Verify connection
  SELECT 1;
  ```
- [ ] **B. Backend Server**: Start the FastAPI backend server on `http://127.0.0.1:8000`.
  ```bash
  cd backend
  venv\Scripts\activate
  uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
  ```
- [ ] **C. Frontend SPA**: Start the Vite development server on `http://localhost:5173`.
  ```bash
  cd frontend
  npm run dev
  ```
- [ ] **D. Clean or Seed Initial State**:
  - To seed the full signature demonstration directly:
    ```bash
    cd backend
    venv\Scripts\python scripts/seed_demo.py
    ```
  - To clean demonstration data after testing:
    ```bash
    cd backend
    venv\Scripts\python scripts/reset_demo.py
    ```

---

## Live Demonstration Flow

### 1. Conductor Walkthrough
- [ ] **E. Conductor Authentication**:
  - Sign in as Conductor (`conductor.demo@truthvsnoise.local` / `DemoPassword2026!`).
  - Demonstrate role badge (`CONDUCTOR`) and Dashboard overview cards.
- [ ] **F. Referendum Inspection & State Machine**:
  - Navigate to *"Should Our College Introduce a Four-Day Working Week?"*.
  - Show the 4 configured sections: Event Information, Options (`YES`, `NO`, `NEUTRAL`), Credibility Assessment with **Conductor Scoring Weights** (Scores: 10.0, 6.0, 2.0 / 10.0, 5.0, 1.0), and Review Summary.
  - Explain the strict lifecycle progression: `DRAFT -> PUBLISHED -> OPEN -> CLOSED -> RESULT_PUBLISHED`.

### 2. Candidate Voting & Score Secrecy Walkthrough
- [ ] **G. Candidate Authentication**:
  - Sign in as Candidate (`candidate1.demo@truthvsnoise.local` / `DemoPassword2026!`).
  - Demonstrate candidate role badge (`CANDIDATE`) and Browse Events catalog.
- [ ] **H. Candidate Referendum Interface**:
  - Open the referendum page.
  - **Verify Score Secrecy**: Highlight that candidate sees only question and choice text; **zero numerical scores or weight hints are displayed**.
- [ ] **I. Slot Reservation & Voting Submission**:
  - Explain the 4-step workflow: Step 1 (Join) -> Step 2 (Assessment) -> Step 3 (Cast Vote) -> Step 4 (Confirmation).
  - Select high-domain responses and choose `YES`.
  - Click **CAST MY VOTE**.
  - Show the immediate post-vote reveal screen: *"Your Credibility Score: 95.0000%"*.

### 3. Lifecycle Closure & Results Demonstration
- [ ] **J. Conductor Closure & Results Publication**:
  - Sign back in as Conductor.
  - Advance status from `OPEN` to `CLOSED`.
  - Demonstrate that candidates cannot see results while in `CLOSED`.
  - Click **Publish Final Results** (transitions to `RESULT_PUBLISHED`).
- [ ] **K. Results Dashboard Showcase**:
  - Open Results Dashboard: `http://localhost:5173/events/<event_id>/results`.
  - **Highlight Core Divergence**:
    - **Raw Community Majority**: `NO` (60.0000% popular vote share).
    - **Credibility-Weighted Consensus**: `YES` (67.9612% credibility weight share).
    - **Final Decision**: `YES`.
  - Walk through the side-by-side comparison table, dual progress meters, and zero-PII guarantee.

---

## Post-Demonstration Cleanup

- [ ] **L. Reset Demo Data**:
  ```bash
  cd backend
  venv\Scripts\python scripts/reset_demo.py
  ```
