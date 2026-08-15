# Viva / Academic Defense Questions & Answers

This document provides technical and theoretical answers to 21 common questions regarding the design, architecture, mathematics, and implementation of **TRUTH vs NOISE**.

---

### 1. What problem does Truth vs Noise solve?
In complex or domain-specific referendums (e.g., technical standards, academic curriculum reform, or environmental policy), simple majority voting is vulnerable to popularity bias, uninformed voting, and coordinated volume attacks. Truth vs Noise provides a dual-tally mechanism that decouples unweighted popular opinion from credibility-weighted consensus without disenfranchising any participant.

---

### 2. Why is simple majority voting insufficient for domain-specific referendums?
Simple majority voting assigns equal mathematical weight to every ballot regardless of whether the voter possesses domain context or answered randomly. In technical or high-stakes contexts, this allows large volumes of uninformed participants to overpower domain-informed analysis.

---

### 3. What is credibility-weighted voting?
Credibility-weighted voting evaluates each voter through an event-specific multiple-choice questionnaire. The voter's demonstrated performance is converted into a normalized credibility percentage ($0.0\%$ to $100.0\%$), which is applied as a mathematical multiplier to their single ballot.

---

### 4. How is credibility calculated?
For a questionnaire with questions $Q_1 \dots Q_n$:
1. $S_{\text{earned}} = \sum \text{score}(\text{selected choice for } Q_i)$
2. $S_{\max} = \sum \max_{c \in Q_i}(\text{score}(c))$
3. $\text{Credibility Score \%} = \operatorname{round}\left(\frac{S_{\text{earned}}}{S_{\max}} \times 100.0, 4\right)$ (or $100.0\%$ if $S_{\max} = 0$).

---

### 5. Why are scores calculated server-side?
To guarantee **Score Secrecy**. If choice scores or formulas were exposed to the frontend, voters could inspect the browser DOM or network payloads to reverse-engineer the highest-scoring choices. The candidate API transmits choices without score attributes.

---

### 6. Why store `credibility_at_vote`?
`credibility_at_vote` captures an immutable historical snapshot of the candidate's credibility percentage at the exact moment their ballot was committed. This ensures that any subsequent modifications to event questions or choices cannot alter historical votes.

---

### 7. How is double voting prevented?
Double voting is barred at two levels:
1. **Application Level**: The candidate voting controller verifies that no existing vote record exists for the `(event_id, candidate_id)` pair before processing.
2. **Database Level**: A PostgreSQL unique constraint `UNIQUE(event_id, candidate_id)` on the `votes` table guarantees database-level integrity even under concurrent attempts.

---

### 8. How is event capacity protected against race conditions?
Slot reservation uses PostgreSQL row-level locking:
```sql
SELECT * FROM events WHERE id = :event_id FOR UPDATE;
```
This serializes concurrent candidate join attempts, preventing race conditions from allowing enrollment to exceed `max_voters`.

---

### 9. Why use PostgreSQL?
PostgreSQL provides ACID transaction guarantees, robust row-level locking (`SELECT FOR UPDATE`), JSON data types for storing raw and weighted tally arrays, and enforceable foreign key constraints with cascading deletes.

---

### 10. Why use FastAPI?
FastAPI is a high-performance Python ASGI web framework offering native asynchronous request handling, automatic OpenAPI/Swagger documentation, and Pydantic v2 schema validation.

---

### 11. Why use React?
React provides a component-driven architecture for dynamic user interfaces, enabling reactive step transitions (Join -> Assessment -> Ballot -> Confirmation) and role-protected routing via React Router v7.

---

### 12. Why use SQLAlchemy?
SQLAlchemy 2.0 provides an enterprise-grade Object-Relational Mapper (ORM) with full Python type annotations, declarative schema definitions, relationship mappings, and explicit transaction management.

---

### 13. Why use JWT?
JSON Web Tokens (JWT) provide stateless, cryptographically signed authentication using `HMAC-SHA256`. The token encapsulates the user ID, role, and expiration, eliminating the need for server-side session state storage while securing API endpoints.

---

### 14. What happens when an event reaches `CLOSED`?
Voting is permanently halted; no new participants can join and no further votes are accepted. The conductor can preview calculated results, while candidate access to results remains blocked until the conductor explicitly publishes them.

---

### 15. Why can't candidates see results before publication?
To prevent early tally leaks from biasing voter participation, and to allow the conductor to verify data integrity before making the decision public.

---

### 16. How are results calculated?
The deterministic results engine ([backend/app/services/results_service.py](file:///d:/Projects/truth%20vs%20noise/backend/app/services/results_service.py)) iterates over all cast ballots to compute:
- **Raw Count**: Total votes cast for each option.
- **Raw Share %**: $(\text{Count} / \text{Total Votes}) \times 100.0$.
- **Weighted Sum**: Sum of `credibility_at_vote` for all ballots selecting the option.
- **Weighted Share %**: $(\text{Weighted Sum} / \text{Total Weight}) \times 100.0$.
- **Winning Option**: Option with the strictly highest `Weighted Sum`.

---

### 17. What is the difference between raw and weighted results?
- **Raw Result**: Represents pure popular democracy where 1 person = 1 vote of weight $1.0$.
- **Weighted Result**: Represents credibility-weighted consensus where 1 person = 1 vote weighted by their assessment score ($0.0$ to $100.0$).

---

### 18. Why can the raw winner differ from the weighted winner?
When a majority of voters choose option A with low individual credibility scores, but a smaller group of voters choose option B with high individual credibility scores, the total accumulated credibility weight for option B can exceed option A, causing a divergence.

---

### 19. Does the system determine "objective truth"?
**No.** The platform implements a *credibility-weighted decision mechanism* based on event-specific questionnaires. It does not claim to define metaphysical truth or establish infallible facts.

---

### 20. What are the current limitations?
- Credibility scores depend entirely on the conductor's questionnaire design.
- The platform does not verify external real-world credentials (e.g., degrees or professional licenses).
- The system operates within a single-organization relational database model.

---

### 21. What future AI features could be added?
- AI-assisted question generation to help conductors craft balanced questions.
- Misinformation analysis to identify common misconceptions in candidate response patterns.
- Automated anomaly detection to flag coordinated bot voting behavior.
