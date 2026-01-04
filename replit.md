# Sheet Analyzer

## Overview

Sheet Analyzer is a data analysis and visualization web application that allows users to upload spreadsheets (Excel, CSV) or connect to Google Sheets, then create interactive charts and dashboards. The application is built as a full-stack TypeScript project with a React frontend and Express backend, using PostgreSQL for data persistence.

Key features:
- Project-based organization for data analysis
- Multiple chart types (bar, line, area, scatter, pie)
- Column filtering and aggregations
- Per-project dashboards with drag-and-drop grid layouts
- Global dashboard for cross-project chart pinning
- Browser-based spreadsheet parsing with privacy focus

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight router)
- **State Management**: React Context (`SheetProvider`) with TanStack Query for server state
- **UI Components**: Shadcn/ui (New York style) built on Radix UI primitives
- **Styling**: Tailwind CSS v4 with CSS variables for theming
- **Charts**: Recharts library for data visualization
- **Dashboard Layouts**: react-grid-layout for drag-and-drop responsive grids
- **Build Tool**: Vite

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Pattern**: RESTful endpoints under `/api/*`
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

### Data Storage
- **Database**: PostgreSQL (required via `DATABASE_URL` environment variable)
- **Schema Location**: `shared/schema.ts` using Drizzle table definitions
- **Key Entities**:
  - `projects` - User projects containing sheet data
  - `charts` - Saved chart configurations per project
  - `globalDashboardItems` - Cross-project pinned charts

### Project Structure
```
├── client/           # React frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── lib/          # Utilities and context
│   │   └── hooks/        # Custom React hooks
├── server/           # Express backend
│   ├── index.ts      # Server entry point
│   ├── routes.ts     # API route definitions
│   ├── storage.ts    # Database operations
│   └── db.ts         # Database connection
├── shared/           # Shared types and schema
│   └── schema.ts     # Drizzle database schema
└── migrations/       # Database migrations
```

### Key Design Patterns
- **Monorepo structure**: Client, server, and shared code in single repository
- **Path aliases**: `@/*` for client, `@shared/*` for shared code
- **Type sharing**: Schema and types shared between frontend and backend via `shared/` directory
- **Server-side rendering support**: Vite dev server proxies to Express in development
- **URL-based navigation**: Pages extract projectId from URL params using `useParams()` and set activeProjectId automatically

### Recent Fixes (January 2026)
- **Project creation**: Fixed async/await issue in `handleCreate` - `createProject` returns a Promise that must be awaited
- **Dashboard charts**: Fixed blank charts by using position absolute for ResponsiveContainer sizing
- **Route-based state**: Pages now extract projectId from URL params and set activeProjectId, enabling direct URL navigation
- **React hooks order**: All hooks must be called before any conditional returns to avoid "Rendered more hooks" errors

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **Drizzle Kit**: Database migrations with `npm run db:push`

### Third-Party Libraries
- **xlsx**: Spreadsheet parsing (Excel and CSV)
- **html-to-image / downloadjs**: Chart export functionality
- **react-grid-layout**: Dashboard grid system
- **date-fns**: Date formatting with Spanish locale support

### Replit-Specific Integrations
- **@replit/vite-plugin-runtime-error-modal**: Error overlay in development
- **@replit/vite-plugin-cartographer**: Development tooling
- **@replit/vite-plugin-dev-banner**: Development environment indicator
- **vite-plugin-meta-images**: OpenGraph image handling for Replit deployments

### UI Framework Dependencies
- **Radix UI**: Full suite of accessible primitives (dialogs, dropdowns, tabs, etc.)
- **Tailwind CSS**: Utility-first styling with custom theme variables
- **Lucide React**: Icon library
- **class-variance-authority**: Component variant management