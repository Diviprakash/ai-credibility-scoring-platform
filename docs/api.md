# REST API Reference

The **TRUTH vs NOISE** backend exposes a standardized RESTful API secured by Bearer JWT tokens.

---

## 1. Authentication Endpoints (`/api/auth`)

### 1.1 Register Account
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Auth**: None
- **Request Body**:
  ```json
  {
    "full_name": "Dr. Jordan Lee",
    "email": "jordan@university.edu",
    "password": "password123",
    "role": "CANDIDATE"
  }
  ```
- **Responses**:
  - `201 Created`: Returns created user profile.
  - `400 Bad Request`: Email already registered or invalid role.

### 1.2 User Login
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Auth**: None
- **Request Body**: `application/x-www-form-urlencoded` (`username`, `password`)
- **Responses**:
  - `200 OK`: `{ "access_token": "...", "token_type": "bearer", "user": { ... } }`
  - `401 Unauthorized`: Invalid email or password.

### 1.3 Get Current Profile
- **Method**: `GET`
- **Path**: `/api/auth/me`
- **Auth**: Bearer JWT
- **Responses**:
  - `200 OK`: Returns authenticated user profile.
  - `401 Unauthorized`: Missing or expired token.

---

## 2. Conductor Endpoints (`/api/conductor`)

### 2.1 List Managed Referendums
- **Method**: `GET`
- **Path**: `/api/conductor/events`
- **Auth**: Bearer JWT (`CONDUCTOR`)
- **Responses**:
  - `200 OK`: Array of conductor event summaries (`options_count`, `questions_count`, `max_voters`, `status`).

### 2.2 Create Referendum
- **Method**: `POST`
- **Path**: `/api/conductor/events`
- **Auth**: Bearer JWT (`CONDUCTOR`)
- **Request Body**:
  ```json
  {
    "title": "Campus Energy Referendum",
    "description": "Policy voting on renewable energy.",
    "max_voters": 100,
    "options": [{ "option_text": "YES" }, { "option_text": "NO" }],
    "questions": [
      {
        "question_text": "What is your energy domain background?",
        "order_index": 1,
        "choices": [
          { "choice_text": "Specialist", "score": 10.0 },
          { "choice_text": "General Public", "score": 2.0 }
        ]
      }
    ]
  }
  ```
- **Responses**:
  - `201 Created`: Complete event structure in `DRAFT` status.
  - `400 Bad Request`: Fewer than 2 options or fewer than 1 question with 2 choices.

### 2.3 Get Referendum Details
- **Method**: `GET`
- **Path**: `/api/conductor/events/{event_id}`
- **Auth**: Bearer JWT (`CONDUCTOR` Owner)
- **Responses**:
  - `200 OK`: Detailed event object including options and questions with **conductor scoring weights**.

### 2.4 Update Referendum Lifecycle Status
- **Method**: `PATCH`
- **Path**: `/api/conductor/events/{event_id}/status`
- **Auth**: Bearer JWT (`CONDUCTOR` Owner)
- **Request Body**: `{ "status": "PUBLISHED" | "OPEN" | "CLOSED" | "RESULT_PUBLISHED" }`
- **Responses**:
  - `200 OK`: Updated event object.
  - `400 Bad Request`: Invalid lifecycle transition.

---

## 3. Candidate Endpoints (`/api/candidate`)

### 3.1 Browse Open Referendums
- **Method**: `GET`
- **Path**: `/api/candidate/events`
- **Auth**: Bearer JWT (`CANDIDATE`)
- **Responses**:
  - `200 OK`: Array of `OPEN` referendums with `current_participants` and `remaining_slots`.

### 3.2 Get Referendum for Voting
- **Method**: `GET`
- **Path**: `/api/candidate/events/{event_id}`
- **Auth**: Bearer JWT (`CANDIDATE`)
- **Responses**:
  - `200 OK`: Event details with options and questions (**zero score fields exposed**).

### 3.3 Join Referendum (Slot Reservation)
- **Method**: `POST`
- **Path**: `/api/candidate/events/{event_id}/join`
- **Auth**: Bearer JWT (`CANDIDATE`)
- **Responses**:
  - `201 Created`: `{ "joined": true, "joined_at": "..." }`
  - `400 Bad Request`: Event full or already joined.

### 3.4 Cast Vote & Submit Assessment
- **Method**: `POST`
- **Path**: `/api/candidate/events/{event_id}/vote`
- **Auth**: Bearer JWT (`CANDIDATE`)
- **Request Body**:
  ```json
  {
    "selected_option_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "answers": [
      {
        "question_id": "7fa85f64-5717-4562-b3fc-2c963f66afa6",
        "selected_choice_id": "8fa85f64-5717-4562-b3fc-2c963f66afa6"
      }
    ]
  }
  ```
- **Responses**:
  - `201 Created`: `{ "selected_option_id": "...", "credibility_score": 85.0 }`
  - `400 Bad Request`: Incomplete answers, double-voting attempt, or not joined.

### 3.5 Check My Vote Status
- **Method**: `GET`
- **Path**: `/api/candidate/events/{event_id}/my-vote`
- **Auth**: Bearer JWT (`CANDIDATE`)
- **Responses**:
  - `200 OK`: `{ "has_voted": true, "vote": { "credibility_score": 85.0, ... } }`

---

## 4. Results Endpoints (`/api/events`)

### 4.1 Get Final Results
- **Method**: `GET`
- **Path**: `/api/events/{event_id}/results`
- **Auth**: Bearer JWT
- **Responses**:
  - `200 OK`: Full deterministic outcome summary (`total_votes`, `total_weight`, `raw_results`, `weighted_results`, `winning_option`, `raw_winner`, `decision_status`).
  - `400 Bad Request`: Event results not published yet.
