# Pabit - Cybersecurity Social Platform

## Overview

Pabit is a comprehensive cybersecurity social platform that combines social networking features with professional security tools. It provides a unified interface for security professionals to share insights, track vulnerabilities, and access security intelligence through a modern web application.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom cybersecurity theme variables
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (@neondatabase/serverless)
- **Session Management**: PostgreSQL-based sessions with connect-pg-simple
- **Development**: Hot module replacement via Vite middleware

### Database Schema
- **users**: User profiles with roles, reputation, and post counts
- **posts**: Social media posts with tags, likes, comments, and shares
- **cve_entries**: CVE vulnerability database with CVSS scores and severity
- **mitre_attack**: MITRE ATT&CK framework tactics and techniques
- **news_articles**: Security news and updates

## Key Components

### Social Feed System
- Real-time post creation and interaction
- Hashtag extraction and categorization
- Like, comment, and share functionality
- User reputation tracking

### CVE Database
- Comprehensive vulnerability tracking
- CVSS score visualization
- Severity-based filtering and search
- Active exploitation status tracking

### MITRE ATT&CK Integration
- Complete tactics and techniques mapping
- Searchable technique database
- Visual matrix representation
- Security framework navigation

### Security News Aggregation
- Curated security news articles
- Tag-based categorization
- Timestamp tracking
- External link management

## Data Flow

1. **Client Requests**: React components use TanStack Query to fetch data
2. **API Layer**: Express routes handle requests and validate input with Zod schemas
3. **Business Logic**: Storage interface abstracts data operations
4. **Database**: Drizzle ORM manages PostgreSQL interactions
5. **Response**: JSON data returned to client with error handling

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection for Neon Database
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Accessible UI component primitives
- **zod**: Runtime type validation and schema definition

### Development Tools
- **drizzle-kit**: Database migration and schema management
- **tsx**: TypeScript execution for development server
- **esbuild**: Fast bundling for production builds

## Deployment Strategy

### Development
- Vite dev server with HMR for frontend
- TSX for backend TypeScript execution
- Database schema push via Drizzle Kit
- Environment variable configuration for database connection

### Production
- Frontend: Vite build to static assets
- Backend: ESBuild bundle to single Node.js file
- Database: PostgreSQL with connection pooling
- Process: Single node process serving both API and static files

### Build Process
1. Frontend build: `vite build` outputs to `dist/public`
2. Backend build: `esbuild` bundles server to `dist/index.js`
3. Database: Schema migrations via `drizzle-kit push`
4. Startup: Production server serves API and static files

## User Preferences

Preferred communication style: Simple, everyday language.

## Data Sources

### Real-time Security Data Integration
- **CVE Database**: NVD API with CISA KEV integration for active exploitation status
- **MITRE ATT&CK**: GitHub STIX data with comprehensive tactics and techniques
- **Exploits**: ExploitDB integration with fallback generation for CVE-specific exploit code
- **Security News**: Real-time RSS aggregation from multiple sources:
  - The Hacker News (RSS feed)
  - Krebs on Security (RSS feed)
  - BleepingComputer (RSS feed)
  - SecurityWeek (RSS feed)
  - Hacker News (API integration)
  - Reddit Security subreddits (API integration)

### News Aggregation Features
- Smart security-related content filtering with 40+ cybersecurity keywords
- Automatic deduplication and source attribution
- Real-time publication date sorting
- Tag generation for categorization
- Fallback content handling for offline scenarios

### InfoSearch Data Lookup ("Пробив")
- **API Integration**: infosearch54321.xyz for database lookups
- **Authentication**: Secure API token storage via environment variables (INFOSEARCH_API_TOKEN)
- **Search Types**: Basic search and extended multi-level search
- **Profile Management**: API profile info with balance tracking
- **Security**: Auth-protected endpoints, proper error handling for 401 responses
- **UI**: Dedicated search page at `/infosearch` with results display
- **Access**: Quick access button in sidebar for authenticated users

## Changelog

Recent Changes:
- September 30, 2025: Added InfoSearch API integration for data lookup functionality
- September 30, 2025: Created deployment instructions (DEPLOYMENT.md)
- July 03, 2025: Implemented real-time security news aggregation with RSS feeds
- July 03, 2025: Added interactive MITRE ATT&CK technique modals
- July 03, 2025: Integrated CVE exploit database with real code samples
- July 03, 2025: Initial setup