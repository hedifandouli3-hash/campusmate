# CampusMate V9 — Social Platform Architecture

- **Social-First Campus Home (`/student/home` & `/api/social`):** 3-column desktop layout (Left Navigation + Central Campus Feed + Right Contextual Sidebar) and 5-item Mobile Bottom Navigation (`Accueil`, `Messages`, `Agent`, `Market`, `Plus`).
- **Normalized Campus Feed:** Aggregates `social_posts`, `announcements`, published `course_documents`, `events`, `marketplace_listings`, `housing_listings`, and `internship_offers` scoped strictly to `user.institutionId`.
- **Anti-Addiction & Privacy Design:** Chronological default, mute/hide/report controls, no public popularity/follower rankings, and strict role checks on official/pinned announcements.
- **Recognized Clubs (`/student/clubs` & `/api/clubs`):** Institution-verified clubs with join/leave membership toggles.
