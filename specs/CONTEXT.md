## Project Context

VietnamCV is a long-term, community-oriented platform dedicated specifically to Computer Vision.

The platform must go beyond a traditional AI news aggregator by building a structured, searchable, and interconnected knowledge ecosystem.

### Product Principles
1. Computer Vision first, rather than general-purpose AI news.
2. Vietnamese-first experience with international research coverage.
3. AI-powered aggregation combined with human contributions and moderation.
4. Structured knowledge linking papers, models, datasets, repositories, tutorials, and benchmarks.
5. Open knowledge, community collaboration, and accessible education.
6. High-quality engineering, maintainability, scalability, and security.

### Technical Architecture
- Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui.
- Backend: Python, FastAPI, SQLAlchemy, Alembic.
- Database: PostgreSQL with full-text search and optional pgvector.
- Background Processing: Redis and Celery.
- AI Pipeline: Source ingestion, normalization, deduplication, classification, summarization, entity extraction, and content enrichment.
- Infrastructure: Docker, CI/CD, monitoring, and cloud deployment.
- Architecture Pattern: Modular monolith with clearly defined module boundaries.

### Development Instructions
- Read all attached project specifications before implementation.
- Follow CLAUDE.md as the primary engineering guideline.
- Treat the PRD, architecture, database, API, taxonomy, and delivery documents as the project specification.
- Identify missing requirements, technical risks, and conflicting decisions before coding.
- Implement the project incrementally, following the defined sprint roadmap.
- Do not attempt to implement the entire platform in a single iteration.
- Write clean, strongly typed, maintainable, production-oriented code.
- Include database migrations, validation, error handling, logging, and automated tests.
- Keep implementation consistent with the approved architecture.
- Explain important architectural decisions and trade-offs.
- Do not claim a feature is complete without verification.
- Prioritize MVP features before advanced functionality.

### Expected Collaboration
Act as a senior software architect, full-stack engineer, and AI systems engineer.

Help design, implement, review, test, debug, and progressively improve VietnamCV from initial architecture to production deployment.