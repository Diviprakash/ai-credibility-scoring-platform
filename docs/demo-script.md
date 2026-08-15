# Presentation & Demonstration Script (5–7 Minutes)

This script provides a timed, natural presentation flow for showcasing the **TRUTH vs NOISE** project to academic evaluators.

---

### [0:00 – 0:45] 1. The Problem Statement
> *"Good morning, evaluators. In high-stakes, domain-specific decisions—such as campus curriculum reform, environmental regulations, or technical standards—traditional majority voting presents a critical vulnerability. When pure vote volume decides the outcome, a large group of uninformed voters can easily overpower subject-informed analysis. Our project, **TRUTH vs NOISE**, addresses this challenge by transitioning from popular opinion to credibility-weighted decisions without disenfranchising any participant."*

---

### [0:45 – 1:30] 2. The Solution Architecture
> *"Truth vs Noise is built as a modern, decoupled web application using React and Tailwind CSS on the frontend, and FastAPI with PostgreSQL on the backend. The platform provides two distinct user roles: Conductors, who create referendums and define multiple-choice credibility questions, and Candidates, who vote and complete the credibility assessment. Rather than replacing the popular vote, the platform computes and presents both a Raw Community Result and a Credibility-Weighted Result side-by-side."*

---

### [1:30 – 2:15] 3. Conductor Workflow
> *"Let's begin by logging in as our Conductor, Prof. Sarah Jenkins. On the Conductor Dashboard, we can see our managed referendums. When creating a referendum, the conductor specifies ballot options—such as YES, NO, and NEUTRAL—and configures multiple-choice credibility questions. Crucially, the conductor assigns numerical score weights to each choice. Notice the strict lifecycle state machine: DRAFT transitions to PUBLISHED, locking the structure, and then to OPEN for active voting."*

---

### [2:15 – 3:30] 4. Candidate Voting & Score Secrecy
> *"Now, let's switch to the candidate perspective. A candidate browses active referendums and reserves an available participant slot under database row locking. When the candidate opens the referendum, notice our core security principle: **Score Secrecy**. The candidate sees only the question and choice text—zero numerical scores or weight hints are exposed. The candidate answers the questions, selects their ballot option, and clicks CAST MY VOTE."*

---

### [3:30 – 4:30] 5. Server-Side Evaluation & Double-Vote Protection
> *"Upon submission, the FastAPI backend retrieves the secret choice scores directly from PostgreSQL within an atomic ACID transaction. It calculates the candidate's normalized credibility score percentage and permanently snapshots it into the vote record. Double-voting is strictly blocked at both the API and database levels with unique constraints. The candidate immediately receives a sealed confirmation displaying their calculated credibility score."*

---

### [4:30 – 5:30] 6. Results Dashboard & Divergence Demonstration
> *"Once voting concludes, the conductor moves the event to CLOSED and publishes the final results. Let's open the Results Dashboard. Here we see our signature demonstration scenario with 10 total voters. In the **Raw Community Result**, option NO won 60% of the vote (6 votes to 4). However, in the **Credibility-Weighted Result**, option YES earned 67.9612% of the total credibility weight (350 points to 165 points). The dashboard clearly highlights this divergence: popular volume favored NO, but credibility-weighted consensus selected YES as the final platform decision."*

---

### [5:30 – 6:30] 7. Security, Privacy & Data Hygiene
> *"Every result is calculated deterministically on the server with 4-decimal precision. We adhere to a strict Zero-PII policy: published results expose only aggregate counts, sums, and percentages, completely protecting individual voter identities and private answers. Concurrency protection prevents exceeding voter capacity, and results publication is strictly idempotent."*

---

### [6:30 – 7:00] 8. Conclusion & Viva Defense
> *"In conclusion, TRUTH vs NOISE provides organizations with a transparent, mathematically grounded decision tool that respects community participation while highlighting subject-informed consensus. The entire codebase is fully tested, with 0 lint errors and verified end-to-end integration. Thank you, and we welcome your questions."*
