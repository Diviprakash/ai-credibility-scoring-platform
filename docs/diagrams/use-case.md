# Use Case Diagram

The **TRUTH vs NOISE** system defines two primary actors with distinct capabilities and security perimeters: **CONDUCTOR** (Referendum Administrator) and **CANDIDATE** (Voter).

---

## Actor & Use Case Model

```mermaid
graph LR
    subgraph System["TRUTH vs NOISE Platform"]
        %% Shared Use Cases
        UC_Reg(["Register Account"])
        UC_Login(["Login & Obtain JWT"])
        UC_Me(["View Profile (/me)"])

        %% Conductor Use Cases
        UC_CreateEvent(["Create Referendum (DRAFT)"])
        UC_ConfigOptions(["Configure Ballot Options"])
        UC_ConfigMCQs(["Configure Scored MCQs"])
        UC_PublishEvent(["Publish Referendum (PUBLISHED)"])
        UC_OpenVoting(["Open Voting (OPEN)"])
        UC_CloseVoting(["Close Voting (CLOSED)"])
        UC_PreviewResults(["Preview Closed Results"])
        UC_PublishResults(["Publish Final Results (RESULT_PUBLISHED)"])
        UC_ViewConductorEvents(["List Managed Events"])

        %% Candidate Use Cases
        UC_BrowseEvents(["Browse OPEN Referendums"])
        UC_ViewEventDetail(["Inspect Referendum Details"])
        UC_JoinEvent(["Join Referendum (Reserve Slot)"])
        UC_AnswerMCQs(["Complete Credibility Assessment"])
        UC_SelectOption(["Select Single Ballot Option"])
        UC_CastVote(["Cast Vote (Atomic Commit)"])
        UC_ViewMyVote(["View Own Vote & Score"])
        UC_ViewPublishedResults(["View Published Results"])
    end

    %% Actors
    Conductor(("Conductor (Host)"))
    Candidate(("Candidate (Voter)"))

    %% Conductor Associations
    Conductor --> UC_Reg
    Conductor --> UC_Login
    Conductor --> UC_Me
    Conductor --> UC_CreateEvent
    Conductor --> UC_ConfigOptions
    Conductor --> UC_ConfigMCQs
    Conductor --> UC_PublishEvent
    Conductor --> UC_OpenVoting
    Conductor --> UC_CloseVoting
    Conductor --> UC_PreviewResults
    Conductor --> UC_PublishResults
    Conductor --> UC_ViewConductorEvents

    %% Candidate Associations
    Candidate --> UC_Reg
    Candidate --> UC_Login
    Candidate --> UC_Me
    Candidate --> UC_BrowseEvents
    Candidate --> UC_ViewEventDetail
    Candidate --> UC_JoinEvent
    Candidate --> UC_AnswerMCQs
    Candidate --> UC_SelectOption
    Candidate --> UC_CastVote
    Candidate --> UC_ViewMyVote
    Candidate --> UC_ViewPublishedResults
```

---

## Use Case Descriptions

### 1. Conductor Use Cases
- **Create Referendum**: Initializes an event in `DRAFT` status with a title, description, and maximum voter capacity.
- **Configure Ballot Options**: Adds a minimum of 2 distinct voting options (e.g. YES, NO, NEUTRAL).
- **Configure Credibility Questions**: Creates multiple-choice questions with choices and non-negative score weights.
- **Lifecycle Management**: Advances the event through `DRAFT -> PUBLISHED -> OPEN -> CLOSED -> RESULT_PUBLISHED`.
- **Publish Final Results**: Calculates and commits the deterministic raw and credibility-weighted outcomes to the `RESULTS` table.

### 2. Candidate Use Cases
- **Browse OPEN Referendums**: Discovers currently active voting events with real-time slot capacity.
- **Join Referendum**: Atomically reserves a participation slot prior to voting.
- **Complete Credibility Assessment**: Answers all questionnaire multiple-choice prompts (scores remain hidden).
- **Cast Vote**: Submits ballot selection and answers in a single transaction, immediately revealing the server-calculated credibility score percentage.
- **View Published Results**: Accesses aggregate community and weighted outcomes once the event reaches `RESULT_PUBLISHED`.
