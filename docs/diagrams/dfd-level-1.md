# Data Flow Diagram - Level 1 (Decomposition Diagram)

The Level 1 Data Flow Diagram breaks down the **TRUTH vs NOISE** application into its 7 core sub-processes, primary datastores, and inter-process data transformations.

---

## DFD Level 1 Diagram

```mermaid
graph TD
    Conductor["Conductor"]
    Candidate["Candidate"]

    subgraph Datastores["PostgreSQL Database"]
        DS_Users[("D1: users")]
        DS_Events[("D2: events, options, questions, choices")]
        DS_Participants[("D3: event_participants")]
        DS_Responses[("D4: assessment_responses")]
        DS_Votes[("D5: votes")]
        DS_Results[("D6: results")]
    end

    subgraph Processes["System Sub-Processes"]
        P1(("1.0<br/>Authentication &<br/>Authorization"))
        P2(("2.0<br/>Event & MCQ<br/>Management"))
        P3(("3.0<br/>Participant Slot<br/>Reservation"))
        P4(("4.0<br/>Credibility<br/>Evaluation"))
        P5(("5.0<br/>Atomic Ballot<br/>Commit"))
        P6(("6.0<br/>Results Calculation<br/>Engine"))
        P7(("7.0<br/>Results<br/>Publication"))
    end

    %% Auth Flow
    Conductor & Candidate -->|Credentials / Register Info| P1
    P1 <-->|User Records & Hashes| DS_Users
    P1 -->|Bearer JWT Token| Conductor & Candidate

    %% Event Management Flow
    Conductor -->|Event Details, Options, Scored Choices| P2
    P2 <-->|Event & Question Schema| DS_Events

    %% Participation Flow
    Candidate -->|Join Request| P3
    P3 <-->|Row Lock & Capacity Check| DS_Events
    P3 -->|Participant Record| DS_Participants

    %% Credibility Assessment & Voting Flow
    Candidate -->|Selected Choice IDs| P4
    P4 <-->|Retrieve Secret Choice Scores| DS_Events
    P4 -->|Calculated Credibility Score %| P5
    Candidate -->|Selected Ballot Option ID| P5
    P5 -->|Assessment Records| DS_Responses
    P5 -->|Vote Record with credibility_at_vote| DS_Votes
    P5 -->|Personal Credibility %| Candidate

    %% Results Engine Flow
    Conductor -->|Publish Trigger (from CLOSED)| P6
    P6 <-->|Fetch Options & Votes| DS_Events
    P6 <-->|Fetch All Ballots| DS_Votes
    P6 -->|Calculated Outcome Record| DS_Results
    P6 -->|Update Status to RESULT_PUBLISHED| DS_Events

    %% Results Publication Flow
    Candidate & Conductor -->|Query Results| P7
    P7 <-->|Verify RESULT_PUBLISHED| DS_Events
    P7 <-->|Read Aggregate Outcome| DS_Results
    P7 -->|Zero-PII Aggregate Results JSON| Candidate & Conductor
```

---

## Sub-Process Breakdown

1. **1.0 Authentication & Authorization**: Handles registration, bcrypt password verification, and JWT creation with embedded roles.
2. **2.0 Event & MCQ Management**: Creates referendums, manages options, scored questions, and controls lifecycle transitions.
3. **3.0 Participant Slot Reservation**: Validates candidate capacity using `SELECT ... FOR UPDATE` row locks.
4. **4.0 Credibility Evaluation**: Retrieves secret choice scores from datastore `D2` and calculates candidate credibility percentages.
5. **5.0 Atomic Ballot Commit**: Records assessment responses to `D4` and casts ballot to `D5` in a single ACID transaction.
6. **6.0 Results Calculation Engine**: Deterministically computes raw sums, weighted sums, shares, and winning options.
7. **7.0 Results Publication**: Exposes aggregate summary results without voter identities or private responses.
