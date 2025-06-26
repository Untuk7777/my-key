# Key Generator Application

## Overview

This is a full-stack key generation and validation application built with React frontend and Express backend. The application generates unique keys with the format `FREE-{hex10}-{hex8}` that expire after 24 hours and can be used once. It provides both a web interface for key generation and a REST API for validation.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Styling**: Tailwind CSS with custom CSS variables for theming

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: SQLite3 for key storage, PostgreSQL available for future use
- **Storage**: SQLite database storage with IStorage abstraction
- **Development**: Hot reload with tsx for development server

### Key Components

#### Database Schema
- **Users Table**: Basic user management (id, username, password)
- **Keys Table**: Key storage with metadata (id, name, key, type, length, timestamps, usage tracking)

#### API Endpoints
- `POST /api/keys` - Generate new keys
- `GET /api/keys/file` - Retrieve keys from file storage
- `GET /api/keys/check/:key` - Validate key status

#### Frontend Pages
- **Home Page**: Key generation interface with form inputs and key display
- **Validator Page**: Key validation interface for checking key status
- **404 Page**: Error handling for unknown routes

## Data Flow

1. **Key Generation**: User inputs key name → Frontend sends POST request → Backend generates unique key → Saves to both database and JSON file → Returns key data
2. **Key Validation**: User enters key → Frontend sends GET request → Backend checks key status (valid/expired/used) → Returns validation result
3. **Key Display**: Frontend fetches key data → Displays masked keys for privacy → Shows usage statistics

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives for accessible components
- **Icons**: Lucide React for consistent iconography
- **Form Handling**: React Hook Form with Zod validation
- **Date Utilities**: date-fns for date manipulation
- **Styling**: Class variance authority for component variants

### Backend Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: Drizzle ORM for type-safe database operations
- **Validation**: Zod for runtime type checking
- **Development**: tsx for TypeScript execution

## Deployment Strategy

### Development Environment
- **Port**: 5000 (configured in .replit)
- **Database**: PostgreSQL 16 module
- **Build Process**: Vite dev server with Express backend
- **Hot Reload**: Enabled for both frontend and backend

### Production Deployment
- **Build Command**: `npm run build` (Vite build + esbuild for server)
- **Start Command**: `npm run start` (runs compiled server)
- **Deployment Target**: Autoscale (configured in .replit)
- **Port Mapping**: Internal 5000 → External 80

### Database Management
- **Migrations**: Drizzle Kit for schema management
- **Environment**: DATABASE_URL required for database connection
- **Schema**: Located in `shared/schema.ts` for type sharing

## Changelog

Changelog:
- June 25, 2025. Initial setup  
- June 25, 2025. Replaced keys.json file storage with SQLite3 database
- June 25, 2025. Added rate limiting (1 key per 3 hours)

## User Preferences

Preferred communication style: Simple, everyday language.