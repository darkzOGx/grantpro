# GrantPro - School District Grant Automation Platform

A B2B SaaS MVP for automating grant discovery, application, and compliance tracking for school districts.

## Features

- 🎯 **Grant Catalog** - Search and filter grants by category (Federal, State, Nutrition, Arts, STEM)
- 📊 **Suitability Scoring** - AI-powered matching scores (0-100%) based on district demographics
- ⚡ **Auto-Apply** - Toggle AI-assisted application drafting
- 📋 **Compliance Pipeline** - Kanban board for post-award deliverable tracking
- 🔄 **Universal Ingestion** - Automated sync from Grants.gov, California Portal, and more

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS
- **Database**: PostgreSQL via Prisma ORM
- **Ingestion**: Grants.gov API, CA Open Data, ProPublica 990

## Quick Start

```bash
npm install
npx prisma generate
cp .env.example .env  # Add your DATABASE_URL
npx prisma db push
npm run dev
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/grants` | GET | List grants with filters |
| `/api/ingestion` | POST | Trigger sync: `{"source": "grants_gov"}` |
| `/api/ingestion` | GET | Get sync status |
| `/api/cron/ingest` | GET | Scheduled daily sync (Vercel Cron) |

## Environment Variables

```bash
DATABASE_URL="postgresql://..."
GRANTS_GOV_API_KEY=""
CRON_SECRET=""
```

## License

Private - All rights reserved
