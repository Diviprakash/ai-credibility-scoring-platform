# TRUTH vs NOISE - Engineering & Academic Documentation

Welcome to the comprehensive technical documentation and academic design specifications for **TRUTH vs NOISE**.

---

## 📑 Architectural & Design Diagrams

- [System Architecture](./diagrams/system-architecture.md): Multi-tier client-server layout, module breakdown, and data storage design.
- [Use Case Diagram](./diagrams/use-case.md): Complete actor interactions for Conductors and Candidates.
- [Entity-Relationship (ER) Diagram](./diagrams/er-diagram.md): Relational database entities, foreign keys, and constraints.
- [Class Diagram](./diagrams/class-diagram.md): Backend SQLAlchemy 2.0 ORM class structures and relationships.
- [Candidate Voting Sequence Diagram](./diagrams/sequence-voting.md): End-to-end voting, score secrecy, and atomic commit flow.
- [Result Publication Sequence Diagram](./diagrams/sequence-results.md): Transition to `RESULT_PUBLISHED` and results engine execution.
- [Candidate Voting Activity Diagram](./diagrams/activity-voting.md): Process decision flow for event discovery, joining, and voting.
- [Event Lifecycle State Machine](./diagrams/event-lifecycle.md): State transitions from `DRAFT` through `RESULT_PUBLISHED`.
- [Data Flow Diagram (Level 0 - Context)](./diagrams/dfd-level-0.md): Context-level external data flows.
- [Data Flow Diagram (Level 1 - Decomposition)](./diagrams/dfd-level-1.md): Sub-processes, datastores, and inter-process transformations.

---

## 📐 Mathematical & Algorithmic Specifications

- [Credibility Calculation Specification](./credibility-calculation.md): Server-side formula, question weighting, and score secrecy.
- [Results Calculation Engine](./results-calculation.md): Deterministic evaluation of raw counts, weighted sums, and decision statuses.
- [Signature Demonstration Scenario](./demo-scenario.md): In-depth walkthrough of the verified 4 YES / 6 NO divergence scenario.

---

## 🔒 Security, Database & API Specifications

- [Security & Privacy Architecture](./security.md): bcrypt hashing, JWT, RBAC, row-locking, and zero-PII policies.
- [REST API Reference](./api.md): Endpoints, parameters, schemas, and status codes.
- [Database Schema Specification](./database.md): Tables, data types, constraints, and cascade behaviors.

---

## 🎓 Academic Defense & Demonstration Guides

- [Demonstration Checklist](./demo-checklist.md): Step-by-step preparation and live evaluation guide.
- [Viva Defense Questions & Answers](./viva-questions.md): 21 comprehensive answers for academic defense.
- [Presentation Script (5–7 Minutes)](./demo-script.md): Timed script for live system demonstrations.
- [Final Project QA Checklist](./final-checklist.md): 28-point technical and security verification checklist.

---

## 🧪 Testing, Limitations & Roadmap

- [Verification & Testing Report](./testing.md): Automated suites, static analysis (`oxlint`), Vite builds, and master integration test logs.
- [Project Limitations](./limitations.md): Epistemic boundaries and design assumptions.
- [Future Enhancements Roadmap](./future-enhancements.md): AI extensions, external SSO, and infrastructure scaling.
