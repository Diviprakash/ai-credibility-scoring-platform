# Candidate Voting Activity Diagram

The Activity Diagram models the step-by-step workflow of a candidate participating in an active voting event on the **TRUTH vs NOISE** platform.

---

## Activity Diagram

```mermaid
flowchart TD
    Start([Start]) --> Login[Candidate Authenticates & Obtains JWT]
    Login --> Browse[Browse Active OPEN Referendums]
    Browse --> SelectEvent[Select Target Referendum]
    
    SelectEvent --> CheckJoined{Participant Slot Reserved?}
    CheckJoined -- No --> JoinPrompt[Prompt: Join Event]
    JoinPrompt --> JoinAction{Candidate Joins?}
    JoinAction -- No --> End([End Workflow])
    JoinAction -- Yes --> ReserveSlot[Atomically Reserve Slot: SELECT FOR UPDATE]
    ReserveSlot --> CheckCap{Capacity Available?}
    CheckCap -- No --> CapError[Show 'Event Full' Notice] --> End
    CheckCap -- Yes --> Enrolled[Enrolled in Event Participants]
    
    CheckJoined -- Yes --> Enrolled
    Enrolled --> RenderQuiz[Render Credibility MCQ Questionnaire]
    
    RenderQuiz --> AnswerMCQs[Candidate Answers All Scored MCQs]
    AnswerMCQs --> PickOption[Select Single Voting Ballot Option]
    PickOption --> SubmitVote[Click 'CAST MY VOTE']
    
    SubmitVote --> ValidationCheck{Client & Server Validation}
    ValidationCheck -- Missing Answers or Option --> FormError[Render Validation Error Alert] --> RenderQuiz
    ValidationCheck -- Already Voted --> DupError[Reject: Double Voting Forbidden 400] --> End
    
    ValidationCheck -- Valid --> CalcCred[Server-Side: Retrieve Choice Scores & Compute Credibility %]
    CalcCred --> CommitTx[ACID Transaction: Insert Responses & Vote with credibility_at_vote]
    CommitTx --> Confirmed[Render 'Vote Recorded' Screen & Reveal Personal Credibility Score %]
    Confirmed --> End
```

---

## Key Decision Points

1. **Slot Capacity Check**: Prior to entering the voting phase, the server verifies available voter slots under row-level locking (`SELECT FOR UPDATE`).
2. **Completeness Validation**: The server rejects any ballot submission where one or more assessment questions lack a valid selected choice.
3. **Single Vote Enforcement**: Once a vote is committed to the `votes` table, subsequent submission attempts are intercepted with `400 Bad Request`.
