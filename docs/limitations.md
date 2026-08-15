# Project Limitations

This document outlines the design boundaries, domain assumptions, and operational limitations of the **TRUTH vs NOISE** system.

---

## 1. Scope of Credibility Weighting

- **Questionnaire-Bound Credibility**: The system evaluates credibility strictly through the candidate's answers to the conductor-provided multiple-choice questionnaire.
- **No External Identity Verification**: The platform does not verify external credentials (e.g., academic degrees, professional licenses, publication indexes, or institutional affiliations).
- **Conductor Subjectivity**: The quality and objectivity of the outcome depend on the conductor designing balanced, well-calibrated questions and score weights.

---

## 2. Epistemic Boundary

- **Decision Mechanism vs. Objective Truth**: The platform provides a mechanism for weighting votes by subject familiarity; it does not claim to define or discover metaphysical or universal truth.
- **Good-Faith Assumptions**: Multiple-choice assessments assume voters attempt questions independently without external assistance during the voting session.

---

## 3. Technical & Architectural Boundaries

- **Single-Node Database Model**: The current release relies on PostgreSQL row locking (`SELECT FOR UPDATE`), optimized for academic and organizational referendums.
- **Purely Deterministic**: The core system executes deterministic mathematical formulas without heuristic, probabilistic, or generative AI layers in the calculation pipeline.
