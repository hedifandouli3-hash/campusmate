# CampusMate V8 — Multi-Tenant Architecture & Policies

- **Tenant Isolation**: Every university has its own `institutionId`, isolated departments, sections, courses, RAG knowledge documents, and license records.
- **Housing Policy**: Only verified `HousingProvider` accounts can publish listings; only general locations (`generalLocation`) are displayed; no rent/deposits are processed online.
- **Sponsorship & Privacy Policy**: Sponsored learning opportunities are strictly labeled `Sponsorisé`, excluded from RAG/AI answers, disabled if `license.sponsorshipsEnabled === false`, and tracked only via privacy-preserving aggregate counters.
- **Marketplace Policy**: Ordinary student listings remain 100% free and moderated before publication.
