# System Architecture

The **TRUTH vs NOISE** platform is structured as a multi-tier, decoupled client-server architecture designed for deterministic credibility calculation, role separation, and voter privacy.

---

## High-Level Tier Architecture

```mermaid
graph TB
    subgraph PresentationTier["Presentation Tier (Client)"]
        SPA["React 19 Single-Page Application (Vite 8)"]
        Tailwind["Tailwind CSS Design System"]
        Router["React Router v7 (Protected Routes)"]
        AxiosClient["Axios Client (Bearer JWT Interceptors)"]
        SPA --- Tailwind
        SPA --- Router
        SPA --- AxiosClient
    end

    subgraph APITier["Application & API Tier (FastAPI / Uvicorn)"]
        Gateway["FastAPI Gateway (/api)"]
        
        subgraph AuthModule["Authentication & Security"]
            JWTService["JWT Token Service (PyJWT)"]
            PasswordHash["Password Hashing (bcrypt)"]
            RBAC["Role-Based Access Control (Dependencies)"]
        end
        
        subgraph ConductorModule["Conductor Domain"]
            EventMgmt["Event Lifecycle Controller"]
            QuestionnaireBuilder["MCQ Questionnaire Builder"]
        end

        subgraph CandidateModule["Candidate Domain"]
            EventCatalog["Event Discovery & Browsing"]
            SlotReservation["Atomic Slot Reservation (Row Lock)"]
            VotingPipeline["Assessment & Voting Transaction Pipeline"]
        end

        subgraph ResultsModule["Results & Analytics Engine"]
            CredibilityCalc["Server-Side Credibility Calculator"]
            DeterministicResults["Raw vs Weighted Results Engine"]
            ResultsPublisher["Atomic Results Publisher"]
        end
        
        Gateway --> AuthModule
        Gateway --> ConductorModule
        Gateway --> CandidateModule
        Gateway --> ResultsModule
    end

    subgraph DataTier["Data Persistence Tier (PostgreSQL)"]
        ORM["SQLAlchemy 2.0 ORM"]
        Driver["psycopg Database Driver"]
        DB[("PostgreSQL Database Engine")]
        
        subgraph CoreTables["Relational Schema"]
            T_Users["users"]
            T_Events["events"]
            T_Options["event_options"]
            T_Questions["credibility_questions"]
            T_Choices["credibility_choices"]
            T_Participants["event_participants"]
            T_Responses["assessment_responses"]
            T_Votes["votes"]
            T_Results["results"]
        end

        ORM --- Driver
        Driver --- DB
        DB --- CoreTables
    end

    AxiosClient -->|HTTPS REST JSON Requests| Gateway
    AuthModule --> ORM
    ConductorModule --> ORM
    CandidateModule --> ORM
    ResultsModule --> ORM
```

---

## Architectural Principles

1. **Client Decoupling**: The React frontend acts strictly as a presentation and interaction layer. It never computes credibility percentages, weighted sums, or winner decisions.
2. **Server-Side Scoring Secrecy**: Numerical score weights configured by conductors are stored exclusively in `credibility_choices.score` and are never serialized to candidate endpoints.
3. **Transactional Integrity**: When a candidate votes, the insertion of `assessment_responses` and the `votes` record occurs in a single atomic database transaction with the calculated `credibility_at_vote` snapshot.
4. **Concurrency Safety**: Participant slot reservations utilize PostgreSQL `SELECT FOR UPDATE` row-level locks on the target event to prevent race conditions from violating `max_voters`.
