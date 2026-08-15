# Credibility Calculation Specification

The credibility score represents a voter's relative performance on an event-specific multiple-choice questionnaire. It is computed entirely server-side to guarantee score secrecy and deterministic mathematical reproducibility.

---

## Mathematical Formulation

Let an event $E$ possess a set of $n$ credibility questions:
$$\mathcal{Q} = \{ Q_1, Q_2, \dots, Q_n \}$$

Each question $Q_i$ has a non-empty set of $m_i$ choices with non-negative numerical scores assigned by the Conductor:
$$\mathcal{C}_i = \{ c_{i1}, c_{i2}, \dots, c_{im_i} \}, \quad \text{where } \text{score}(c_{ij}) \ge 0$$

### 1. Maximum Question Potential ($S_{\max}$)
For each question $Q_i$, the maximum possible score attainable is:
$$M_i = \max_{j=1 \dots m_i} \big( \text{score}(c_{ij}) \big)$$

The total maximum attainable score across the entire questionnaire is:
$$S_{\max} = \sum_{i=1}^{n} M_i$$

### 2. Earned Candidate Score ($S_{\text{earned}}$)
When a candidate selects choice $c_i^* \in \mathcal{C}_i$ for each question $Q_i$, their earned score is:
$$S_{\text{earned}} = \sum_{i=1}^{n} \text{score}(c_i^*)$$

### 3. Credibility Percentage Calculation
The normalized credibility score percentage is calculated as:
$$\text{Credibility Score \%} = \begin{cases} 
100.0000\% & \text{if } S_{\max} = 0 \\
\operatorname{round}\left( \frac{S_{\text{earned}}}{S_{\max}} \times 100.0, 4 \right) & \text{if } S_{\max} > 0 
\end{cases}$$

---

## Implementation Details

### Server-Side Secrecy
1. **Zero Client Exposure**: The candidate API response schema ([backend/app/schemas/candidate.py](file:///d:/Projects/truth%20vs%20noise/backend/app/schemas/candidate.py)) intentionally omits the `score` attribute from all choices.
2. **Payload Submission**: The voter sends only `{ question_id, selected_choice_id }` pairs to `POST /api/candidate/events/{id}/vote`.
3. **Database Integrity**: The backend queries `credibility_choices` directly to resolve each choice's score within the database transaction.

### Historical Snapshotting
Upon computing the credibility score percentage, it is written immediately and permanently to:
$$\text{votes.credibility\_at\_vote}$$

This immutable snapshot ensures:
- Future modifications or deletions of questions do not distort historical votes.
- The weight applied during results computation is fixed at the exact moment of ballot submission.
- Candidates can inspect their own recorded credibility score via `GET /api/candidate/events/{id}/my-vote`.
